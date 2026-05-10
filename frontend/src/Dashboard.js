import { useState, useEffect, useCallback } from "react";
import API from "./api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

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

      // ✅ JWT TOKEN AUTO INCLUDED
      const statsRes = await API.get(
        "/dashboard/stats"
      );

      setTotalStudents(
        statsRes.data.students
      );

      setTotalUsers(
        statsRes.data.users
      );

      setTodayAttendance(
        statsRes.data.attendance
      );

    } catch (err) {

      console.error(err);

      setError(
        "Failed to fetch data"
      );

      toast.error(
        "Failed to fetch dashboard data"
      );

    } finally {

      setLoading(false);
    }

  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {

    return (

      <motion.div
        className="card-grid fade-in"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

        {[1, 2, 3].map((i) => (

          <div
            key={i}
            className="card skeleton h-48"
          />

        ))}

      </motion.div>
    );
  }

  if (error) {

    return (

      <motion.div
        className="text-center fade-in"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >

        <h1 className="mb-4">
          Error loading dashboard
        </h1>

        <button
          className="btn"
          onClick={handleRefresh}
        >

          🔄 Retry

        </button>

      </motion.div>
    );
  }

  return (

    <motion.div
      className="fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <div className="topbar mb-8">

        <h1 className="text-3xl font-bold">
          📊 Admin Dashboard
        </h1>

        <button
          className="btn"
          onClick={handleRefresh}
        >

          🔄 Refresh

        </button>

      </div>

      <div className="card-grid">

        <Card
          title="Total Beneficiaries"
          value={totalStudents}
          color="success"
        />

        <Card
          title="Total Users"
          value={totalUsers}
          color="primary"
        />

        <Card
          title="Today's Attendance"
          value={todayAttendance}
          color="warning"
        />

      </div>

      <div className="footer text-center mt-12">

        Scholarship Tracking System
        &copy; ACLC College of Tacloban

      </div>

    </motion.div>
  );
}

function Card({
  title,
  value,
  color = "primary",
}) {

  const colorClass = `card-${color}`;

  return (

    <motion.div
      className={`card ${colorClass}`}
      whileHover={{ y: -8 }}
      transition={{
        type: "spring",
        stiffness: 300,
      }}
    >

      <h3>{title}</h3>

      <h1>{value || "0"}</h1>

    </motion.div>
  );
}

export default Dashboard;