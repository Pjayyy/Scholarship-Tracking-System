import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { toast } from "react-toastify";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import API from "../../services/api";
import { getApiBaseUrl } from "../../services/apiBaseUrl";
import CreateAnnouncementOnAnnouncements from "./CreateAnnouncementOnAnnouncements";

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/announcements");
      setAnnouncements(res?.data?.data || []);
    } catch (e) {
      setAnnouncements([]);
      toast.error(e?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    // SSE: keep in sync when ingested/dispatched
    const token = localStorage.getItem("token");
    if (!token) return;

    const API_URL = getApiBaseUrl();
    let es;
    try {
      es = new EventSource(`${API_URL}/admin/announcements/stream?token=${encodeURIComponent(token)}`);
      es.addEventListener("ingested", () => {
        void load();
      });
      es.addEventListener("dispatched", () => {
        void load();
      });
    } catch {
      // ignore
    }

    return () => {
      es?.close?.();
    };
  }, []);

  const sorted = useMemo(() => {
    return [...(announcements || [])].sort((a, b) => {
      const ta = a.receivedAt || a.createdAt || a.timestamp;
      const tb = b.receivedAt || b.createdAt || b.timestamp;
      return new Date(tb || 0).getTime() - new Date(ta || 0).getTime();
    });
  }, [announcements]);

  return (
    <div className="admin-page">
      <section className="futuristic-card">
        <div className="panel-head" style={{ marginBottom: 10 }}>
          <div className="panel-title" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <FaPlus />
            <span>Create Announcement</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ marginBottom: 18 }}
        >
          <CreateAnnouncementOnAnnouncements
            onCreated={() => {
              void load();
            }}
          />
        </motion.div>

        <div style={{ height: 6 }} />

        <div className="panel-head" style={{ marginBottom: 10 }}>
          <div className="panel-title">Announcements</div>
        </div>


        {loading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 12 }}>No announcements found.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {sorted.slice(0, 50).map((a) => {
              const dispatched = Boolean(a.emailDispatchedAt);
              const hasError = Boolean(a.dispatchError);
              return (
                <motion.article
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="announcement-row"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{a.title || "(untitled)"}</div>
                      <div style={{ opacity: 0.9, marginBottom: 6 }}>
                        {(a.bodyText || "").slice(0, 180) || ""}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        From: {a.fromAddress || "—"} • {formatTimestamp(a.receivedAt || a.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 160 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: hasError ? "#f87171" : dispatched ? "#34d399" : "#fbbf24",
                          marginBottom: 6,
                        }}
                      >
                        {hasError ? "Error" : dispatched ? "Emailed" : "Pending"}
                      </div>
                      {a.dispatchError ? (
                        <div style={{ fontSize: 12, opacity: 0.85, maxWidth: 220 }}>
                          {String(a.dispatchError).slice(0, 120)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

