import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LANGUAGES } from "../data/mockData";

type Step = "upload" | "language" | "progress" | "result" | "history";

type HistoryItem = {
  id: number;
  name: string;
  size: number;
  languages: string[];
  time: string;
};

const STORAGE_KEY = "dubbing-history";

function formatTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

type PickedFile = { name: string; size?: number; uri: string };

const STEP_LABELS = ["Tải lên", "Ngôn ngữ", "Xử lý", "Kết quả"];
const STEP_ORDER: Step[] = ["upload", "language", "progress", "result"];

function nameOf(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function Button({
  label,
  onPress,
  disabled,
  secondary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        secondary && styles.btnSecondary,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[styles.btnText, secondary && styles.btnTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Stepper({ current }: { current: Step }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <View style={styles.stepper}>
      {STEP_LABELS.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= idx && styles.stepDotActive]}>
            <Text style={[styles.stepNum, i <= idx && styles.stepNumActive]}>
              {i < idx ? "✓" : i + 1}
            </Text>
          </View>
          <Text style={[styles.stepLabel, i === idx && styles.stepLabelActive]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function UploadScreen({
  file,
  onPick,
  onNext,
}: {
  file: PickedFile | null;
  onPick: (f: PickedFile | null) => void;
  onNext: () => void;
}) {
  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["video/*", "audio/*"],
      copyToCacheDirectory: true,
    });
    if (!res.canceled) {
      const a = res.assets[0];
      onPick({ name: a.name, size: a.size, uri: a.uri });
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tải video lên</Text>
      <Text style={styles.desc}>
        Chọn video hoặc audio cần lồng tiếng sang ngôn ngữ khác.
      </Text>

      <Pressable onPress={pick} style={styles.dropzone}>
        <Text style={styles.dropIcon}>⬆️</Text>
        <Text style={styles.dropTitle}>Chọn tệp từ máy</Text>
        <Text style={styles.dropHint}>MP4 · MOV · MKV · MP3 · WAV</Text>
      </Pressable>

      {file ? (
        <View style={styles.fileBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            {file.size != null && (
              <Text style={styles.fileSub}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </Text>
            )}
          </View>
          <Pressable onPress={() => onPick(null)}>
            <Text style={styles.link}>Xóa</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.fileBox, styles.fileEmpty]}>
          <Text style={styles.fileSub}>Chưa có tệp nào được chọn</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button label="Tiếp tục →" onPress={onNext} disabled={!file} />
      </View>
    </View>
  );
}

function LanguageScreen({
  selected,
  onChange,
  onBack,
  onNext,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggle = (code: string) =>
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code],
    );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Chọn ngôn ngữ đích</Text>
      <Text style={styles.desc}>Có thể chọn nhiều ngôn ngữ cùng lúc.</Text>

      {LANGUAGES.map((lang) => {
        const on = selected.includes(lang.code);
        return (
          <Pressable
            key={lang.code}
            onPress={() => toggle(lang.code)}
            style={[styles.langItem, on && styles.langItemOn]}
          >
            <View style={[styles.badge, on && styles.badgeOn]}>
              <Text style={[styles.badgeText, on && styles.badgeTextOn]}>
                {lang.code.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.langName}>{lang.name}</Text>
            <Text style={styles.check}>{on ? "✓" : ""}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.fileSub}>Đã chọn: {selected.length} ngôn ngữ</Text>

      <View style={styles.actions}>
        <Button label="← Quay lại" onPress={onBack} secondary />
        <Button
          label="Tiếp tục →"
          onPress={onNext}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

function getStatus(p: number) {
  if (p < 30) return "Đang nhận dạng giọng nói...";
  if (p < 60) return "Đang dịch văn bản...";
  if (p < 90) return "Đang tạo giọng đọc...";
  if (p < 100) return "Đang ghép vào video...";
  return "Hoàn tất!";
}

function ProgressScreen({
  file,
  languages,
  onDone,
  onCancel,
}: {
  file: PickedFile | null;
  languages: string[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPercent((p) => Math.min(p + 5, 100));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (percent === 100) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [percent, onDone]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Đang xử lý</Text>
      <Text style={styles.desc}>
        {file?.name} → {languages.map(nameOf).join(", ")}
      </Text>

      <Text style={styles.percent}>{percent}%</Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>
      <Text style={[styles.fileSub, { textAlign: "center", marginTop: 12 }]}>
        {getStatus(percent)}
      </Text>

      {percent < 100 && (
        <View style={styles.actions}>
          <Button label="Hủy" onPress={onCancel} secondary />
        </View>
      )}
    </View>
  );
}

function ResultScreen({
  file,
  languages,
  onRestart,
}: {
  file: PickedFile | null;
  languages: string[];
  onRestart: () => void;
}) {
  const [active, setActive] = useState(languages[0]);
  const player = useVideoPlayer(file?.uri ?? null, (p) => {
    p.loop = false;
  });

  const download = async () => {
    if (file && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(file.uri);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hoàn tất 🎉</Text>
      <Text style={styles.desc}>{file?.name}</Text>

      <View style={styles.tabs}>
        {languages.map((code) => (
          <Pressable
            key={code}
            onPress={() => setActive(code)}
            style={[styles.tab, code === active && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, code === active && styles.tabTextActive]}
            >
              {nameOf(code)}
            </Text>
          </Pressable>
        ))}
      </View>

      <VideoView player={player} style={styles.video} nativeControls />

      <Text style={[styles.fileSub, { marginTop: 12 }]}>
        Bản demo: đang phát file gốc, chưa có giọng lồng tiếng thật.
      </Text>

      <View style={styles.actionsWrap}>
        <Button label="Làm video mới" onPress={onRestart} secondary />
        <Button label={`Tải về bản ${nameOf(active)}`} onPress={download} />
      </View>
    </View>
  );
}

function HistoryScreen({
  items,
  onBack,
  onClear,
}: {
  items: HistoryItem[];
  onBack: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Lịch sử</Text>
      <Text style={styles.desc}>Các video đã xử lý trên máy này.</Text>

      {items.length === 0 ? (
        <View style={[styles.fileBox, styles.fileEmpty]}>
          <Text style={styles.fileSub}>Chưa có video nào được xử lý</Text>
        </View>
      ) : (
        items.map((it) => (
          <View key={it.id} style={styles.historyItem}>
            <Text style={styles.fileName} numberOfLines={1}>
              {it.name}
            </Text>
            <Text style={styles.fileSub}>
              {formatTime(it.time)} · {(it.size / 1024 / 1024).toFixed(1)} MB
            </Text>
            <View style={styles.historyLangs}>
              {it.languages.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{nameOf(c)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      <View style={styles.actions}>
        <Button label="← Quay lại" onPress={onBack} secondary />
        {items.length > 0 && (
          <Pressable onPress={onClear}>
            <Text style={styles.link}>Xóa lịch sử</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function Index() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setHistory(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const saveHistory = (list: HistoryItem[]) => {
    setHistory(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(() => {});
  };

  const restart = () => {
    setFile(null);
    setLanguages([]);
    setStep("upload");
  };

  const finishJob = () => {
    const entry: HistoryItem = {
      id: Date.now(),
      name: file?.name ?? "Không rõ tên",
      size: file?.size ?? 0,
      languages,
      time: new Date().toISOString(),
    };
    saveHistory([entry, ...history].slice(0, 20));
    setStep("result");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.appTitle}>🎬 Thuyết minh đa ngôn ngữ</Text>

        {step !== "progress" && step !== "history" && (
          <Pressable
            style={styles.historyBtn}
            onPress={() => setStep("history")}
          >
            <Text style={styles.historyBtnText}>
              Lịch sử ({history.length})
            </Text>
          </Pressable>
        )}

        {step !== "history" && <Stepper current={step} />}

        {step === "upload" && (
          <UploadScreen
            file={file}
            onPick={setFile}
            onNext={() => setStep("language")}
          />
        )}
        {step === "language" && (
          <LanguageScreen
            selected={languages}
            onChange={setLanguages}
            onBack={() => setStep("upload")}
            onNext={() => setStep("progress")}
          />
        )}
        {step === "progress" && (
          <ProgressScreen
            file={file}
            languages={languages}
            onDone={finishJob}
            onCancel={() => setStep("language")}
          />
        )}
        {step === "result" && (
          <ResultScreen file={file} languages={languages} onRestart={restart} />
        )}
        {step === "history" && (
          <HistoryScreen
            items={history}
            onBack={() => setStep("upload")}
            onClear={() => saveHistory([])}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY = "#4f46e5";
const BORDER = "#e3e5ec";
const MUTED = "#6b7280";
const TEXT = "#1f2430";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4fb" },
  scroll: { padding: 16, paddingBottom: 48 },
  appTitle: { fontSize: 18, fontWeight: "700", color: TEXT, marginBottom: 16 },

  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stepItem: { alignItems: "center", flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepNum: { fontSize: 12, fontWeight: "700", color: MUTED },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 11, color: MUTED, marginTop: 4 },
  stepLabelActive: { color: TEXT, fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: "800", color: TEXT, marginBottom: 6 },
  desc: { fontSize: 16, color: MUTED, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    marginBottom: 8,
  },

  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 36,
    alignItems: "center",
  },
  dropIcon: { fontSize: 36 },
  dropTitle: { fontSize: 18, fontWeight: "700", color: TEXT, marginTop: 8 },
  dropHint: { fontSize: 13, color: MUTED, marginTop: 4 },

  fileBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
  },
  fileEmpty: { borderStyle: "dashed", justifyContent: "center" },
  fileName: { fontSize: 16, fontWeight: "600", color: TEXT },
  fileSub: { fontSize: 14, color: MUTED },
  link: { color: PRIMARY, fontWeight: "600", padding: 4 },

  langItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
  },
  langItemOn: { borderColor: PRIMARY, backgroundColor: "#eef0ff" },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4fb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeOn: { backgroundColor: PRIMARY },
  badgeText: { fontSize: 13, fontWeight: "700", color: TEXT },
  badgeTextOn: { color: "#fff" },
  langName: { flex: 1, fontSize: 16, color: TEXT },
  check: { color: PRIMARY, fontWeight: "700", fontSize: 18 },

  percent: {
    fontSize: 52,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginVertical: 12,
  },
  bar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: BORDER,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: PRIMARY },

  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  tabText: { fontSize: 14, color: TEXT },
  tabTextActive: { color: "#fff" },
  video: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#000",
  },

  actionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
  },

  historyBtn: {
    alignSelf: "flex-end",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  historyBtnText: { fontSize: 14, fontWeight: "600", color: TEXT },
  historyItem: {
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
  },
  historyLangs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: MUTED },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  btn: {
    backgroundColor: PRIMARY,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnTextSecondary: { color: TEXT },
});
