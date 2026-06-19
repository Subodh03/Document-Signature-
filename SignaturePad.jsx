import { useState, useRef } from "react";
import { COLORS, Btn } from "./ui";

export function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [tab, setTab] = useState("draw");
  const [typedName, setTypedName] = useState("");
  const [font, setFont] = useState("Brush Script MT, cursive");

  const fonts = [
    { label: "Script", value: "Brush Script MT, cursive" },
    { label: "Italic", value: "Georgia, serif" },
    { label: "Print", value: "'Courier New', monospace" },
  ];

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = COLORS.primaryDark;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    if (tab === "draw") {
      if (!hasDrawn) return;
      onSave({ type: "draw", dataUrl: canvasRef.current.toDataURL(), text: null });
    } else {
      if (!typedName.trim()) return;
      onSave({ type: "type", dataUrl: null, text: typedName, font });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: COLORS.bg, borderRadius: 8, padding: 4 }}>
        {["draw", "type"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 6,
              border: "none",
              background: tab === t ? COLORS.primary : "transparent",
              color: tab === t ? "#fff" : COLORS.textMuted,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {t === "draw" ? "Draw" : "Type"}
          </button>
        ))}
      </div>

      {tab === "draw" ? (
        <div>
          <canvas
            ref={canvasRef}
            width={432}
            height={160}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            style={{
              width: "100%",
              height: 160,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              cursor: "crosshair",
              background: "#fbfbfc",
              display: "block",
              touchAction: "none",
            }}
          />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.textDim, textAlign: "center" }}>Draw your signature above</p>
        </div>
      ) : (
        <div>
          <input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full name"
            style={{
              width: "100%",
              padding: "16px 14px",
              fontSize: 22,
              fontFamily: font,
              background: "#fbfbfc",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              color: COLORS.primaryDark,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {fonts.map((f) => (
              <button
                key={f.value}
                onClick={() => setFont(f.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: `1px solid ${font === f.value ? COLORS.primary : COLORS.border}`,
                  background: font === f.value ? COLORS.primaryGlow : "transparent",
                  color: font === f.value ? COLORS.primary : COLORS.textMuted,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        {tab === "draw" && <Btn onClick={clear} sm>Clear</Btn>}
        <Btn onClick={onCancel} sm>Cancel</Btn>
        <Btn variant="primary" onClick={save} sm disabled={tab === "draw" ? !hasDrawn : !typedName.trim()}>
          Apply Signature
        </Btn>
      </div>
    </div>
  );
}
