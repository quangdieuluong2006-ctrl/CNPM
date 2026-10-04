import { useEffect, useState } from "react";
import { LANGUAGES } from "../data/mockData";

export default function ResultPage({ file, languages, onRestart }) {
  const [url, setUrl] = useState(null);
  const [active, setActive] = useState(languages[0]);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const nameOf = (code) => LANGUAGES.find((l) => l.code === code)?.name ?? code;

  const isVideo = file?.type.startsWith("video/");
  const baseName = file?.name.replace(/\.[^.]+$/, "");
  const ext = file?.name.split(".").pop();

  return (
    <div className="card">
      <h1 className="page-title">Hoàn tất 🎉</h1>
      <p className="page-desc">{file?.name}</p>

      <div className="tabs">
        {languages.map((code) => (
          <button
            key={code}
            className={`tab ${code === active ? "active" : ""}`}
            onClick={() => setActive(code)}
          >
            {nameOf(code)}
          </button>
        ))}
      </div>

      {url &&
        (isVideo ? <video src={url} controls /> : <audio src={url} controls />)}

      <p className="note">
        Bản demo: đang phát file gốc, chưa có giọng lồng tiếng thật.
      </p>

      <div className="actions">
        <button className="btn btn-secondary" onClick={onRestart}>
          Làm video mới
        </button>
        <a className="btn" href={url} download={`${baseName}_${active}.${ext}`}>
          Tải về bản {nameOf(active)}
        </a>
      </div>
    </div>
  );
}
