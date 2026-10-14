import { LANGUAGES } from "../data/mockData";

const nameOf = (code) => LANGUAGES.find((l) => l.code === code)?.name ?? code;

function formatTime(iso) {
  return new Date(iso).toLocaleString("vi-VN", { hour12: false });
}

export default function HistoryPage({ items, onBack, onClear }) {
  return (
    <div className="card">
      <h1 className="page-title">Lịch sử</h1>
      <p className="page-desc">Các video đã xử lý trên máy này.</p>

      {items.length === 0 ? (
        <div className="file-empty">
          <span className="file-empty-icon">🕘</span>
          <div>
            <div className="file-empty-title">Chưa có video nào được xử lý</div>
            <div className="file-empty-sub">
              Video xử lý xong sẽ hiển thị tại đây
            </div>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {items.map((it) => (
            <div key={it.id} className="history-item">
              <div className="file-info">
                <div className="file-name">{it.name}</div>
                <div className="file-size">
                  {formatTime(it.time)} · {(it.size / 1024 / 1024).toFixed(1)}{" "}
                  MB
                </div>
                <div className="history-langs">
                  {it.languages.map((c) => (
                    <span key={c} className="format-chip">
                      {nameOf(c)}
                    </span>
                  ))}
                </div>
              </div>
              <span className="history-status">Hoàn tất</span>
            </div>
          ))}
        </div>
      )}

      <div className="actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Quay lại
        </button>
        {items.length > 0 && (
          <button className="btn-link" onClick={onClear}>
            Xóa lịch sử
          </button>
        )}
      </div>
    </div>
  );
}
