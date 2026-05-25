import { useEffect, useMemo, useRef, useState } from "react";
import API from "../../services/api";
import { Html5QrcodeScanner } from "html5-qrcode";

function QRScanner() {
  const scannerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | running | unavailable

  const scannerOptions = useMemo(() => ({ fps: 10, qrbox: 250 }), []);

  const teardownScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.clear();
    } catch (e) {
      console.error("Scanner cleanup error:", e);
    } finally {
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const detectCamera = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          if (!cancelled) setCameraStatus("unavailable");
          return;
        }

        // Capability/permission probe
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());

        if (!cancelled) setCameraStatus("idle");
      } catch {
        if (!cancelled) setCameraStatus("unavailable");
      }
    };

    void detectCamera();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cameraEnabled) {
      void teardownScanner();
      setCameraStatus((s) => (s === "unavailable" ? s : "idle"));
      return;
    }

    setError(null);
    setCameraStatus("running");

    const scanner = new Html5QrcodeScanner("reader", scannerOptions, false);
    scannerRef.current = scanner;

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
      void teardownScanner();
    };
  }, [cameraEnabled, scannerOptions, busy]);

  const onClear = () => {
    setResult(null);
    setError(null);
  };

  return (

    <div className="panel panel--qr">
      <section className="page-hero">
        <div className="page-hero__row">
          <div>
            <div className="kicker">QR Lookup</div>
            <div className="page-title">QR Scanner</div>
            <div className="page-subtitle">
              Scan a student QR code to show official announcements and scholarship requirements.
            </div>
          </div>

          <div className="qr-hero-art" aria-hidden="true" />
        </div>
      </section>

      <div className="card card-glass scanner-card" style={{ padding: "1.1rem" }}>
        <div className="qr-scanner-controls" style={{ marginBottom: "0.9rem" }}>
          <button
            type="button"
            className="btn btn-primary-neon"
            disabled={cameraEnabled || cameraStatus === "unavailable"}
            onClick={() => setCameraEnabled(true)}
          >
            Enable Camera
          </button>

          <label className="btn btn-outline-neon" role="button" aria-disabled={busy}>
            Upload QR Image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setError(null);
                setBusy(true);
                try {
                  throw new Error(
                    "Image upload decoding will be enabled in the next iteration (camera UI is fully styled now)."
                  );
                } catch (err) {
                  setError(err?.message || "Upload failed");
                } finally {
                  setTimeout(() => setBusy(false), 600);
                }
              }}
            />
          </label>
        </div>

        <div className="qr-scanner-glass" data-camera={cameraEnabled ? "on" : "off"}>
          {cameraStatus === "unavailable" ? (
            <div className="camera-unavailable-card" role="alert">
              <div className="camera-unavailable-title">Camera unavailable</div>
              <div className="camera-unavailable-sub">Allow camera permissions or use image upload.</div>
            </div>
          ) : null}

          <div className="qr-scan-icon" aria-hidden="true" />

          <div className="qr-scan-frame" aria-hidden="true">
            <span className="qr-scan-frame-corner qr-scan-frame-corner--tl" />
            <span className="qr-scan-frame-corner qr-scan-frame-corner--tr" />
            <span className="qr-scan-frame-corner qr-scan-frame-corner--bl" />
            <span className="qr-scan-frame-corner qr-scan-frame-corner--br" />
          </div>

          <div id="reader" />
        </div>
      </div>


      {error ? (
        <div className="card card-glass" style={{ marginTop: 16, padding: "1rem" }}>
          <div className="camera-unavailable-title" style={{ color: "#ef4444", fontSize: "0.95rem" }}>
            Scan error
          </div>
          <div style={{ marginTop: 6, color: "var(--text-secondary)" }}>{error}</div>
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

          <section className="latest-announcements-card" style={{ marginTop: 14, padding: "1rem 1rem 1.1rem" }}>
            <div className="latest-announcements-topbar">
              <div>
                <div className="latest-announcements-kicker">Latest Announcements</div>
                <div className="latest-announcements-title">Neon timeline feed</div>
              </div>
            </div>

            <div className="latest-announcements-feed">
              {Array.isArray(result.announcements) && result.announcements.length ? (
                <div className="latest-timeline">
                  {result.announcements.slice(0, 6).map((a) => {
                    const senderEmail = a.fromAddress || a.senderEmail || a.from || "unknown@domain.com";
                    const tsRaw = a.receivedAt || a.createdAt || a.timestamp;
                    const tsLabel = tsRaw ? new Date(tsRaw).toLocaleString() : "—";
                    const dispatched = Boolean(a.emailDispatchedAt);

                    return (
                      <article key={a.id ?? `${a.title}-${tsRaw ?? Math.random()}`} className="latest-feed-item">
                        <div className="latest-left">
                          <div className="latest-node" />
                        </div>

                        <div className="latest-card">
                          <div className="latest-card-body">
                            <div className="latest-card-header">
                              <h4 className="latest-ann-title">{a.title || "—"}</h4>
                            </div>

                            <p className="latest-ann-preview">{(a.bodyText || a.body || "").slice(0, 220) || "—"}</p>

                            <div className="latest-sender">
                              <span className="latest-sender-label">From</span>
                              <span className="latest-sender-email">{senderEmail}</span>
                            </div>
                          </div>

                          <div className="latest-meta-right">
                            <div className="latest-timestamp">
                              <span className="latest-calendar" aria-hidden="true">📅</span>
                              <span>{tsLabel}</span>
                            </div>
                            <div className={dispatched ? "latest-status ok" : "latest-status pending"}>
                              {dispatched ? "Emailed" : "Pending"}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="latest-empty">No announcements found.</div>
              )}
            </div>
          </section>


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
