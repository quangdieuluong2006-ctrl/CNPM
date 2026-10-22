import { Fragment, useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth/useAuth";
import { IconCheck, IconHistory } from "./components/icons";
import Logo from "./components/Logo";
import UserMenu from "./components/UserMenu";
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

// Thanh trên cùng: logo, nút Lịch sử, ảnh đại diện + trạng thái trực tuyến (thay cho khung người dùng riêng).
function TopBar({ historyCount, onHistory, showHistory }) {
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
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <Logo size={34} />
          <div className="brand-text">
            <span className="brand-name">Thuyết minh</span>
            <span className="brand-sub">đa ngôn ngữ</span>
          </div>
        </div>
        <div className="topbar-actions">
          {showHistory && (
            <button className="icon-btn" onClick={onHistory} aria-label={`Lịch sử (${historyCount})`}>
              <IconHistory size={20} />
              <span className="icon-btn-label">Lịch sử</span>
              {historyCount > 0 && <span className="badge">{historyCount}</span>}
            </button>
          )}
          <UserMenu user={user} online={online} onLogout={() => void logout()} />
        </div>
      </div>
    </header>
  );
}

// Lời chào ngắn sau khi đăng nhập/đăng ký – người quét QR thấy ngay mình đã vào hệ thống.
function WelcomeToast() {
  const { user, welcome, dismissWelcome } = useAuth();
  useEffect(() => {
    if (!welcome) return undefined;
    const t = setTimeout(dismissWelcome, 6000);
    return () => clearTimeout(t);
  }, [welcome, dismissWelcome]);
  if (!welcome) return null;
  const firstName = user.fullName.trim().split(/\s+/).pop();
  return (
    <div className="toast" role="status">
      <span className="toast-icon">
        <IconCheck size={18} />
      </span>
      <div>
        <div className="toast-title">
          {welcome === "register" ? `Chào mừng ${firstName}!` : `Chào ${firstName}!`}
        </div>
        <div className="toast-sub">
          {welcome === "register" ? "Tài khoản đã được tạo – bạn đang trực tuyến." : "Bạn đang trực tuyến."}
        </div>
      </div>
      <button className="toast-close" onClick={dismissWelcome} aria-label="Đóng">
        ×
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
      <TopBar historyCount={history.length} onHistory={() => setStep("history")} showHistory={step !== "progress" && step !== "history"} />
      <main className="app-shell">
        <WelcomeToast />
        {step !== "history" && <Stepper current={step} />}
        {page}
      </main>
    </>
  );
}
