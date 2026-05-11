import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiRefreshCcw, FiUsers, FiUserCheck, FiShield } from "react-icons/fi";
import { toast } from "react-toastify";
import API from "./api";

function Dashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsRes = await API.get("/dashboard/stats");
      setTotalStudents(statsRes.data.students);
      setTotalUsers(statsRes.data.users);
      setTodayAttendance(statsRes.data.attendance);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <motion.div
        className="card-grid fade-in"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="card skeleton" style={{ minHeight: 140 }} />
        ))}
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="card card-glass fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="panel-head">
          <div className="panel-title">
            <FiShield />
            Admin Dashboard
          </div>
          <button className="btn" type="button" onClick={fetchData}>
            <FiRefreshCcw />
            Retry
          </button>
        </div>
        <div className="hint">{error}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fade-in"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="page-hero" style={{ marginBottom: 18 }}>
        <div className="page-hero__row">
          <div>
            <div className="kicker">Scholarship Intelligence</div>
            <div className="page-title">Smart Scholarship Tracking &amp; Monitoring</div>
          </div>

          <div className="hero-actions">
            <span className="pill">
              <FiShield />
              Admin View
            </span>
            <button className="btn btn-ghost" type="button" onClick={fetchData} aria-label="Refresh dashboard">
              <FiRefreshCcw />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="stat-card-grid" style={{ marginBottom: 18 }}>
        <StatCard icon={<FiUsers />} title="Total Scholars" value={totalStudents} gradientClass="stat-scanned" />
        <StatCard icon={<FiShield />} title="Total Users" value={totalUsers} gradientClass="stat-present" />
        <StatCard icon={<FiUserCheck />} title="Attendance Today" value={todayAttendance} gradientClass="stat-late" />
      </div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, gradientClass }) {
  return (
    <motion.div className={`stat-card ${gradientClass}`} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300 }}>
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <div className="stat-title">{title}</div>
      </div>
      <div className="stat-value">{value || 0}</div>
    </motion.div>
  );
}

export default Dashboard;
