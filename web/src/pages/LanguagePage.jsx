import { LANGUAGES } from "../data/mockData";

export default function LanguagePage({
  selected,
  onSelectedChange,
  onBack,
  onNext,
}) {
  const toggle = (code) => {
    onSelectedChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code],
    );
  };

  return (
    <div className="card">
      <h1 className="page-title">Chọn ngôn ngữ đích</h1>
      <p className="page-desc">Có thể chọn nhiều ngôn ngữ cùng lúc.</p>

      <div className="lang-grid">
        {LANGUAGES.map((lang) => {
          const on = selected.includes(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              aria-pressed={on}
              className={`lang-item ${on ? "selected" : ""}`}
              onClick={() => toggle(lang.code)}
            >
              <span className="lang-badge">{lang.code.toUpperCase()}</span>
              <span className="lang-name">{lang.name}</span>
              <span className="lang-check">{on ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>

      <p className="selected-count">Đã chọn: {selected.length} ngôn ngữ</p>

      <div className="actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Quay lại
        </button>
        <button
          className="btn"
          disabled={selected.length === 0}
          onClick={onNext}
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
