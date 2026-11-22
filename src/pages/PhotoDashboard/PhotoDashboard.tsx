import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import client from "../../dataClient";
import "./PhotoDashboard.css";

type PhotoDashboardProps = {
  user: {
    username: string;
    displayName?: string;
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
  imageKey: string;
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

const DELETE_PHOTO = `
  mutation DeletePhoto($input: DeletePhotoInput!) {
    deletePhoto(input: $input) {
      id
    }
  }
`;

function PhotoDashboard({ user, onSignOut }: PhotoDashboardProps) {
  const displayName =
    user.displayName && !/^google[_-]/i.test(user.displayName)
      ? user.displayName
      : user.username && !/^google[_-]/i.test(user.username)
        ? user.username
        : "SnapShare member";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState("");
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [error, setError] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [downloadingPhoto, setDownloadingPhoto] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (!preview) return;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!viewingPhoto) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setViewingPhoto(null);
        setDownloadError("");
      }
    }

    document.body.classList.add("photo-viewer-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("photo-viewer-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewingPhoto]);

  async function handleDownload(photo: Photo) {
    try {
      setDownloadingPhoto(true);
      setDownloadError("");

      const { url } = await getUrl({
        path: photo.imageKey,
        options: {
          contentDisposition: {
            type: "attachment",
            filename: photo.name,
          },
        },
      });
      const link = document.createElement("a");
      link.href = url.toString();
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadFailure) {
      console.error("Photo download failed:", downloadFailure);
      setDownloadError(
        "Could not prepare this photo for download. Please try again.",
      );
    } finally {
      setDownloadingPhoto(false);
    }
  }

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
              imageKey: record.imageKey,
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

      const uploadTask = uploadData({
        path: filePath,
        data: selectedFile,
        options: {
          contentType: selectedFile.type,
        },
      });

      await uploadTask.result;

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

  async function handleDelete(photo: Photo) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${photo.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingPhotoId(photo.id);
      setError("");

      // Step 1: Delete the photo record from GraphQL.
      const response = (await client.graphql({
        query: DELETE_PHOTO,
        variables: {
          input: {
            id: photo.id,
          },
        },
        authMode: "userPool",
      })) as GraphQLResponse<{
        deletePhoto: { id: string } | null;
      }>;

      if (response.errors?.length) {
        throw new Error(response.errors.map((item) => item.message).join("; "));
      }

      if (!response.data?.deletePhoto) {
        throw new Error("Photo record could not be deleted.");
      }

      // Step 2: Delete the actual image from S3.
      try {
        await remove({
          path: photo.imageKey,
        });
      } catch (storageError) {
        console.error("S3 image deletion failed:", storageError);
        setPhotos((current) => current.filter((item) => item.id !== photo.id));
        setError(
          "The photo record was deleted, but its S3 image could not be removed.",
        );
        return;
      }

      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (err) {
      console.error("Photo deletion failed:", err);
      setError("Could not delete this photo. Please try again.");
    } finally {
      setDeletingPhotoId("");
    }
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <a className="brand" href="/">
          <img className="brand-icon" src="/favicon.png" alt="" />
          SnapShare
        </a>

        <div className="nav-right">
          <span className="user-name" title={displayName}>
            {displayName}
          </span>

          <button className="logout-button" onClick={onSignOut} type="button">
            Sign out
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="dashboard-heading">
          <div className="dashboard-welcome">
            <span className="eyebrow">YOUR LITTLE CORNER</span>
            <h1>
              Good to see you
              <span className="welcome-name">
                , {displayName.split(" ")[0]}.
              </span>
            </h1>
            <p>A home for the photos you want to keep close.</p>
          </div>

          <div className="photo-count" aria-live="polite">
            <strong>{photos.length}</strong>
            <span>{photos.length === 1 ? "photo saved" : "photos saved"}</span>
          </div>
        </section>

        <section className="upload-card">
          <div className="upload-copy">
            <span className="upload-kicker">ADD TO YOUR COLLECTION</span>
            <div className="upload-heading">
              <h2>Save a new moment</h2>
              <p>Choose a photo from your device to add it to your gallery.</p>
            </div>

            <label className="file-input-label">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <span className="upload-icon" aria-hidden="true">
                +
              </span>
              <span>
                <strong>Choose a photo</strong>
                <small>JPG, PNG or another image</small>
              </span>
              <span className="choose-arrow" aria-hidden="true">
                ↗
              </span>
            </label>

            {preview && (
              <div className="preview-section">
                <img src={preview} alt="Selected preview" />

                <div className="preview-details">
                  <strong>{selectedFile?.name}</strong>
                  <span>Ready to be added</span>
                </div>

                <button
                  className="primary-button"
                  onClick={handleUpload}
                  disabled={uploading}
                  type="button"
                >
                  {uploading ? "Uploading..." : "Upload photo"}
                </button>
              </div>
            )}

            {error && <p className="upload-error">{error}</p>}
          </div>
          <div className="upload-art" aria-hidden="true">
            <div className="art-sun" />
            <div className="art-frame">
              <span />
              <span />
              <span />
            </div>
            <p>
              Little things
              <br />
              worth remembering.
            </p>
          </div>
        </section>

        <section className="gallery-section">
          <div className="gallery-heading">
            <div>
              <span className="gallery-kicker">THE GOOD STUFF</span>
              <h2>Your collection</h2>
            </div>
            {photos.length > 0 && (
              <span className="gallery-total">{photos.length} items</span>
            )}
          </div>

          {loadingPhotos ? (
            <div className="empty-gallery">
              <span className="loading-mark" aria-hidden="true" />
              <h3>Gathering your photos</h3>
              <p>Your gallery will be ready in a moment.</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="empty-gallery">
              <div className="empty-icon" aria-hidden="true">
                ✳
              </div>
              <h3>A fresh page</h3>
              <p>Your collection is waiting for its first photo.</p>
            </div>
          ) : (
            <div className="photo-grid">
              {photos.map((photo) => (
                <article className="photo-card" key={photo.id}>
                  <div className="photo-image">
                    <img src={photo.url} alt={photo.name} loading="lazy" />
                    <button
                      className="photo-view-button"
                      type="button"
                      onClick={() => {
                        setViewingPhoto(photo);
                        setDownloadError("");
                      }}
                      aria-label={`View ${photo.name}`}
                      title={`View ${photo.name}`}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="10.8" cy="10.8" r="6.8" />
                        <path d="m16 16 4.2 4.2M10.8 7.5v6.6M7.5 10.8h6.6" />
                      </svg>
                    </button>
                  </div>

                  <div className="photo-info">
                    <strong>{photo.name}</strong>

                    <button
                      className="photo-delete-button"
                      onClick={() => void handleDelete(photo)}
                      type="button"
                      aria-label={`Delete ${photo.name}`}
                      disabled={
                        deletingPhotoId === photo.id || deletingPhotoId !== ""
                      }
                    >
                      {deletingPhotoId === photo.id
                        ? "Deleting..."
                        : "Delete photo"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {viewingPhoto && (
        <div
          className="photo-viewer-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewingPhoto(null);
              setDownloadError("");
            }
          }}
        >
          <section
            className="photo-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Photo viewer: ${viewingPhoto.name}`}
          >
            <div className="photo-viewer-image">
              <img src={viewingPhoto.url} alt={viewingPhoto.name} />
            </div>
            <aside className="photo-viewer-sidebar">
              <button
                className="photo-viewer-close"
                type="button"
                onClick={() => {
                  setViewingPhoto(null);
                  setDownloadError("");
                }}
                aria-label="Close photo viewer"
                title="Close"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
              <div className="photo-viewer-details">
                <span className="gallery-kicker">YOUR COLLECTION</span>
                <h2>{viewingPhoto.name}</h2>
                <p>One of the moments you chose to keep.</p>
              </div>
              <button
                className="photo-download-button"
                type="button"
                onClick={() => void handleDownload(viewingPhoto)}
                disabled={downloadingPhoto}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
                </svg>
                {downloadingPhoto ? "Preparing download..." : "Download photo"}
              </button>
              {downloadError && (
                <p className="photo-download-error" role="alert">
                  {downloadError}
                </p>
              )}
            </aside>
          </section>
        </div>
      )}

      <footer className="footer">Made for the moments you want to keep.</footer>
    </div>
  );
}

export default PhotoDashboard;
