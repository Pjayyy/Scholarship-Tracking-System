import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import StudentDashboard from "./StudentPortal/StudentDashboard.jsx";
import StudentProfile from "./StudentPortal/StudentProfile.jsx";
import StudentQRCode from "./StudentPortal/StudentQRCode.jsx";
import AttendanceHistory from "./StudentPortal/AttendanceHistory.jsx";
import ForecastPage from "./StudentPortal/ForecastPage.jsx";
import StudentNotifications from "./StudentPortal/StudentNotifications.jsx";
import ScholarshipDetails from "./StudentPortal/ScholarshipDetails.jsx";
import DocumentsRequirements from "./StudentPortal/DocumentsRequirements.jsx";
import StudentSettings from "./StudentPortal/StudentSettings.jsx";

function StudentPortal({ page }) {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace mock with API call using logged-in user.
    const mockStudentData = {
      id: 1,
      name: "Maria Santos",
      studentId: "2024-0001",
      awardNumber: "TDP-2024-001",
      email: "maria.santos@university.edu",
      phone: "+63 912 345 6789",
      program: "BSCS",
      yearLevel: "2nd Year",
      scholarshipType: "TDP",
      scholarshipStatus: "Active",
      attendance: 87,
      forecastRisk: "Low",
      qrGenerated: true,
      lastQrScan: "2026-05-10 10:30 AM",
      totalScans: 45,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      guardian: "Juan Santos",
      birthdate: "2006-03-15",
      contactNumber: "09123456789",
      academicYear: "2024-2025",
    };

    setStudentData(mockStudentData);
    setLoading(false);
  }, []);

  const CurrentPage = useMemo(() => {
    switch (page) {
      case "student-profile":
        return StudentProfile;
      case "student-qr":
        return StudentQRCode;
      case "student-attendance":
        return AttendanceHistory;
      case "student-forecast":
        return ForecastPage;
      case "student-notifications":
        return StudentNotifications;
      case "student-scholarship":
        return ScholarshipDetails;
      case "student-documents":
        return DocumentsRequirements;
      case "student-settings":
        return StudentSettings;
      case "student-dashboard":
      default:
        return StudentDashboard;
    }
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25 }}
      >
        <CurrentPage studentData={studentData} />
      </motion.div>
    </AnimatePresence>
  );
}

export default StudentPortal;

