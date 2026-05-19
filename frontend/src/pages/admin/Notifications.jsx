import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaBell,
  FaBolt,
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaQrcode,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTrashAlt,
  FaUserCheck,
  FaClipboardList,
} from "react-icons/fa";
import API from "../../services/api";
import "../../styles/Notifications.css";

const categoryMap = {
  attendance: { label: "Attendance", icon: FaUserCheck, accent: "#38bdf8" },
  forecast: { label: "Forecast", icon: FaChartLine, accent: "#6366f1" },
  scholarship: { label: "Scholarship", icon: FaShieldAlt, accent: "#22c55e" },
  system: { label: "System", icon: FaInfoCircle, accent: "#f59e0b" },
  qr: { label: "QR Activity", icon: FaQrcode, accent: "#3b82f6" },
  mqtt: { label: "MQTT Event", icon: FaBolt, accent: "#ef4444" },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };
const tabOptions = ["all", "unread", "archived"];
const filterOptions = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "attendance", label: "Attendance" },
  { value: "forecast", label: "Forecast" },
  { value: "scholarship", label: "Scholarship" },
  { value: "system", label: "System" },
];

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
];

const seedNotifications = [
  {
    id: "notif-001",
    category: "attendance",
    priority: "low",
    title: "Attendance recorded successfully for Maria Santos",
    message: "QR attendance scan completed in the campus lobby.",
    details:
      "Maria Santos was marked present after a verified QR scan. Attendance is synced with the school ledger.",
    timestamp: "2026-05-10T06:30:00.000Z",
    unread: true,
  },
  {
    id: "notif-002",
    category: "forecast",
    priority: "high",
    title: "High risk warning detected for student attendance",
    message: "Forecast model flagged a 78% probability of absence for the next lecture.",
    details:
      "The attendance risk model suggests follow-up messaging for 5 students in the electronics cohort.",
    timestamp: "2026-05-10T07:18:00.000Z",
    unread: true,
  },
  {
    id: "notif-003",
    category: "scholarship",
    priority: "medium",
    title: "Scholarship renewal deadline approaching",
    message: "Reminder: 12 students have renewals due in 3 days.",
    details:
      "Review pending files in the scholarship portal to ensure timely renewal approvals.",
    timestamp: "2026-05-10T09:12:00.000Z",
    unread: true,
  },
  {
    id: "notif-004",
    category: "qr",
    priority: "low",
    title: "QR attendance scan completed",
    message: "A QR session was validated for Rodrigo Alvarez at 09:42 AM.",
    details:
      "Scan details saved and attendance updated instantly. Student badge used campus network credentials.",
    timestamp: "2026-05-10T09:42:00.000Z",
    unread: false,
  },
  {
    id: "notif-005",
    category: "system",
    priority: "medium",
    title: "Forecast prediction updated",
    message: "New model weights were deployed for the weekly attendance forecasting engine.",
    details:
      "Model recalibration completed at 08:20 AM. Performance metrics improved by 3.8%.",
    timestamp: "2026-05-10T10:03:00.000Z",
    unread: false,
  },
  {
    id: "notif-006",
    category: "mqtt",
    priority: "high",
    title: "Live MQTT event: attendance gateway connected",
    message: "scholarship/attendance received a fresh telemetry payload.",
    details:
      "The live attendance gateway is active and will stream updates to the notification center.",
    timestamp: "2026-05-10T10:16:00.000Z",
    unread: true,
  },
];

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

function buildNotification(payload) {
  const category = payload.category || payload.type || "system";
  const title = payload.title || payload.message || "New notification";

  return {
    id: payload.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category,
    priority: payload.priority || (category === "forecast" || category === "mqtt" ? "high" : "medium"),
    title,
    message: payload.message || payload.details || "You have a new update in the scholarship system.",
    details: payload.details || "Details are available in the notification panel.",
    timestamp: payload.timestamp || new Date().toISOString(),
    unread: payload.unread !== false,
  };
}

function createLiveNotification() {
  const templates = [
    {
      category: "attendance",
      priority: "medium",
      title: "Attendance threshold alert for classroom C2",
      message: "More than 10 students have toggled their attendance status in the last 20 minutes.",
      details:
        "The live monitor flagged a rapid attendance change. Review the classroom details for potential anomalies.",
    },
    {
      category: "forecast",
      priority: "high",
      title: "Forecast update: at-risk cohort rising",
      message: "The upcoming Friday forecast indicates a 15% increase in missed sessions.",
      details:
        "Alert triggered by updated forecast data from scholarship/forecast. Notify advisors for proactive outreach.",
    },
    {
      category: "scholarship",
      priority: "medium",
      title: "Scholarship award approved for Daniel Cruz",
      message: "Scholarship status moved to approved and notification email is queued.",
      details:
        "Daniel's award letter is now ready to be delivered through the student portal.",
    },
    {
      category: "qr",
      priority: "low",
      title: "QR scan received for lab attendance",
      message: "A QR scan completed successfully in Science Building 4.",
      details:
        "Live QR traffic is being synchronized with attendance logs and system alerts.",
    },
    {
      category: "mqtt",
      priority: "high",
      title: "MQTT event: new sensor heartbeat",
      message: "scholarship/alerts published a health event from the attendance gateway.",
      details:
        "Real-time infrastructure is healthy and streaming notifications to connected dashboards.",
    },
  ];

  const payload = templates[Math.floor(Math.random() * templates.length)];
  return buildNotification({ ...payload, timestamp: new Date().toISOString() });
}

function Notifications() {
  const [notifications, setNotifications] = useState(seedNotifications);
  const [archivedNotifications, setArchivedNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annSearch, setAnnSearch] = useState("");
  const [annSource, setAnnSource] = useState("all");
  const [annExpandedId, setAnnExpandedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadAnnouncements = async () => {
    setAnnLoading(true);
    try {
      const res = await API.get("/admin/announcements");
      setAnnouncements(res?.data?.data || []);
    } catch (e) {
      setAnnouncements([]);
      toast.error(e?.message || "Failed to load announcements");
    } finally {
      setAnnLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    const term = annSearch.trim().toLowerCase();
    return (announcements || [])
      .filter((a) => {
        if (annSource !== "all" && String(a.source || "") !== annSource) return false;
        if (!term) return true;
        const hay = `${a.title || ""} ${a.fromAddress || ""} ${a.bodyText || ""}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 200);
  }, [annSearch, annSource, announcements]);

  const announcementStats = useMemo(() => {
    const list = filteredAnnouncements || [];
    const total = list.length;
    const emailed = list.filter((a) => Boolean(a.emailDispatchedAt)).length;
    const errors = list.filter((a) => Boolean(a.dispatchError)).length;
    const pending = Math.max(0, total - emailed - errors);

    let latestAt = null;
    for (const a of list) {
      const t = a?.receivedAt || a?.createdAt;
      if (!t) continue;
      const d = new Date(t);
      if (Number.isNaN(d.getTime())) continue;
      if (!latestAt || d > latestAt) latestAt = d;
    }

    return { total, emailed, errors, pending, latestAt };
  }, [filteredAnnouncements]);

  const refreshNotifications = async (showToast = true) => {
    try {
      const response = await API.get("/notifications");
      if (Array.isArray(response.data) && response.data.length) {
        const items = response.data.map(buildNotification);
        setNotifications((prev) => [...items, ...prev].slice(0, 40));
      }
      if (showToast) {
        toast.success("Notification feed refreshed");
      }
    } catch {
      if (showToast) {
        toast.info("Live notification stream is active");
      }
    } finally {
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    refreshNotifications(false);
    void loadAnnouncements();

    // Real-time admin announcements via SSE (falls back to periodic refresh).
    const token = localStorage.getItem("token");
    const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
    let es = null;

    try {
      if (token) {
        es = new EventSource(
          `${API_URL}/admin/announcements/stream?token=${encodeURIComponent(token)}`
        );

        es.addEventListener("ingested", () => {
          void loadAnnouncements();
          setNotifications((prev) =>
            [
              buildNotification({
                category: "scholarship",
                priority: "high",
                title: "New CHED announcement received",
                message: "A new official announcement was ingested and is ready for review.",
                details: "Open the CHED announcements section to view the full message and dispatch status.",
                timestamp: new Date().toISOString(),
              }),
              ...prev,
            ].slice(0, 50)
          );
          toast.info("New CHED announcement received", { icon: <FaBell /> });
        });

        es.addEventListener("dispatched", () => {
          void loadAnnouncements();
        });
      }
    } catch {
      // ignore; periodic refresh still runs
    }

    const autoRefresh = setInterval(() => refreshNotifications(false), 25000);
    const announcementsRefresh = setInterval(() => loadAnnouncements(), 60000);

    return () => {
      clearInterval(autoRefresh);
      clearInterval(announcementsRefresh);
      es?.close?.();
    };
  }, []);

  const setRead = (id, unread) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, unread } : item)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    toast.success("All notifications have been marked as read");
  };

  const handleDelete = (id) => {
    setNotifications((prev) => {
      const deleted = prev.find((item) => item.id === id);
      if (deleted) {
        setArchivedNotifications((archive) => [deleted, ...archive].slice(0, 40));
      }
      return prev.filter((item) => item.id !== id);
    });
    toast.success("Notification archived");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.warning("Notification feed cleared");
  };

  const filteredNotifications = useMemo(() => {
    const targetList = activeTab === "archived" ? archivedNotifications : notifications;
    return targetList
      .filter((item) => {
        const term = searchTerm.toLowerCase();
        if (term.length && !`${item.title} ${item.message} ${item.details}`.toLowerCase().includes(term)) {
          return false;
        }
        if (activeTab === "archived") {
          return true;
        }
        if (filterCategory === "unread") {
          return item.unread;
        }
        if (filterCategory !== "all") {
          return item.category === filterCategory;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.timestamp) - new Date(b.timestamp);
        }
        if (sortBy === "priority") {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }, [activeTab, archivedNotifications, filterCategory, notifications, searchTerm, sortBy]);

  const unreadCount = notifications.filter((item) => item.unread).length;
  // (Sidebar stats removed)

  const groupedByCategory = useMemo(() => {
    return filteredNotifications.reduce((groups, item) => {
      const key = item.category;
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  }, [filteredNotifications]);

  return (
    <div className="notifications-page">
      <motion.section
        className="notifications-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="hero-copy">
          <div>
            <div className="hero-label">Announcements & Notifications</div>
            <h1>CHED announcements plus live scholarship alerts for your team.</h1>
            <p>
              View official CHED announcements, attendance/forecast signals, and system events in one place.
            </p>
          </div>

          <div className="hero-actions">
            <div className="hero-badge">
              <FaBell className="hero-icon" />
              <div>
                <strong>{unreadCount}</strong>
                <span>Unread</span>
              </div>
            </div>
            <div className="hero-meta">
              <div>
                <span>Last updated</span>
                <strong>{formatTimestamp(lastUpdated)}</strong>
              </div>
              <div className="hero-buttons">
                <button className="btn btn-secondary" onClick={markAllRead}>
                  Mark all as read
                </button>
                <button className="btn btn-secondary" onClick={() => refreshNotifications()}>
                  <FaSyncAlt /> Refresh
                </button>
                <button className="btn btn-danger" onClick={clearAll}>
                  <FaTrashAlt /> Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="card card-glass" style={{ margin: "0 0 1.25rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(148,163,184,0.25)",
          }}
        >
          <div>
            <div className="kicker">Official</div>
            <h3 style={{ margin: 0 }}>CHED announcements</h3>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-group" style={{ minWidth: 260 }}>
              <FaSearch className="search-icon" />
              <input
                className="search-input"
                type="search"
                placeholder="Search announcements…"
                value={annSearch}
                onChange={(e) => setAnnSearch(e.target.value)}
              />
            </div>
            <div className="select-group" style={{ minWidth: 160 }}>
              <label>Source</label>
              <select value={annSource} onChange={(e) => setAnnSource(e.target.value)}>
                <option value="all">All</option>
                <option value="gmail">Gmail</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem 1.25rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="stat-head">
                <FaClipboardList />
                <span>Total</span>
              </div>
              <strong>{announcementStats.total}</strong>
              <small style={{ color: "var(--text-secondary)" }}>Filtered</small>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="stat-head">
                <FaBell />
                <span>Pending</span>
              </div>
              <strong>{announcementStats.pending}</strong>
              <small style={{ color: "var(--text-secondary)" }}>Needs dispatch</small>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="stat-head">
                <FaShieldAlt />
                <span>Emailed</span>
              </div>
              <strong>{announcementStats.emailed}</strong>
              <small style={{ color: "var(--text-secondary)" }}>Sent to students</small>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <div className="stat-head">
                <FaInfoCircle />
                <span>Errors</span>
              </div>
              <strong>{announcementStats.errors}</strong>
              <small style={{ color: "var(--text-secondary)" }}>Dispatch failed</small>
            </div>
          </div>
          {announcementStats.latestAt ? (
            <div style={{ marginBottom: 10, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Latest announcement: <strong>{formatTimestamp(announcementStats.latestAt.toISOString())}</strong>
            </div>
          ) : null}
          {annLoading ? (
            <div style={{ color: "var(--text-secondary)" }}>Loading…</div>
          ) : filteredAnnouncements.length === 0 ? (
            <div style={{ color: "var(--text-secondary)" }}>
              No announcements yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflow: "auto" }}>
              {filteredAnnouncements.map((a) => {
                const ok = Boolean(a.emailDispatchedAt);
                const hasError = Boolean(a.dispatchError);
                const isExpanded = annExpandedId === a.id;

                return (
                  <div
                    key={a.id}
                    style={{
                      border: "1px solid rgba(148,163,184,0.25)",
                      borderRadius: 14,
                      padding: "0.9rem 1rem",
                      background: "rgba(15,23,42,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          #{a.id} • {a.title || "—"}
                        </div>
                        <div style={{ marginTop: 4, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                          <span style={{ marginRight: 10 }}>Source: {a.source}</span>
                          {a.fromAddress ? <span style={{ marginRight: 10 }}>From: {a.fromAddress}</span> : null}
                          <span>
                            {a.receivedAt
                              ? new Date(a.receivedAt).toLocaleString()
                              : a.createdAt
                                ? new Date(a.createdAt).toLocaleString()
                                : "—"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <span
                          className="priority-chip"
                          style={{
                            background: hasError ? "#fee2e2" : ok ? "#dcfce7" : "#fffbeb",
                            color: hasError ? "#b91c1c" : ok ? "#166534" : "#92400e",
                          }}
                          title={hasError ? a.dispatchError : ok ? "Email dispatched" : "Pending dispatch"}
                        >
                          {hasError ? "Error" : ok ? "Emailed" : "Pending"}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setAnnExpandedId(isExpanded ? null : a.id)}
                        >
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div style={{ marginTop: 10 }}>
                        {a.dispatchError ? (
                          <div style={{ marginBottom: 10, color: "#b91c1c" }}>
                            <strong>Dispatch error:</strong> {a.dispatchError}
                          </div>
                        ) : null}
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {(a.bodyText || "").slice(0, 8000) || "—"}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="notifications-grid">
        <section className="notification-main">
          <div className="notification-tools">
            <div className="search-group">
              <FaSearch className="search-icon" />
              <input
                className="search-input"
                type="search"
                placeholder="Search notifications"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <div className="select-group">
                <label>Filter</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="select-group">
                <label>Sort</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="tab-row">
            {tabOptions.map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                className={activeTab === tabKey ? "tab active" : "tab"}
                onClick={() => setActiveTab(tabKey)}
              >
                {tabKey === "all" ? "All Notifications" : tabKey === "unread" ? "Unread" : "Archived"}
              </button>
            ))}
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <FaClipboardList />
              </div>
              <h3>No notifications match your current view.</h3>
              <p>
                Try another filter, refresh the feed, or wait for live MQTT attendance and forecast events to arrive.
              </p>
            </div>
          ) : (
            <div className="notification-list">
              <AnimatePresence>
                {Object.keys(groupedByCategory).map((category) => {
                  const groupItems = groupedByCategory[category];
                  const categoryMeta = categoryMap[category] || { label: "Other" };

                  return (
                    <motion.div
                      key={category}
                      className="notification-group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="group-header">
                        <span>{categoryMeta.label}</span>
                        <small>{groupItems.length} updates</small>
                      </div>
                      <div className="group-cards">
                        {groupItems.map((item) => {
                          const meta = categoryMap[item.category] || categoryMap.system;
                          const Icon = meta.icon;
                          return (
                            <motion.article
                              key={item.id}
                              className={`notification-card ${item.unread ? "unread" : "read"}`}
                              layout
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              whileHover={{ y: -4 }}
                            >
                              <div className="notification-card-row">
                                <div className="notification-avatar" style={{ background: `${meta.accent}22`, color: meta.accent }}>
                                  <Icon />
                                </div>
                                <div className="notification-copy">
                                  <h4>{item.title}</h4>
                                  <p>{item.message}</p>
                                </div>
                                <div className={`priority-chip ${item.priority}`}>
                                  <span className={`priority-dot ${item.priority}`} />
                                  {item.priority}
                                </div>
                              </div>

                              <div className="notification-meta-row">
                                <span className="category-pill">{meta.label}</span>
                                <span>{formatTimestamp(item.timestamp)}</span>
                                {item.unread && <span className="unread-pill">Unread</span>}
                              </div>

                              <div className="notification-actions">
                                <button className="btn btn-sm" onClick={() => setRead(item.id, !item.unread)}>
                                  {item.unread ? "Mark read" : "Mark unread"}
                                </button>
                                <button className="btn btn-sm btn-outline" onClick={() => handleDelete(item.id)}>
                                  Delete
                                </button>
                                <button
                                  className="icon-button"
                                  type="button"
                                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                >
                                  {expandedId === item.id ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                              </div>

                              <AnimatePresence initial={false}>
                                {expandedId === item.id ? (
                                  <motion.div
                                    className="notification-details"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                  >
                                    <p>{item.details}</p>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </motion.article>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Notifications;
