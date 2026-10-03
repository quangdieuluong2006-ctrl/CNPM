import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import LanguagePage from "./pages/LanguagePage";
import ProgressPage from "./pages/ProgressPage";
import { LANGUAGES } from "./data/mockData";

export default function App() {
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [languages, setLanguages] = useState([]);

  const restart = () => {
    setFile(null);
    setLanguages([]);
    setStep("upload");
  };

  if (step === "language") {
    return (
      <LanguagePage
        selected={languages}
        onSelectedChange={setLanguages}
        onBack={() => setStep("upload")}
        onNext={() => setStep("progress")}
      />
    );
  }

  if (step === "progress") {
    return (
      <ProgressPage
        file={file}
        languages={languages}
        onDone={() => setStep("result")}
        onCancel={() => setStep("language")}
      />
    );
  }

  if (step === "result") {
    const names = languages.map(
      (code) => LANGUAGES.find((l) => l.code === code)?.name ?? code,
    );
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 32 }}>Kết quả</h1>
        <p>Đã xử lý xong: {file?.name}</p>
        <p>Các bản lồng tiếng: {names.join(", ")}</p>
        <button onClick={restart}>Làm video mới</button>
      </div>
    );
  }

  return (
    <UploadPage
      file={file}
      onFileChange={setFile}
      onNext={() => setStep("language")}
    />
  );
}
