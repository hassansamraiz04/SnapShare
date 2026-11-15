
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { uploadData, getUrl, list } from 'aws-amplify/storage';
import './PhotoDashboard.css';

type PhotoDashboardProps = {
  user: {
    username: string;
  };
  onSignOut: () => void;
};

type Photo = {
  id: string;
  name: string;
  url: string;
};

function PhotoDashboard({ user, onSignOut }: PhotoDashboardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!preview) return;

    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function loadPhotos() {
    try {
      setError('');

      const result = await list({
        path: 'photos/',
      });

      const loadedPhotos = await Promise.all(
        result.items.map(async (item) => {
          const imageResult = await getUrl({
            path: item.path,
          });

          const fileName = item.path.split('/').pop() || 'Photo';

          return {
            id: item.path,
            name: fileName,
            url: imageResult.url.toString(),
          };
        })
      );

      setPhotos(loadedPhotos.reverse());
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Could not load photos. Please check your AWS storage permissions.');
    } finally {
      setLoadingPhotos(false);
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert('Please select a photo first.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `photos/${Date.now()}-${safeFileName}`;

      const uploadTask = uploadData({
        path: filePath,
        data: selectedFile,
        options: {
          contentType: selectedFile.type,
        },
      });

      await uploadTask.result;

      setSelectedFile(null);
      setPreview('');

      await loadPhotos();

      alert('Photo uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Photo upload failed. Please check your AWS storage permissions and try again.');
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
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
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
                {uploading ? 'Uploading...' : 'Upload photo'}
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

      <footer className="footer">
        © 2026 SnapShare. Share your moments.
      </footer>
    </div>
  );
}

export default PhotoDashboard;
