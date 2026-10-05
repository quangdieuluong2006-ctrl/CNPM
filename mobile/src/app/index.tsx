import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LANGUAGES } from "../data/mockData";

type Step = "upload" | "language" | "progress" | "result";
type PickedFile = { name: string; size?: number };

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
      copyToCacheDirectory: false,
    });
    if (!res.canceled) {
      const a = res.assets[0];
      onPick({ name: a.name, size: a.size });
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
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hoàn tất 🎉</Text>
      <Text style={styles.desc}>{file?.name}</Text>

      <Text style={styles.sectionLabel}>Các bản đã tạo</Text>
      {languages.map((code) => (
        <View key={code} style={styles.resultRow}>
          <View style={[styles.badge, styles.badgeOn]}>
            <Text style={[styles.badgeText, styles.badgeTextOn]}>
              {code.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.langName}>{nameOf(code)}</Text>
          <Text style={styles.fileSub}>Sẵn sàng</Text>
        </View>
      ))}

      <Text style={[styles.fileSub, { marginTop: 12 }]}>
        Bản demo: chưa có giọng lồng tiếng thật, sẽ nối với BE sau.
      </Text>

      <View style={styles.actions}>
        <Button label="Làm video mới" onPress={onRestart} />
      </View>
    </View>
  );
}

export default function Index() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);

  const restart = () => {
    setFile(null);
    setLanguages([]);
    setStep("upload");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.appTitle}>🎬 Thuyết minh đa ngôn ngữ</Text>
        <Stepper current={step} />

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
            onDone={() => setStep("result")}
            onCancel={() => setStep("language")}
          />
        )}
        {step === "result" && (
          <ResultScreen file={file} languages={languages} onRestart={restart} />
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
