﻿import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaBell,
  FaChartLine,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTrashAlt,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
} from "react-icons/fa";
import API from "../../services/api";
import "../../styles/Notifications.css";
import "../../styles/LatestAnnouncements.css";


const categoryMap = {
  forecast: { label: "Audit", icon: FaChartLine, accent: "var(--secondary)" },
  scholarship: { label: "Scholarship", icon: FaShieldAlt, accent: "var(--success)" },
  system: { label: "System", icon: FaInfoCircle, accent: "var(--warning)" },
  docs: { label: "Documents", icon: FaClipboardList, accent: "var(--primary)" },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };
const tabOptions = ["all", "unread", "archived"];
const filterOptions = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "attendance", label: "Attendance" },
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
    category: category === "attendance" || category === "qr" ? "docs" : category,
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
      category: "docs",
      priority: "medium",
      title: "Document submission portal updated",
      message: "New forms for the upcoming semester are now available.",
      details:
        "Students are notified to upload their latest grades and registration forms via the portal.",
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
  const [annStatus, setAnnStatus] = useState("all");


  // Latest announcements (premium feed) pagination state
  const [latestPage, setLatestPage] = useState(1);
  const latestPageSize = 6;
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

        const enabled = Boolean(a.emailDispatchedAt);
        const hasError = Boolean(a.dispatchError);

        if (annStatus !== "all") {
          if (annStatus === "enabled" && !enabled) return false;
          if (annStatus === "pending" && (enabled || hasError)) return false;
          if (annStatus === "errors" && !hasError) return false;
        }

        if (!term) return true;
        const hay = `${a.title || ""} ${a.fromAddress || ""} ${a.bodyText || ""}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 200);
  }, [annSearch, annSource, annStatus, announcements]);


  const latestAnnouncementsTotal = filteredAnnouncements.length;
  const latestAnnouncementsTotalPages = Math.max(1, Math.ceil(latestAnnouncementsTotal / latestPageSize));
  const latestAnnouncements = useMemo(() => {
    const safePage = Math.min(latestPage, latestAnnouncementsTotalPages);
    const start = (safePage - 1) * latestPageSize;
    return filteredAnnouncements.slice(start, start + latestPageSize);
  }, [filteredAnnouncements, latestPage, latestAnnouncementsTotalPages]);

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
            <div className="kicker" style={{ color: 'white', marginBottom: '0.5rem', opacity: 0.9 }}>Scholarship Management</div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', lineHeight: 1.1, marginBottom: '1rem' }}>Audit logs and system events.</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '600px', fontSize: '1.1rem' }}>
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

      <section className="latest-announcements-card">
        <div className="latest-announcements-topbar">
          <div>
            <div className="latest-announcements-kicker">Latest Announcements</div>
            <div className="latest-announcements-title">Neon timeline feed</div>
          </div>

          <button
            type="button"
            className="latest-clear-btn"
            onClick={() => {
              setAnnouncements([]);
              setLatestPage(1);
              toast.warning("Announcements cleared");
            }}
          >
            Clear
          </button>
        </div>

        <div className="latest-announcements-subbar">
          <div className="latest-count">
            <span className="latest-count-label">Showing</span>
            <span className="latest-count-value">{latestAnnouncements.length}</span>
            <span className="latest-count-label">of</span>
            <span className="latest-count-value">{latestAnnouncementsTotal}</span>
          </div>

          <div className="latest-pagination">
            <button
              type="button"
              className={latestPage <= 1 ? "latest-page-btn disabled" : "latest-page-btn"}
              onClick={() => latestPage > 1 && setLatestPage((p) => p - 1)}
              disabled={latestPage <= 1}
            >
              <FaChevronLeft />
            </button>

            {Array.from({ length: latestAnnouncementsTotalPages }, (_, i) => i + 1)
              .slice(Math.max(0, latestPage - 3), Math.min(latestAnnouncementsTotalPages, latestPage + 2))
              .map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={pageNum === latestPage ? "latest-page-pill active" : "latest-page-pill"}
                  onClick={() => setLatestPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

            <button
              type="button"
              className={latestPage >= latestAnnouncementsTotalPages ? "latest-page-btn disabled" : "latest-page-btn"}
              onClick={() => latestPage < latestAnnouncementsTotalPages && setLatestPage((p) => p + 1)}
              disabled={latestPage >= latestAnnouncementsTotalPages}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="latest-announcements-feed">
          {annLoading ? (
            <div className="latest-loading">Loading announcements…</div>
          ) : latestAnnouncements.length === 0 ? (
            <div className="latest-empty">No announcements found.</div>
          ) : (
            <div className="latest-timeline">
              {latestAnnouncements.map((a) => {
                const senderEmail = a.fromAddress || a.senderEmail || a.from || "unknown@domain.com";
                const tsRaw = a.receivedAt || a.createdAt || a.timestamp;
                const ts = tsRaw ? new Date(tsRaw).toISOString() : "";
                const tsLabel = tsRaw ? new Date(tsRaw).toLocaleString() : "—";
                const dispatched = Boolean(a.emailDispatchedAt);

                return (
                  <article key={a.id} className="latest-feed-item">
                    <div className="latest-left">
                      <div className="latest-node" />
                    </div>

                    <div className="latest-card">
                      <div className="latest-card-body">
                        <div className="latest-card-header">
                          <h4 className="latest-ann-title">{a.title || "—"}</h4>
                        </div>

                        <p className="latest-ann-preview">{(a.bodyText || "").slice(0, 220) || "—"}</p>

                        <div className="latest-sender">
                          <span className="latest-sender-label">From</span>
                          <span className="latest-sender-email">{senderEmail}</span>
                        </div>
                      </div>

                      <div className="latest-meta-right">
                        <div className="latest-timestamp">
                          <FaCalendarAlt className="latest-calendar" />
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
          )}
        </div>
      </section>



      {/* </section> */}

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
                Try another filter, refresh the feed, or wait for document and audit events to arrive.
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
