import api from "./client";
export const signup = (name, email, password) =>
  api.post("/auth/signup", { name, email, password }).then((r) => r.data);

export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const logout = (refreshToken) =>
  api.post("/auth/logout", { refreshToken }).then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);
export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);
};

export const listDocuments = () => api.get("/documents").then((r) => r.data);

export const getDocument = (id) => api.get(`/documents/${id}`).then((r) => r.data);

export const getDocumentFileBlobUrl = async (id) => {
  const res = await api.get(`/documents/${id}/file`, { responseType: "blob" });
  return URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
};

export const signDocument = (id, signatures) =>
  api.post(`/documents/${id}/sign`, { signatures }).then((r) => r.data);

export const rejectDocument = (id, reason) =>
  api.post(`/documents/${id}/reject`, { reason }).then((r) => r.data);

export const getDocumentAudit = (id) => api.get(`/documents/${id}/audit`).then((r) => r.data);

export const createSigningLink = (id, email) =>
  api.post(`/documents/${id}/share`, { email }).then((r) => r.data);

export const downloadSignedDocument = async (id, filename) => {
  const res = await api.get(`/documents/${id}/download`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "signed-document.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
