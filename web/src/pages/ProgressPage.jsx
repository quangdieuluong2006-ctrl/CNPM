import { useEffect, useState } from "react";

function getStatus(percent) {
  if (percent < 30) return "Đang nhận dạng giọng nói...";
  if (percent < 60) return "Đang dịch văn bản...";
  if (percent < 90) return "Đang tạo giọng đọc...";
  if (percent < 100) return "Đang ghép vào video...";
  return "Hoàn tất!";
}

export default function ProgressPage({ file, languages, onDone, onCancel }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPercent((p) => Math.min(p + 5, 100));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (percent === 100) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [percent, onDone]);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32 }}>Tiến trình xử lý</h1>
      <p>File: {file?.name}</p>
      <p>Ngôn ngữ: {languages.join(", ")}</p>
      <progress value={percent} max="100" style={{ width: "100%" }} />
      <p>
        {percent}% - {getStatus(percent)}
      </p>
      {percent < 100 && <button onClick={onCancel}>Hủy</button>}
    </div>
  );
}
