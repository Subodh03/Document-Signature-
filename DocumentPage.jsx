import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDocument, signDocument, rejectDocument, downloadSignedDocument, getDocumentFileBlobUrl } from "../api/documents";
import { COLORS, Badge, Btn, Modal, Toast } from "../components/ui";
import { SignaturePad } from "../components/SignaturePad";
import { PdfPage } from "../components/PdfPage";

export default function DocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState([]);
  const [showPad, setShowPad] = useState(false);
  const [placingMode, setPlacingMode] = useState(false);
  const [pendingSig, setPendingSig] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [tab, setTab] = useState("sign");
  const [toast, setToast] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileError, setFileError] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    getDocument(id)
      .then((data) => {
        setDoc(data.document);
        setSignatures(data.document.signatures || []);
      })
      .catch(() => showToast("Failed to load document", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let activeUrl = null;
    getDocumentFileBlobUrl(id)
      .then((url) => {
        activeUrl = url;
        setFileUrl(url);
      })
      .catch(() => setFileError("Could not load the PDF file"));
    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: COLORS.textDim }}>Loading…</div>;
  }
  if (!doc) {
    return <div style={{ padding: 40, textAlign: "center", color: COLORS.textDim }}>Document not found</div>;
  }

  const readOnly = doc.status !== "pending";
  const pages = Array.from({ length: doc.pages }, (_, i) => i + 1);

  const handleViewerClick = (e, page) => {
    if (!placingMode || !pendingSig) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSignatures((s) => [...s, { id: `sig_${Date.now()}`, ...pendingSig, x, y, page }]);
    setPlacingMode(false);
    setPendingSig(null);
  };

  const handleSigSave = (sigData) => {
    setShowPad(false);
    setPendingSig(sigData);
    setPlacingMode(true);
  };

  const finalize = async () => {
    setFinalizing(true);
    try {
      const data = await signDocument(doc._id, signatures);
      showToast("Signing and generating PDF…", "success");
      const filename = doc.name.replace(/\.pdf$/i, "") + "_signed.pdf";
      await downloadSignedDocument(doc._id, filename);
      showToast("Signed PDF downloaded", "success");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to sign document", "error");
    } finally {
      setFinalizing(false);
    }
  };

  const reject = async () => {
    try {
      await rejectDocument(doc._id);
      showToast("Document rejected", "error");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reject document", "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div
        style={{
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}
        >
          ← Back
        </button>
        <div style={{ width: 1, height: 20, background: COLORS.border }} />
        <span style={{ fontSize: 14, color: COLORS.text, fontWeight: 500, flex: 1 }}>{doc.name}</span>
        <Badge status={doc.status} />
        <div style={{ display: "flex", gap: 6 }}>
          {["sign", "info"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                background: tab === t ? COLORS.primary : "transparent",
                color: tab === t ? "#fff" : COLORS.textMuted,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {t === "sign" ? "Sign" : "Info"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {tab === "sign" && (
          <div>
            {!readOnly && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                  padding: "12px 16px",
                  background: COLORS.surfaceHover,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <span style={{ fontSize: 13, color: COLORS.textMuted, flex: 1 }}>
                  {placingMode ? "Click on the document to place your signature" : "Place and finalize your signatures"}
                </span>
                {!placingMode && (
                  <Btn variant="primary" onClick={() => setShowPad(true)} sm>
                    Add Signature
                  </Btn>
                )}
                {placingMode && (
                  <Btn
                    onClick={() => {
                      setPlacingMode(false);
                      setPendingSig(null);
                    }}
                    sm
                  >
                    Cancel
                  </Btn>
                )}
                {signatures.length > 0 && !placingMode && (
                  <Btn variant="success" onClick={finalize} sm disabled={finalizing}>
                    {finalizing ? "Finalizing…" : "Finalize & Sign"}
                  </Btn>
                )}
                {!placingMode && (
                  <Btn variant="danger" onClick={reject} sm disabled={finalizing}>
                    Reject
                  </Btn>
                )}
              </div>
            )}

            <div style={{ overflowY: "auto", maxHeight: 600 }}>
              {!fileUrl && !fileError && (
                <div style={{ textAlign: "center", padding: 40, color: COLORS.textDim, fontSize: 13 }}>
                  Loading document…
                </div>
              )}
              {fileError && (
                <div style={{ textAlign: "center", padding: 40, color: COLORS.danger, fontSize: 13 }}>
                  {fileError}
                </div>
              )}
              {fileUrl &&
                pages.map((page) => (
                  <div
                    key={page}
                    style={{
                      position: "relative",
                      marginBottom: 16,
                      border: placingMode ? `2px dashed ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                      borderRadius: 4,
                    }}
                    onMouseMove={(e) => {
                      if (dragging) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setSignatures((sigs) => sigs.map((s) => (s.id === dragging ? { ...s, x, y } : s)));
                      }
                    }}
                    onMouseUp={() => setDragging(null)}
                  >
                    <PdfPage
                      fileUrl={fileUrl}
                      pageNumber={page}
                      cursor={placingMode ? "crosshair" : "default"}
                      onClick={(e) => handleViewerClick(e, page)}
                    >
                      <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 11, color: "#9ca3af" }}>
                        Page {page} of {doc.pages}
                      </div>

                      {signatures
                        .filter((s) => s.page === page)
                        .map((sig) => (
                          <div
                            key={sig.id}
                            onMouseDown={(e) => {
                              if (readOnly) return;
                              e.stopPropagation();
                              setDragging(sig.id);
                            }}
                            style={{
                              position: "absolute",
                              left: `${sig.x}%`,
                              top: `${sig.y}%`,
                              transform: "translate(-50%, -50%)",
                              cursor: readOnly ? "default" : "move",
                              zIndex: 10,
                            }}
                          >
                            <div
                              style={{
                                background: "rgba(59,111,224,0.06)",
                                border: `1.5px solid ${COLORS.primary}`,
                                borderRadius: 4,
                                padding: "4px 10px",
                                minWidth: 120,
                              }}
                            >
                              {sig.type === "draw" ? (
                                <img src={sig.dataUrl} alt="signature" style={{ height: 36, display: "block" }} />
                              ) : (
                                <span style={{ fontFamily: sig.font, fontSize: 18, color: COLORS.primaryDark, whiteSpace: "nowrap" }}>{sig.text}</span>
                              )}
                            </div>
                            {!readOnly && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSignatures((sigs) => sigs.filter((s) => s.id !== sig.id));
                                }}
                                style={{
                                  position: "absolute",
                                  top: -8,
                                  right: -8,
                                  width: 18,
                                  height: 18,
                                  background: COLORS.danger,
                                  border: "none",
                                  borderRadius: "50%",
                                  color: "#fff",
                                  fontSize: 10,
                                  cursor: "pointer",
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                    </PdfPage>
                  </div>
                ))}
            </div>

            <Modal open={showPad} onClose={() => setShowPad(false)} title="Create your signature">
              <SignaturePad onSave={handleSigSave} onCancel={() => setShowPad(false)} />
            </Modal>
          </div>
        )}

        {tab === "info" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              ["Document Name", doc.name],
              ["Status", doc.status],
              ["Pages", doc.pages],
              ["Uploaded", new Date(doc.createdAt).toLocaleString()],
              ["Signed At", doc.signedAt ? new Date(doc.signedAt).toLocaleString() : "—"],
              ["Signatures", doc.signatures?.length || 0],
            ].map(([k, v]) => (
              <div key={k} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 500, textTransform: "uppercase", marginBottom: 6 }}>{k}</div>
                <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 500 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
