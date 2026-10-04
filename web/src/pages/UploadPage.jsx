import { useRef, useState } from "react";

const FORMATS = ["MP4", "MOV", "MKV", "MP3", "WAV"];

export default function UploadPage({ file, onFileChange, onNext }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (f && (f.type.startsWith("video/") || f.type.startsWith("audio/"))) {
      onFileChange(f);
    }
  };

  return (
    <div className="card">
      <h1 className="page-title page-title-lg">Tải video lên</h1>
      <p className="page-desc page-desc-lg">
        Chọn video hoặc audio cần lồng tiếng sang ngôn ngữ khác.
      </p>

      <div
        className={`dropzone dropzone-lg ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <div className="dropzone-circle">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
          </svg>
        </div>
        <p className="dropzone-title">Kéo thả file vào đây</p>
        <p className="dropzone-hint">hoặc</p>
        <span className="btn btn-lg">Chọn tệp từ máy</span>
        <div className="format-row">
          {FORMATS.map((f) => (
            <span key={f} className="format-chip">
              {f}
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {file ? (
        <div className="file-chip file-chip-lg">
          <span className="file-icon">🎞️</span>
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-size">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
          <button className="btn-link" onClick={() => onFileChange(null)}>
            Xóa
          </button>
        </div>
      ) : (
        <div className="file-empty">
          <span className="file-empty-icon">📄</span>
          <div>
            <div className="file-empty-title">Chưa có tệp nào được chọn</div>
            <div className="file-empty-sub">
              Tệp bạn chọn sẽ hiển thị tại đây
            </div>
          </div>
        </div>
      )}

      <div className="actions">
        <span />
        <button className="btn btn-lg" disabled={!file} onClick={onNext}>
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
