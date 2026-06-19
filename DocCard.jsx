import { COLORS, Badge, Btn } from "./ui";

export function DocCard({ doc, onOpen, onShare }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 18,
        cursor: "pointer",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = COLORS.primary;
        e.currentTarget.style.background = COLORS.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.background = COLORS.surface;
      }}
    >
      <div
        style={{
          width: 42,
          height: 52,
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
          <path d="M2 1H11L16 6V20C16 20.5523 15.5523 21 15 21H2.5C1.94772 21 1.5 20.5523 1.5 20V2C1.5 1.44772 1.94772 1 2.5 1H2Z" stroke={COLORS.textDim} strokeWidth="1.2" />
          <path d="M11 1V6H16" stroke={COLORS.textDim} strokeWidth="1.2" />
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: doc.status === "signed" ? COLORS.success : doc.status === "rejected" ? COLORS.danger : COLORS.warning,
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <h4
            style={{
              margin: 0,
              fontSize: 14,
              color: COLORS.text,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 220,
            }}
          >
            {doc.name}
          </h4>
          <Badge status={doc.status} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: COLORS.textDim }}>
            {doc.pages} page{doc.pages !== 1 ? "s" : ""} · {(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB
          </span>
          <span style={{ fontSize: 12, color: COLORS.textDim }}>{new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <Btn
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        sm
        variant="ghost"
      >
        Share
      </Btn>
    </div>
  );
}
