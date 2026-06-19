import { useState } from "react";
import { createSigningLink } from "../api/documents";
import { COLORS, Btn, Input } from "./ui";

export function ShareModal({ doc, onToast }) {
  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return;
    setLoading(true);
    try {
      const data = await createSigningLink(doc._id, email);
      setGeneratedLink(data.link);
      onToast("Signing link generated", "success");
    } catch (err) {
      onToast(err.response?.data?.error || "Failed to generate link", "error");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(generatedLink);
    onToast("Link copied to clipboard", "success");
  };

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: 14, color: COLORS.textMuted }}>
        Generate a tokenized signing link for external signatories. Links expire in 7 days.
      </p>
      <Input label="Recipient email" type="email" value={email} onChange={setEmail} placeholder="signer@company.com" />
      <Btn variant="primary" onClick={generate} disabled={!email || loading}>
        {loading ? "Generating…" : "Generate Signing Link"}
      </Btn>

      {generatedLink && (
        <div style={{ marginTop: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>
            Tokenized signing link:
          </label>
          <div
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <code style={{ fontSize: 12, color: COLORS.primary, flex: 1, wordBreak: "break-all" }}>{generatedLink}</code>
            <Btn onClick={copy} sm>
              Copy
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
