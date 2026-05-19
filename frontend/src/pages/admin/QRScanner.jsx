import { useEffect, useState } from "react";
import API from "../../services/api";
import { Html5QrcodeScanner } from "html5-qrcode";

function QRScanner() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    const onScanSuccess = async (decodedText) => {
      try {
        if (busy) return;
        setBusy(true);
        setError(null);

        const qrValue = String(decodedText ?? "").trim();
        const res = await API.post("/qr/info", { qr_value: qrValue });
        setResult(res?.data?.data || null);
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || "QR lookup failed";
        setError(msg);
      } finally {
        setTimeout(() => setBusy(false), 1200);
      }
    };

    scanner.render(onScanSuccess);

    return () => {
      scanner.clear().catch((e) => console.error("Scanner cleanup error:", e));
    };
  }, [busy]);

  return (
    <div className="panel">
      <section className="page-hero">
        <div className="page-hero__row">
          <div>
            <div className="kicker">QR Lookup</div>
            <div className="page-title">QR Scanner</div>
            <div className="page-subtitle">
              Scan a student QR code to show official announcements and scholarship requirements.
            </div>
          </div>
        </div>
      </section>

      <div className="card card-glass scanner-card">
        <div id="reader" />
      </div>

      {error ? (
        <div
          className="card card-glass"
          style={{ marginTop: 16, padding: "1rem", borderLeft: "4px solid #ef4444" }}
        >
          <strong style={{ color: "#ef4444" }}>Scan error</strong>
          <div style={{ marginTop: 6 }}>{error}</div>
        </div>
      ) : null}

      {result ? (
        <div className="card card-glass" style={{ marginTop: 16, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div>
              <div className="kicker">Student</div>
              <div style={{ fontWeight: 900, fontSize: "1.15rem" }}>
                {result.student?.name || "—"}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                {result.student?.student_id || "—"} • {result.student?.scholarship_type || "—"}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Latest announcements</div>
            {Array.isArray(result.announcements) && result.announcements.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.25)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{a.title}</div>
                    {a.fromAddress ? (
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 2 }}>
                        From: {a.fromAddress}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                      {(a.bodyText || "").slice(0, 800)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-secondary)" }}>No announcements found.</div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Requirements checklist</div>
            {Array.isArray(result.requirements) && result.requirements.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: "var(--text-secondary)" }}>No requirements configured.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default QRScanner;
