import { useState } from "react";
import { LANGUAGES } from "../data/mockData";

export default function LanguagePage() {
  const [selected, setSelected] = useState([]);

  const toggle = (code) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Chọn ngôn ngữ đích</h1>
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
      <button disabled={selected.length === 0}>Tiếp tục</button>
    </div>
  );
}
