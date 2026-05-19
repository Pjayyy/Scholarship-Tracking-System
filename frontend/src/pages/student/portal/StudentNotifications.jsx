import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCheckCircle, FiAlertCircle, FiFileText, FiTrash2, FiX } from "react-icons/fi";

function StudentNotifications() {
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "success",
      title: "Attendance Recorded",
      message: "Your attendance has been recorded for today.",
      timestamp: "2 hours ago",
      icon: FiCheckCircle,
      read: false,
    },
    {
      id: 2,
      type: "warning",
      title: "Attendance Warning",
      message: "Your attendance is below 80%. Please ensure regular attendance.",
      timestamp: "1 day ago",
      icon: FiAlertCircle,
      read: false,
    },
    {
      id: 3,
      type: "info",
      title: "Scholarship Renewal",
      message: "Your scholarship renewal deadline is on May 31, 2026.",
      timestamp: "3 days ago",
      icon: FiFileText,
      read: true,
    },
    {
      id: 4,
      type: "success",
      title: "Documents Approved",
      message: "All your submitted documents have been approved.",
      timestamp: "1 week ago",
      icon: FiCheckCircle,
      read: true,
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.REACT_APP_API_URL ||
        "http://127.0.0.1:5000";

      setAnnLoading(true);
      setAnnError(null);

      try {
        const res = await fetch(
          `${API_URL}/student/announcements`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            json.message || "Could not load announcements"
          );
        }

        if (!cancelled) {
          setAnnouncements(json.data || []);
        }
      } catch (e) {
        if (!cancelled) {
          setAnnError(e.message || "Error");
          setAnnouncements([]);
        }
      } finally {
        if (!cancelled) setAnnLoading(false);
      }
    };

    void run();

    const t = setInterval(run, 60000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const handleDelete = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "success":
        return { bg: "#f0fdf4", border: "#22c55e", text: "#16a34a" };
      case "warning":
        return { bg: "#fffbeb", border: "#f59e0b", text: "#d97706" };
      case "info":
        return { bg: "#f0f9ff", border: "#3b82f6", text: "#1d4ed8" };
      default:
        return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" };
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--text-primary, #0f172a)",
            }}
          >
            Official announcements
          </h3>
          {annLoading ? (
            <p style={{ color: "#6b7280", margin: 0 }}>Loading…</p>
          ) : annError ? (
            <p style={{ color: "#dc2626", margin: 0 }}>{annError}</p>
          ) : announcements.length === 0 ? (
            <p style={{ color: "#6b7280", margin: 0 }}>
              No scholarship announcements yet. Your school will publish
              updates here when available.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {announcements.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "1rem",
                    border: "1px solid rgba(59,130,246,0.25)",
                    background: "#f0f9ff",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#1e40af",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {a.title}
                  </div>
                  {a.fromAddress ? (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "#64748b",
                        marginBottom: "0.35rem",
                      }}
                    >
                      From: {a.fromAddress}
                    </div>
                  ) : null}
                  <div
                    style={{
                      fontSize: "0.92rem",
                      color: "#334155",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                    }}
                  >
                    {(a.bodyText || "").slice(0, 4000)}
                  </div>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    {a.receivedAt || a.createdAt
                      ? new Date(
                          a.receivedAt || a.createdAt
                        ).toLocaleString()
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
              🔔 Notifications
            </h2>
            {unreadCount > 0 && (
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setNotifications(notifications.map((n) => ({ ...n, read: true })));
              }}
              style={{
                padding: "0.75rem 1.25rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Mark All as Read
            </motion.button>
          )}
        </div>

        {/* Notifications List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  background: "#f9fafb",
                  borderRadius: "1.25rem",
                  border: "1px dashed #e5e7eb",
                }}
              >
                <FiBell size={48} style={{ color: "#d1d5db", margin: "0 auto 1rem" }} />
                <p style={{ margin: 0, color: "#6b7280", fontSize: "1.1rem" }}>
                  No notifications yet
                </p>
              </motion.div>
            ) : (
              notifications.map((notif) => {
                const Icon = notif.icon;
                const colors = getTypeColor(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    style={{
                      background: colors.bg,
                      borderRadius: "1rem",
                      padding: "1.5rem",
                      borderLeft: `4px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                      justifyContent: "space-between",
                      cursor: !notif.read ? "pointer" : "default",
                      opacity: notif.read ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1 }}>
                      <div style={{ color: colors.text }}>
                        <Icon size={28} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <strong style={{ color: colors.text }}>
                            {notif.title}
                          </strong>
                          {!notif.read && (
                            <span
                              style={{
                                display: "inline-block",
                                width: "8px",
                                height: "8px",
                                background: colors.border,
                                borderRadius: "50%",
                              }}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            margin: "0.25rem 0 0",
                            color: "#6b7280",
                            fontSize: "0.95rem",
                          }}
                        >
                          {notif.message}
                        </p>
                        <span
                          style={{
                            display: "block",
                            marginTop: "0.5rem",
                            color: "#9ca3af",
                            fontSize: "0.85rem",
                          }}
                        >
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.text,
                        cursor: "pointer",
                        padding: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FiTrash2 size={18} />
                    </motion.button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentNotifications;
