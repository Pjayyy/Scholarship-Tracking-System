import { useRef, useState } from "react";
import { FiCpu, FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";

function AdminDocumentScan() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const runAnalyze = async (file) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in again.");
      return;
    }

    const API_URL =
      process.env.REACT_APP_API_URL ||
      "http://127.0.0.1:5000";

    setBusy(true);
    setLastResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180000);

      const res = await fetch(`${API_URL}/documents/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.message ||
            json.status ||
            "Document analysis failed."
        );
      }

      const d = json.data || {};
      setLastResult(d);

      toast.success(
        `Analyzed: ${d.fileName || file.name} (${d.pageCount ?? "?"} pages, ${d.tableCount ?? 0} tables).`
      );
    } catch (err) {
      const msg =
        err?.name === "AbortError"
          ? "Analysis timed out. Try a smaller file."
          : err?.message || "Request failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <div className="page-hero" style={{ marginBottom: "1.5rem" }}>
        <div className="page-hero__row">
          <div>
            <div className="kicker">Admin tools</div>
            <h2 className="page-title">Document scan</h2>
            <p className="page-subtitle">
              Upload a PDF or image for Azure Document Intelligence (
              <code>prebuilt-layout</code>). Students cannot use this endpoint.
            </p>
          </div>
        </div>
      </div>

      <div className="card card-glass" style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontWeight: 800,
            marginBottom: "1rem",
          }}
        >
          <FiCpu aria-hidden />
          Upload &amp; analyze
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/tiff,image/bmp,image/heic,image/heif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void runAnalyze(f);
          }}
        />

        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <FiUpload aria-hidden />
          {busy ? "Analyzing…" : "Choose file (max 10 MB)"}
        </button>

        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.92rem",
            color: "var(--text-secondary)",
            maxWidth: "70ch",
          }}
        >
          Configure{" "}
          <code>DOCUMENT_INTELLIGENCE_ENDPOINT</code> and{" "}
          <code>DOCUMENT_INTELLIGENCE_API_KEY</code> in{" "}
          <code>backend/.env</code>. See <code>backend/.env.example</code>.
        </p>
      </div>

      {lastResult ? (
        <div
          className="card card-glass"
          style={{ marginTop: "1.25rem", padding: "1.5rem" }}
        >
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>
            Result: {lastResult.fileName}
          </h3>
          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginBottom: "1rem",
            }}
          >
            Pages: {lastResult.pageCount ?? "—"} · Paragraphs:{" "}
            {lastResult.paragraphCount ?? "—"} · Tables:{" "}
            {lastResult.tableCount ?? "—"}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "0.35rem",
              color: "var(--text-secondary)",
            }}
          >
            Extracted text (preview)
          </div>
          <pre
            style={{
              margin: 0,
              maxHeight: 360,
              overflow: "auto",
              fontSize: "0.85rem",
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              padding: "1rem",
              borderRadius: "14px",
              border: "1px solid var(--surface-border)",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
            }}
          >
            {(lastResult.fullText || "").slice(0, 24000) ||
              "(no text returned)"}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDocumentScan;
