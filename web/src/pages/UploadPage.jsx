export default function UploadPage({ file, onFileChange, onNext }) {
  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32 }}>Tải video lên</h1>
      <input
        type="file"
        accept="video/*,audio/*"
        onChange={(e) => onFileChange(e.target.files[0] || null)}
      />
      {file && (
        <p>
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </p>
      )}
      <button disabled={!file} onClick={onNext}>
        Tiếp tục
      </button>
    </div>
  );
}
