import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Tải video lên</h1>
      <input
        type="file"
        accept="video/*,audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      {file && (
        <p>
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </p>
      )}
      <button disabled={!file}>Tiếp tục</button>
    </div>
  );
}
