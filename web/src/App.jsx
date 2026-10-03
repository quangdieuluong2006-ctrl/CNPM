import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import LanguagePage from "./pages/LanguagePage";
import ProgressPage from "./pages/ProgressPage";
import ResultPage from "./pages/ResultPage";

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
    return <ResultPage file={file} languages={languages} onRestart={restart} />;
  }

  return (
    <UploadPage
      file={file}
      onFileChange={setFile}
      onNext={() => setStep("language")}
    />
  );
}
