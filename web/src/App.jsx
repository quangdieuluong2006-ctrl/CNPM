import { Fragment, useState } from "react";
import UploadPage from "./pages/UploadPage";
import LanguagePage from "./pages/LanguagePage";
import ProgressPage from "./pages/ProgressPage";
import ResultPage from "./pages/ResultPage";

const STEPS = [
  { key: "upload", label: "Tải lên" },
  { key: "language", label: "Ngôn ngữ" },
  { key: "progress", label: "Xử lý" },
  { key: "result", label: "Kết quả" },
];

function Stepper({ current }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <Fragment key={s.key}>
          <div
            className={`step ${i === idx ? "active" : ""} ${
              i < idx ? "done" : ""
            }`}
          >
            <span className="step-num">{i < idx ? "✓" : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${i < idx ? "done" : ""}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [languages, setLanguages] = useState([]);

  const restart = () => {
    setFile(null);
    setLanguages([]);
    setStep("upload");
  };

  let page;
  if (step === "language") {
    page = (
      <LanguagePage
        selected={languages}
        onSelectedChange={setLanguages}
        onBack={() => setStep("upload")}
        onNext={() => setStep("progress")}
      />
    );
  } else if (step === "progress") {
    page = (
      <ProgressPage
        file={file}
        languages={languages}
        onDone={() => setStep("result")}
        onCancel={() => setStep("language")}
      />
    );
  } else if (step === "result") {
    page = <ResultPage file={file} languages={languages} onRestart={restart} />;
  } else {
    page = (
      <UploadPage
        file={file}
        onFileChange={setFile}
        onNext={() => setStep("language")}
      />
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="logo">🎬</div>
        <div>
          <div className="app-title">Thuyết minh đa ngôn ngữ</div>
          <div className="app-sub">Lồng tiếng video tự động</div>
        </div>
      </header>
      <Stepper current={step} />
      {page}
    </>
  );
}
