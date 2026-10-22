// Logo sản phẩm: khung thoại (lời thuyết minh) + sóng âm, nền gradient.
export default function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#logo-g)" />
      <path d="M11 12.5h18a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5H19l-5 4v-4h-3A2.5 2.5 0 0 1 8.5 24v-9A2.5 2.5 0 0 1 11 12.5z" fill="#fff" fillOpacity="0.95" />
      <g stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
        <path d="M14 18v3" />
        <path d="M18 16v7" />
        <path d="M22 17.5v4" />
        <path d="M26 15.5v8" />
      </g>
    </svg>
  );
}
