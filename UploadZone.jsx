import { useState, useRef } from "react";
import { COLORS } from "./ui";

export function UploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) return;
    onUpload(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? COLORS.primary : COLORS.border}`,
        borderRadius: 12,
        padding: "40px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? COLORS.primaryGlow : "transparent",
        transition: "all 0.2s",
        marginBottom: 24,
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" onChange={(e) => handleFile(e.target.files[0])} style={{ display: "none" }} />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 26V32C8 33.1 8.9 34 10 34H30C31.1 34 32 33.1 32 32V26" stroke={dragging ? COLORS.primary : COLORS.textDim} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M20 6V25" stroke={dragging ? COLORS.primary : COLORS.textDim} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 16L20 24L28 16" stroke={dragging ? COLORS.primary : COLORS.textDim} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 15, color: COLORS.text, fontWeight: 500 }}>
        {dragging ? "Drop to upload" : "Drop PDF here or click to browse"}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>PDF files only · Max 25MB</p>
    </div>
  );
}
