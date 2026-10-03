import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import LanguagePage from "./pages/LanguagePage";

export default function App() {
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [languages, setLanguages] = useState([]);

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
      <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 32 }}>Tiến trình xử lý</h1>
        <p>File: {file?.name}</p>
        <p>Ngôn ngữ: {languages.join(", ")}</p>
        <button onClick={() => setStep("language")}>Quay lại</button>
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
