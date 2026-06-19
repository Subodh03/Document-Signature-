export const COLORS = {
  bg: "#fafafa",
  surface: "#ffffff",
  surfaceHover: "#f5f6f8",
  border: "#e2e5eb",
  primary: "#3b6fe0",
  primaryDark: "#2d59c2",
  primaryGlow: "rgba(59,111,224,0.10)",
  success: "#1a9e5c",
  successBg: "rgba(26,158,92,0.08)",
  warning: "#b8790a",
  warningBg: "rgba(184,121,10,0.08)",
  danger: "#cf3030",
  dangerBg: "rgba(207,48,48,0.08)",
  text: "#1c2128",
  textMuted: "#5c6370",
  textDim: "#94989f",
};

export function Badge({ status }) {
  const map = {
    pending: [COLORS.warning, COLORS.warningBg, "Pending"],
    signed: [COLORS.success, COLORS.successBg, "Signed"],
    rejected: [COLORS.danger, COLORS.dangerBg, "Rejected"],
  };
  const [color, bg, label] = map[status] || [COLORS.textMuted, "transparent", status];
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${color}33`,
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "monospace",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function Btn({ children, onClick, variant = "default", disabled, style: s, sm, type = "button" }) {
  const base = {
    default: { bg: COLORS.surface, color: COLORS.text, border: COLORS.border },
    primary: { bg: COLORS.primary, color: "#fff", border: COLORS.primary },
    danger: { bg: COLORS.dangerBg, color: COLORS.danger, border: COLORS.danger + "55" },
    ghost: { bg: "transparent", color: COLORS.textMuted, border: "transparent" },
    success: { bg: COLORS.successBg, color: COLORS.success, border: COLORS.success + "55" },
  };
  const v = base[variant] || base.default;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 8,
        padding: sm ? "5px 12px" : "8px 18px",
        fontSize: sm ? 12 : 14,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s",
        fontFamily: "inherit",
        boxShadow: variant === "primary" ? "0 1px 2px rgba(59,111,224,0.25)" : "none",
        ...s,
      }}
    >
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#fff",
          border: `1px solid ${error ? COLORS.danger : COLORS.border}`,
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 14,
          color: COLORS.text,
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.danger }}>{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,22,28,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          width: "100%",
          maxWidth: width,
          boxShadow: "0 24px 64px rgba(20,22,28,0.18)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text, fontWeight: 600 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer", padding: 4 }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type = "success" }) {
  const color = type === "success" ? COLORS.success : type === "error" ? COLORS.danger : COLORS.warning;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        background: COLORS.surface,
        border: `1px solid ${color}55`,
        borderRadius: 10,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 28px rgba(20,22,28,0.16)",
        maxWidth: 340,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: COLORS.text }}>{message}</span>
    </div>
  );
}
