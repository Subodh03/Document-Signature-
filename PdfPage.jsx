import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


export function PdfPage({ fileUrl, pageNumber, onSize, onClick, children, cursor }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setLoading(true);
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(pageNumber);

        
        const containerWidth = containerRef.current?.clientWidth || 760;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(containerWidth / unscaledViewport.width, 1.8);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        setLoading(false);
        onSize?.({ width: viewport.width, height: viewport.height });
      } catch (err) {
        if (!cancelled) {
          console.error("PDF render error:", err);
          setError("Could not render this page");
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, pageNumber]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: 4,
        overflow: "hidden",
        cursor: cursor || "default",
        minHeight: loading ? 220 : undefined,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
          Loading page {pageNumber}…
        </div>
      )}
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#cf3030", fontSize: 13 }}>
          {error}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
      {children}
    </div>
  );
}
