import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import StudentDashboard from "./portal/StudentDashboard.jsx";
import StudentProfile from "./portal/StudentProfile.jsx";
import StudentQRCode from "./portal/StudentQRCode.jsx";
import AttendanceHistory from "./portal/AttendanceHistory.jsx";
import ForecastPage from "./portal/ForecastPage.jsx";
import StudentNotifications from "./portal/StudentNotifications.jsx";
import ScholarshipDetails from "./portal/ScholarshipDetails.jsx";
import DocumentsRequirements from "./portal/DocumentsRequirements.jsx";
import StudentSettings from "./portal/StudentSettings.jsx";

function StudentPortal({ page }) {
  const [studentData, setStudentData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  const refreshPortal = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Uses the logged-in student's token
        const token = localStorage.getItem("token");
        if (!token) {
          if (!mounted) return;
          setError("Missing token. Please login again.");
          setStudentData(null);
          return;
        }

        const API_URL = process.env.REACT_APP_API_URL || "http://192.168.0.244:5000";
        const meRes = await fetch(`${API_URL}/student/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const mePayload = await meRes.json();

        if (!meRes.ok) {
          throw new Error(mePayload?.message || "Failed to load student profile");
        }

        const d = mePayload?.data || {};

        const annRes = await fetch(`${API_URL}/student/announcements`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const annPayload = await annRes.json();
        if (!annRes.ok) {
          throw new Error(annPayload?.message || "Failed to load announcements");
        }

        const annList = annPayload?.data || [];


        // Map backend fields -> UI expected shape.
        // Attendance, forecastRisk, totalScans are not provided by /student/me yet in this app,
        // so keep reasonable defaults (UI will still render).
        const mapped = {
          id: d.id ?? 0,
          name: d.name ?? "Student",
          studentId: d.student_id ?? "",
          awardNumber: d.awardNumber ?? "",
          program: d.program ?? "",
          yearLevel: d.yearLevel ?? "",
          scholarshipType: d.scholarshipType ?? "",
          scholarshipStatus: d.scholarshipStatus ?? "Active",
          attendance: 87,
          forecastRisk: "Low",
          qrGenerated: Boolean(d.qrCode),
          lastQrScan: "—",
          totalScans: 0,
          avatar:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(d.name || "Student"),
          guardian: "",
          birthdate: d.birthdate ?? "",
          contactNumber: d.contactNumber ?? "",
          academicYear: d.academicYear ?? "",
        };

        if (mounted) {
          setStudentData(mapped);
          setAnnouncements(annList);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load portal");
        setStudentData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const CurrentPage = useMemo(() => {
    if (page === "student-profile") return StudentProfile;
    if (page === "student-qr") return StudentQRCode;
    if (page === "student-attendance") return AttendanceHistory;
    if (page === "student-forecast") return ForecastPage;
    if (page === "student-notifications") return StudentNotifications;
    if (page === "student-scholarship") return ScholarshipDetails;
    if (page === "student-documents") return DocumentsRequirements;
    if (page === "student-settings") return StudentSettings;
    return StudentDashboard;
  }, [page]);

  if (loading) {
    return (
      <div className="panel">
        <div className="card card-glass skeleton" style={{ minHeight: 220 }} />
        <div className="stat-card-grid" style={{ marginTop: 18 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton" style={{ minHeight: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ padding: "1rem" }}>
        <div style={{ color: "#ef4444", fontWeight: 900 }}>{error}</div>
      </div>
    );
  }


  return (
    <AnimatePresence>
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25 }}
      >
        <CurrentPage
          studentData={studentData}
          announcements={announcements}
          onProfileUpdate={refreshPortal}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default StudentPortal;
