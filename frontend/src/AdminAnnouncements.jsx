import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "./services/apiBaseUrl";

function AdminAnnouncements() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const API_URL = getApiBaseUrl();

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Failed to load");
      }
      setRows(json.data || []);
    } catch (e) {
      toast.error(e.message || "Load failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    void load();
  }, [load]);

  const syncGmail = async () => {
    const token = localStorage.getItem("token");
    setSyncing(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/announcements/gmail-sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Sync failed");
      }
      const d = json.data || {};
      toast.success(
        `Gmail sync: scanned ${d.scanned ?? 0}, inserted ${d.inserted ?? 0}`
      );
      await load();
    } catch (e) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="panel">
      <div className="page-hero" style={{ marginBottom: "1.5rem" }}>
        <div className="page-hero__row">
          <div>
            <div className="kicker">Admin</div>
            <h2 className="page-title">Scholarship announcements</h2>
            <p className="page-subtitle">
              Rows come from the <code>scholarship_announcements</code> table
              (Gmail poll or future manual inserts). Use{" "}
              <strong>Sync Gmail</strong> to pull immediately.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            disabled={syncing}
            onClick={() => void syncGmail()}
          >
            <FiRefreshCw
              style={{
                animation: syncing ? "spin 0.8s linear infinite" : "none",
              }}
            />
            {syncing ? "Syncing…" : "Sync Gmail now"}
          </button>
        </div>
      </div>

      <div className="card card-glass" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>
            No announcements yet. Configure Gmail in{" "}
            <code>backend/.env</code> and run{" "}
            <code>npm run gmail-oauth</code>, then sync.
          </div>
        ) : (
          <div className="table-scroll" style={{ maxHeight: 560 }}>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Title</th>
                  <th>From</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.source}</td>
                    <td style={{ maxWidth: 280 }}>{r.title}</td>
                    <td style={{ maxWidth: 200, fontSize: "0.85rem" }}>
                      {r.fromAddress || "—"}
                    </td>
                    <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {r.receivedAt
                        ? new Date(r.receivedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default AdminAnnouncements;
