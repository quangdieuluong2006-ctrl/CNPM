import { Fragment, useCallback, useState } from "react";
import { useAuth } from "./auth/useAuth";
import AuthPage from "./pages/AuthPage";
import { usePresence } from "./realtime/usePresence";
import UploadPage from "./pages/UploadPage";
import LanguagePage from "./pages/LanguagePage";
import ProgressPage from "./pages/ProgressPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";

const STEPS = [
  { key: "upload", label: "Tải lên" },
  { key: "language", label: "Ngôn ngữ" },
  { key: "progress", label: "Xử lý" },
  { key: "result", label: "Kết quả" },
];

const STORAGE_KEY = "dubbing-history";

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // bỏ qua nếu trình duyệt chặn lưu trữ
  }
}

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

// Chưa đăng nhập thì chỉ thấy trang Đăng nhập/Đăng ký; đăng nhập xong mới vào luồng thuyết minh.
export default function App() {
  const { status } = useAuth();
  if (status === "loading") return <p className="note">Đang kiểm tra phiên đăng nhập…</p>;
  if (status === "guest") return <AuthPage />;
  return <DubbingApp />;
}

function UserBar() {
  const { user, logout } = useAuth();
  const onRevoked = useCallback(
    (reason) => {
      if (reason === "ACCOUNT_LOCKED") alert("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
      void logout();
    },
    [logout],
  );
  const online = usePresence(true, onRevoked);

  return (
    <div className="user-bar">
      <span className={`online-dot ${online ? "on" : ""}`} aria-hidden="true" />
      <span className="user-bar-name">
        {user.fullName}
        <span className="user-bar-status">{online ? "Đang trực tuyến" : "Đang kết nối…"}</span>
      </span>
      <button className="btn-link" onClick={() => void logout()}>
        Đăng xuất
      </button>
    </div>
  );
}

function DubbingApp() {
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [history, setHistory] = useState(loadHistory);

  const restart = () => {
    setFile(null);
    setLanguages([]);
    setStep("upload");
  };

  const finishJob = () => {
    const entry = {
      id: Date.now(),
      name: file?.name ?? "Không rõ tên",
      size: file?.size ?? 0,
      languages,
      time: new Date().toISOString(),
    };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    saveHistory(next);
    setStep("result");
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  let page;
  if (step === "history") {
    page = (
      <HistoryPage
        items={history}
        onBack={() => setStep("upload")}
        onClear={clearHistory}
      />
    );
  } else if (step === "language") {
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
        onDone={finishJob}
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
        {step !== "progress" && step !== "history" && (
          <button
            className="btn btn-secondary header-history"
            onClick={() => setStep("history")}
          >
            Lịch sử ({history.length})
          </button>
        )}
      </header>
      <UserBar />
      {step !== "history" && <Stepper current={step} />}
      {page}
    </>
  );
}
