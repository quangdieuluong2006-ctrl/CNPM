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
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32 }}>Kết quả</h1>
      <p>Đã xử lý xong: {file?.name}</p>
      <div style={{ margin: "12px 0" }}>
        {languages.map((code) => (
          <button
            key={code}
            onClick={() => setActive(code)}
            disabled={code === active}
            style={{ marginRight: 8 }}
          >
            {nameOf(code)}
          </button>
        ))}
      </div>
      {url &&
        (isVideo ? (
          <video src={url} controls style={{ width: "100%" }} />
        ) : (
          <audio src={url} controls style={{ width: "100%" }} />
        ))}
      <p style={{ fontSize: 14, opacity: 0.7 }}>
        Bản demo: đang phát file gốc, chưa có giọng lồng tiếng thật.
      </p>
      <a href={url} download={`${baseName}_${active}.${ext}`}>
        <button>Tải về bản {nameOf(active)}</button>
      </a>{" "}
      <button onClick={onRestart}>Làm video mới</button>
    </div>
  );
}
