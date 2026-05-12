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
import API from "./api";
import "./Notifications.css";

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
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
    const liveFeed = setInterval(() => {
      const event = createLiveNotification();
      setNotifications((prev) => [event, ...prev].slice(0, 50));
      toast.info(`${event.title}`, {
        icon: <FaBell />,
      });
      setLastUpdated(new Date());
    }, 18000);

    const autoRefresh = setInterval(() => refreshNotifications(false), 42000);

    return () => {
      clearInterval(liveFeed);
      clearInterval(autoRefresh);
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
  const totalToday = notifications.length;
  const highPriority = notifications.filter((item) => item.priority === "high").length;
  const attendanceCount = notifications.filter((item) => item.category === "attendance").length;

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
            <div className="hero-label">Notification Center</div>
            <h1>Real-time scholarship alerts, attendance updates, and forecasting notifications.</h1>
            <p>
              A modern notification center built for actionable insights, live event delivery,
              and high-priority response workflows.
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

        <aside className="notification-sidebar">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-head">
                <FaClipboardList />
                <span>Total Today</span>
              </div>
              <strong>{totalToday}</strong>
            </div>
            <div className="stat-card">
              <div className="stat-head">
                <FaBell />
                <span>Unread</span>
              </div>
              <strong>{unreadCount}</strong>
            </div>
            <div className="stat-card">
              <div className="stat-head">
                <FaShieldAlt />
                <span>High Priority</span>
              </div>
              <strong>{highPriority}</strong>
            </div>
            <div className="stat-card">
              <div className="stat-head">
                <FaUserCheck />
                <span>Attendance Alerts</span>
              </div>
              <strong>{attendanceCount}</strong>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-card-head">
              <div>
                <h3>Live Event Timeline</h3>
                <p>Latest real-time activity delivered from the scholarship event stream.</p>
              </div>
            </div>
            <div className="timeline-list">
              {notifications.slice(0, 5).map((item) => {
                const Icon = categoryMap[item.category]?.icon || FaInfoCircle;
                const accent = categoryMap[item.category]?.accent || "#6366f1";
                return (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-icon" style={{ background: `${accent}22`, color: accent }}>
                      <Icon />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{formatTimestamp(item.timestamp)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Notifications;
