import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listDocuments, uploadDocument } from "../api/documents";
import { COLORS, Btn, Modal, Toast } from "../components/ui";
import { UploadZone } from "../components/UploadZone";
import { DocCard } from "../components/DocCard";
import { ShareModal } from "../components/ShareModal";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [shareDoc, setShareDoc] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = async () => {
    try {
      const data = await listDocuments();
      setDocs(data.documents);
    } catch (err) {
      showToast("Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      await uploadDocument(file);
      await refresh();
      showToast(`"${file.name}" uploaded successfully`, "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const stats = docs.reduce(
    (acc, d) => {
      acc.total++;
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    { total: 0, signed: 0, pending: 0, rejected: 0 }
  );

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <nav
        style={{
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 20,
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>S</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Sign Manager</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {user?.avatar}
          </div>
          <Btn onClick={handleLogout} variant="ghost" sm>
            Sign out
          </Btn>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Manage your documents and signatures</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            ["Total Documents", stats.total, COLORS.primary],
            ["Signed", stats.signed, COLORS.success],
            ["Pending", stats.pending, COLORS.warning],
            ["Rejected", stats.rejected, COLORS.danger],
          ].map(([label, count, color]) => (
            <div key={label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{count || 0}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, color: COLORS.text, fontWeight: 600, marginBottom: 16 }}>Upload New Document</h2>
          {uploading ? (
            <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: COLORS.textMuted }}>Uploading…</div>
          ) : (
            <UploadZone onUpload={handleUpload} />
          )}
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 16, color: COLORS.text, fontWeight: 600, marginBottom: 18 }}>
            Documents <span style={{ fontSize: 13, color: COLORS.textDim, fontWeight: 400 }}>({docs.length})</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textDim }}>Loading…</div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textDim }}>
              <p style={{ fontSize: 15, marginBottom: 6 }}>No documents yet</p>
              <p style={{ fontSize: 13 }}>Upload a PDF to get started</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {docs.map((doc) => (
                <DocCard key={doc._id} doc={doc} onOpen={() => navigate(`/documents/${doc._id}`)} onShare={() => setShareDoc(doc)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!shareDoc} onClose={() => setShareDoc(null)} title="Share Signing Link">
        {shareDoc && <ShareModal doc={shareDoc} onToast={showToast} />}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
