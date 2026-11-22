import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData, getUrl } from "aws-amplify/storage";
import client from "../../dataClient";
import "./PhotoDashboard.css";

type PhotoDashboardProps = {
  user: {
    username: string;
  };
  onSignOut: () => void;
};

type PhotoRecord = {
  id: string;
  title: string;
  description?: string | null;
  imageKey: string;
  fileName: string;
  contentType?: string | null;
  createdAt: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

type Photo = {
  id: string;
  name: string;
  url: string;
};

const LIST_PHOTOS = `
  query ListPhotos($limit: Int) {
    listPhotos(limit: $limit) {
      items {
        id
        title
        description
        imageKey
        fileName
        contentType
        createdAt
      }
      nextToken
    }
  }
`;

const CREATE_PHOTO = `
  mutation CreatePhoto($input: CreatePhotoInput!) {
    createPhoto(input: $input) {
      id
      title
      description
      imageKey
      fileName
      contentType
      createdAt
    }
  }
`;

function PhotoDashboard({ user, onSignOut }: PhotoDashboardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!preview) return;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const loadPhotos = useCallback(async () => {
    try {
      setLoadingPhotos(true);
      setError("");

      const response = (await client.graphql({
        query: LIST_PHOTOS,
        variables: {
          limit: 100,
        },
        authMode: "userPool",
      })) as GraphQLResponse<{
        listPhotos: {
          items: PhotoRecord[];
          nextToken?: string | null;
        };
      }>;

      if (response.errors?.length) {
        throw new Error(response.errors.map((item) => item.message).join("; "));
      }

      const records = response.data?.listPhotos?.items ?? [];

      const loadedPhotos = await Promise.all(
        records.map(async (record) => {
          try {
            const imageResult = await getUrl({
              path: record.imageKey,
            });

            return {
              id: record.id,
              name: record.fileName,
              url: imageResult.url.toString(),
            };
          } catch (err) {
            console.warn(`Could not access photo ${record.fileName}:`, err);

            return null;
          }
        }),
      );

      const availablePhotos = loadedPhotos.filter(
        (photo): photo is Photo => photo !== null,
      );

      setPhotos(availablePhotos.reverse());

      if (availablePhotos.length < records.length) {
        setError(
          "Some older photos are stored in the previous shared folder. Please upload them again to your personal gallery.",
        );
      }
    } catch (err) {
      console.error("Error loading photos from GraphQL:", err);
      setError(
        "Could not load photos from the database. Please check your GraphQL permissions.",
      );
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert("Please select a photo first.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const session = await fetchAuthSession();
      const identityId = session.identityId;

      if (!identityId) {
        throw new Error("Could not get the signed-in user's identity ID.");
      }

      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      const filePath = `photos/${identityId}/${Date.now()}-${safeFileName}`;

      // Step 1: Upload the image to the user's private S3 folder.
      const uploadTask = uploadData({
        path: filePath,
        data: selectedFile,
        options: {
          contentType: selectedFile.type,
        },
      });

      await uploadTask.result;

      // Step 2: Save the image details in the GraphQL database.
      const title = selectedFile.name.replace(/\.[^/.]+$/, "");

      const response = (await client.graphql({
        query: CREATE_PHOTO,
        variables: {
          input: {
            title,
            imageKey: filePath,
            fileName: selectedFile.name,
            contentType: selectedFile.type,
          },
        },
        authMode: "userPool",
      })) as GraphQLResponse<{
        createPhoto: PhotoRecord | null;
      }>;

      if (response.errors?.length) {
        throw new Error(response.errors.map((item) => item.message).join("; "));
      }

      if (!response.data?.createPhoto) {
        throw new Error("Photo information was not saved in the database.");
      }

      setSelectedFile(null);
      setPreview("");

      await loadPhotos();

      alert("Photo uploaded and saved successfully!");
    } catch (err) {
      console.error("Upload or GraphQL error:", err);

      setError(
        "Photo upload or database save failed. Check the browser console for details.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">S</span>
          SnapShare
        </a>

        <div className="nav-right">
          <span className="user-name">{user.username}</span>

          <button className="logout-button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="dashboard-heading">
          <div>
            <span className="eyebrow">YOUR PERSONAL SPACE</span>
            <h1>Your photo collection</h1>
            <p>Keep your favourite moments together.</p>
          </div>

          <span className="photo-count">{photos.length} photos</span>
        </section>

        <section className="upload-card">
          <div className="upload-heading">
            <h2>Share a new moment</h2>
            <p>Select an image to upload it to your SnapShare gallery.</p>
          </div>

          <label className="file-input-label">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <span className="upload-icon">+</span>
            <strong>Choose a photo</strong>
            <span>JPG, PNG or other image formats</span>
          </label>

          {preview && (
            <div className="preview-section">
              <img src={preview} alt="Selected preview" />

              <div className="preview-details">
                <strong>{selectedFile?.name}</strong>
                <span>Ready to upload</span>
              </div>

              <button
                className="primary-button"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload photo"}
              </button>
            </div>
          )}

          {error && <p className="upload-error">{error}</p>}
        </section>

        <section className="gallery-section">
          <div className="gallery-heading">
            <div>
              <h2>Your gallery</h2>
              <p>Your photos are stored securely in AWS S3.</p>
            </div>
          </div>

          {loadingPhotos ? (
            <div className="empty-gallery">
              <h3>Loading your photos...</h3>
            </div>
          ) : photos.length === 0 ? (
            <div className="empty-gallery">
              <div className="empty-icon">▧</div>
              <h3>No photos yet</h3>
              <p>Upload your first photo to get started.</p>
            </div>
          ) : (
            <div className="photo-grid">
              {photos.map((photo) => (
                <article className="photo-card" key={photo.id}>
                  <img src={photo.url} alt={photo.name} />
                  <div className="photo-info">
                    <strong>{photo.name}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">© 2026 SnapShare. Share your moments.</footer>
    </div>
  );
}

export default PhotoDashboard;
