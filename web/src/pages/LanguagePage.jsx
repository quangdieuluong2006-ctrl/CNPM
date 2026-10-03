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
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32 }}>Chọn ngôn ngữ đích</h1>
      {LANGUAGES.map((lang) => (
        <label key={lang.code} style={{ display: "block", margin: "8px 0" }}>
          <input
            type="checkbox"
            checked={selected.includes(lang.code)}
            onChange={() => toggle(lang.code)}
          />{" "}
          {lang.name}
        </label>
      ))}
      <p>Đã chọn: {selected.length} ngôn ngữ</p>
      <button onClick={onBack}>Quay lại</button>{" "}
      <button disabled={selected.length === 0} onClick={onNext}>
        Tiếp tục
      </button>
    </div>
  );
}
