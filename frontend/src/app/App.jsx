import { useEffect, useMemo, useState } from "react";

import Login from "../pages/auth/Login";
import Sidebar from "../components/layout/Sidebar";

import Dashboard from "../pages/admin/Dashboard";
import GranteeDashboard from "../pages/admin/GranteeDashboard";
import QRScanner from "../pages/admin/QRScanner";
import Forecast from "../pages/admin/Forecast";
import Notifications from "../pages/admin/Notifications";
import Analytics from "../pages/admin/Analytics";
import AdminDocumentScan from "../pages/admin/AdminDocumentScan";
import Loading from "../components/feedback/Loading";
import StudentPortal from "../pages/student/StudentPortal";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import { FiMoon, FiSun } from "react-icons/fi";

import { getLoginVariant, STAFF_LOGIN_PATH } from "./auth/authRoute";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [studentName, setStudentName] = useState(null);

  const [loginVariant, setLoginVariant] = useState(
    () => getLoginVariant()
  );

  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const sync = () => setLoginVariant(getLoginVariant());
    window.addEventListener("popstate", sync);
    return () =>
      window.removeEventListener("popstate", sync);
  }, []);

  // Load from storage once
  useEffect(() => {
    const savedTheme =
      localStorage.getItem("appTheme") ||
      localStorage.getItem("authTheme");

    const nextTheme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setIsDarkMode(nextTheme !== "light");

    try {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedToken) setToken(savedToken);
    } catch (e) {
      console.error("LocalStorage parse error:", e);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // Global axios token attachment
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  // Student landing page
  useEffect(() => {
    if (!user) return;

    if (user.role === "student") {
      setPage((prev) => (prev.startsWith("student-") ? prev : "student-dashboard"));
    } else if (user.role === "admin" && page.startsWith("student-")) {
      setPage("dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save user
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  // Save token
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
  }, [token]);

  useEffect(() => {
    if (loading || !user) return;

    const v = getLoginVariant();

    if (user.role === "admin" && v === "student") {
      window.history.replaceState(null, "", STAFF_LOGIN_PATH);

      setLoginVariant("admin");
    } else if (
      user.role === "student" &&
      v === "admin"
    ) {
      window.history.replaceState(null, "", "/");

      setLoginVariant("student");
    }
  }, [loading, user]);

  // Load student profile name for top bar (so it shows the students table name)
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        if (!isStudent || !token) {
          if (mounted) setStudentName(null);
          return;
        }

        const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
        const res = await fetch(`${API_URL}/student/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.message || "Failed to load student profile");
        }

        const payload = await res.json();
        const name = payload?.data?.name;
        if (mounted) setStudentName(name || null);
      } catch {
        if (mounted) setStudentName(null);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [isStudent, token]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      document.title =
        loginVariant === "admin"
          ? "Scholarship System — Staff sign-in"
          : "Scholarship System — Student portal";
      return;
    }
    document.title = `Scholarship System - ${page}`;
  }, [page, user, loginVariant]);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("appTheme", next ? "dark" : "light");
  };

  const topBarName = useMemo(() => {
    if (!user) return "";
    if (!isStudent) return user?.name;
    return studentName || user?.name;
  }, [user, isStudent, studentName]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        theme="dark"
      />

      {loading ? (
        <Loading />
      ) : !user ? (
        <Login
          setUser={setUser}
          setToken={setToken}
          variant={loginVariant}
        />
      ) : (
        <div className="app-container">
          <Sidebar page={page} setPage={setPage} role={user?.role} />

          <div className="main">
            <div className="topbar">
              <div className="topbar-left">
                <h3>
                  Welcome, {topBarName}{" "}
                  <span className="topbar-role">({user?.role})</span>
                </h3>
                <div className="topbar-meta">
                  <span className="status-pill">
                    <span className="status-dot" /> Live session
                  </span>
                  <span>{currentTime.toLocaleString()}</span>
                </div>
              </div>

              <div className="topbar-right">
                <button
                  type="button"
                  className="pill btn-ghost"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <FiSun /> : <FiMoon />}
                  <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>

                <div className="session-pill">JWT: {token ? "Active" : "Missing"}</div>

                <button
                  className="btn btn-ghost logout-btn"
                  onClick={() => {
                    localStorage.clear();
                    delete axios.defaults.headers.common[
                      "Authorization"
                    ];
                    window.location.assign("/");
                  }}
                >
                  Logout
                </button>
              </div>
            </div>

            {page === "dashboard" && isAdmin && <Dashboard />}
            {page === "students" && isAdmin && <GranteeDashboard />}
            {page === "document-scan" && isAdmin && <AdminDocumentScan />}
            {page === "qr" && isAdmin && <QRScanner />}
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
