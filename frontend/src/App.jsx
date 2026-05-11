import { useEffect, useState } from "react";

import Login from "./Login";
import Sidebar from "./Sidebar";

import Dashboard from "./Dashboard";
import StudentList from "./StudentList";
import GranteeDashboard from "./GranteeDashboard";
import AttendanceMonitor from "./AttendanceMonitor";
import Forecast from "./Forecast";
import Notifications from "./Notifications";
import Analytics from "./Analytics";
import Loading from "./Loading";
import StudentPortal from "./StudentPortal";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import { FiMoon, FiSun } from "react-icons/fi";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";

  // Load from storage + END LOADING
  useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || localStorage.getItem("authTheme");
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setIsDarkMode(nextTheme !== "light");

    try {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (e) {
      console.error("LocalStorage parse error:", e);
      localStorage.clear();
    } finally {
      console.log("Setting loading to false after localStorage");
      setLoading(false);  // Sync set false
      // Timeout for visual effect if needed
      setTimeout(() => {
        console.log("Timeout fired, loading already false");
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role === "student") {
      setPage("student-dashboard");
    } else if (user.role === "admin" && page.startsWith("student-")) {
      setPage("dashboard");
    }
  }, [user, page]);

  // Save user
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  // Save token
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [token]);

  // GLOBAL AXIOS TOKEN ATTACHMENT
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  // loading timer removed - handled in localStorage effect

// debug
  useEffect(() => {
    console.log("Loading state:", loading);
  }, [loading]);
  useEffect(() => {
    console.log("USER:", user);
  }, [user]);

  useEffect(() => {
    document.title = `Scholarship System - ${page}`;
  }, [page]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  console.log("Render check - loading:", loading, "user:", !!user);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("appTheme", next ? "dark" : "light");
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop theme="dark" />

      {loading ? (
        <Loading />
      ) : !user ? (
        <Login setUser={setUser} setToken={setToken} />
      ) : (
        <div className="app-container">

      <Sidebar page={page} setPage={setPage} role={user?.role} />

      <div className="main">

        <div className="topbar">
          <div className="topbar-left">
            <h3>
              Welcome, {user?.name} <span className="topbar-role">({user?.role})</span>
            </h3>
            <div className="topbar-meta">
              <span className="status-pill">
                <span className="status-dot" /> Live session
              </span>
              <span>{currentTime.toLocaleString()}</span>
            </div>
          </div>

          <div className="topbar-right">
            <button type="button" className="pill btn-ghost" onClick={toggleTheme} aria-label="Toggle theme">
              {isDarkMode ? <FiSun /> : <FiMoon />}
              <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <div className="session-pill">JWT: {token ? "Active" : "Missing"}</div>
            <button
              className="btn btn-ghost logout-btn"
              onClick={() => {
                setUser(null);
                setToken(null);
                localStorage.clear();
                delete axios.defaults.headers.common["Authorization"];
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {page === "dashboard" && isAdmin && <Dashboard />}
        {page === "students" && isAdmin && <GranteeDashboard />}
        {page === "qr" && isAdmin && <AttendanceMonitor />}
        {page === "forecast" && isAdmin && <Forecast />}
        {page === "notifications" && isAdmin && <Notifications />}
        {page === "analytics" && isAdmin && <Analytics />}
        {isStudent && <StudentPortal page={page} />}
      </div>
    </div>
  )}
    </>
  );
}

export default App;
