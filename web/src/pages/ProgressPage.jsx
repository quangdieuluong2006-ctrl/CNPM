import { useEffect, useState } from "react";
import { LANGUAGES } from "../data/mockData";

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

  const names = languages.map(
    (c) => LANGUAGES.find((l) => l.code === c)?.name ?? c,
  );

  return (
    <div className="card">
      <h1 className="page-title">Đang xử lý</h1>
      <p className="page-desc">
        {file?.name} → {names.join(", ")}
      </p>

      <div className="percent">{percent}%</div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="status">{getStatus(percent)}</p>

      {percent < 100 && (
        <div className="actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
