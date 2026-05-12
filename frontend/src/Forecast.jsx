import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { FiActivity, FiAlertCircle, FiArrowRight, FiInfo, FiMail, FiSearch, FiTrash2, FiUsers, FiShield, FiTrendingUp, FiClock, FiDownload, FiFilter, FiRotateCcw, FiZap, FiCheckCircle } from "react-icons/fi";
import { Pie, Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from "chart.js";

import API from "./api";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function riskToMeta(riskLevel) {
  const normalized = String(riskLevel || "").toUpperCase();
  if (normalized === "SAFE") {
    return {
      label: "Low Risk",
      badge: "badge-success",
      color: "#22c55e",
      riskValue: 20,
      intervention: "Maintain current support. Consider enrichment activities to sustain performance.",
      explanation:
        "Model indicates a strong likelihood of academic stability based on GPA and attendance patterns.",
    };
  }
  if (normalized === "WARNING") {
    return {
      label: "Moderate Risk",
      badge: "badge-warning",
      color: "#f59e0b",
      riskValue: 55,
      intervention: "Schedule check-ins and targeted tutoring. Focus on attendance consistency and study habits.",
      explanation:
        "Model sees early indicators of risk. With structured interventions, outcomes can improve.",
    };
  }
  return {
    label: "High Risk",
    badge: "badge-danger",
    color: "#ef4444",
    riskValue: 85,
    intervention:
      "Prioritize intervention: mentoring, attendance recovery plan, and academic assistance.",
    explanation:
      "Model flags elevated risk due to GPA/attendance factors. Immediate support is recommended.",
  };
}

function formatDateTime(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function generateMockForecastHistory() {
  // Mock history for dashboard UX; backend persistence is optional.
  const now = Date.now();
  const days = [0, 1, 2, 3, 4, 5];
  const levels = ["SAFE", "WARNING", "AT RISK"];
  const actions = {
    SAFE: "Keep monitoring",
    WARNING: "Tutoring + attendance plan",
    "AT RISK": "Urgent intervention",
  };

  const items = Array.from({ length: 8 }).map((_, i) => {
    const gpa = clamp(3.2 - i * 0.2 + (i % 2 ? -0.05 : 0.05), 1.0, 4.0);
    const attendance = clamp(88 - i * 5 + (i % 3 ? -3 : 0), 20, 100);
    const riskLevel = levels[i % levels.length];
    const confidence = clamp(78 - i * 3 + (i % 2 ? 2 : -1), 40, 98);
    const createdAt = new Date(now - days[i % days.length] * 24 * 60 * 60 * 1000 - i * 3.2 * 60 * 1000);

    return {
      id: `mock-${i}`,
      created_at: createdAt.toISOString(),
      gpa,
      attendance,
      risk_level: riskLevel,
      prediction_score: clamp(
        riskLevel === "SAFE" ? 23 + i * 2 : riskLevel === "WARNING" ? 52 + i * 2 : 78 + i * 2,
        0,
        100
      ),
      suggested_intervention: actions[riskLevel] || "Support plan",
      confidence,
    };
  });

  // Sort newest first
  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function ProgressGauge({ value, color }) {
  const size = 132;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const percent = clamp(value, 0, 100);
  const dash = (percent / 100) * c;

  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Risk gauge" role="img">
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(148,163,184,0.28)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#riskGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ marginTop: -92, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 800 }}>Risk Score</div>
        <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: "-0.02em" }}>{Math.round(percent)}</div>
      </div>
    </div>
  );
}

function FloatingLabelInput({ label, value, onChange, type = "text", icon, inputMode, error, ariaLabel, max }) {
  return (
    <div className="fl" style={{ position: "relative" }}>
      <div className="fl-icon" aria-hidden="true">
        {icon}
      </div>
      <input
        className="fl-input"
        value={value}
        onChange={onChange}
        type={type}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-label={ariaLabel || label}
        max={max}
        placeholder=" "
      />
      <label className={value ? "fl-label fl-label--active" : "fl-label"}>{label}</label>
      {error ? <div className="fl-error" role="alert">{error}</div> : null}
    </div>
  );
}

function ToastPill({ text, tone }) {
  const cls = tone === "success" ? "badge-success" : tone === "warning" ? "badge-warning" : "badge-danger";
  return <span className={`badge ${cls}`} style={{ fontWeight: 1000 }}>{text}</span>;
}

function Forecast() {
  const [gpa, setGpa] = useState(3.2);
  const [attendance, setAttendance] = useState(82);

  const [gpaStr, setGpaStr] = useState("3.2");
  const [attendanceStr, setAttendanceStr] = useState("82");

  const [history, setHistory] = useState(() => generateMockForecastHistory());

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictPulse, setPredictPulse] = useState(false);

  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const tableTopRef = useRef(null);

  useEffect(() => {
    // Keep numeric state synced with strings.
    const g = parseFloat(gpaStr);
    if (!Number.isNaN(g)) setGpa(g);
    const a = parseFloat(attendanceStr);
    if (!Number.isNaN(a)) setAttendance(a);
  }, [gpaStr, attendanceStr]);

  const gpaError = useMemo(() => {
    const v = parseFloat(gpaStr);
    if (!gpaStr || Number.isNaN(v)) return "GPA is required";
    if (v < 0 || v > 4) return "GPA must be between 0 and 4";
    return "";
  }, [gpaStr]);

  const attendanceError = useMemo(() => {
    const v = parseFloat(attendanceStr);
    if (!attendanceStr || Number.isNaN(v)) return "Attendance is required";
    if (v < 0 || v > 100) return "Attendance must be between 0 and 100";
    return "";
  }, [attendanceStr]);

  const canPredict = !gpaError && !attendanceError && !loading;

  const aiConfidenceMock = useMemo(() => {
    // Lightweight confidence heuristic for UI (backend may return actual later).
    const g = clamp(parseFloat(gpaStr), 0, 4);
    const a = clamp(parseFloat(attendanceStr), 0, 100);
    const riskFactor = (4 - g) * 22 + (100 - a) * 0.55;
    const confidence = clamp(92 - riskFactor, 35, 98);
    return Math.round(confidence);
  }, [gpaStr, attendanceStr]);

  const derivedScore = useMemo(() => {
    const g = clamp(parseFloat(gpaStr), 0, 4);
    const a = clamp(parseFloat(attendanceStr), 0, 100);
    // risk score 0..100
    const score = (4 - g) * 18 + (100 - a) * 0.55;
    return clamp(Math.round(score), 0, 100);
  }, [gpaStr, attendanceStr]);

  const derivedRiskLevel = useMemo(() => {
    const score = derivedScore;
    if (score < 35) return "SAFE";
    if (score < 70) return "WARNING";
    return "AT RISK";
  }, [derivedScore]);

  const meta = useMemo(() => riskToMeta(prediction?.risk_level || derivedRiskLevel), [prediction, derivedRiskLevel]);

  const riskTrend = useMemo(() => {
    const base = derivedScore;
    const points = Array.from({ length: 10 }).map((_, i) => {
      const wobble = (i % 2 ? -1 : 1) * (i * 0.9);
      const drift = i * 1.6;
      return clamp(base + drift + wobble - 12, 0, 100);
    });
    return points;
  }, [derivedScore]);

  const attendanceTrend = useMemo(() => {
    const base = clamp(parseFloat(attendanceStr), 0, 100);
    const points = Array.from({ length: 10 }).map((_, i) => {
      const wobble = (i % 3 === 0 ? -6 : i % 3 === 1 ? 2 : -2);
      const drift = i * 0.6;
      return clamp(Math.round(base + drift + wobble), 0, 100);
    });
    return points;
  }, [attendanceStr]);

  const chartRisk = useMemo(() => {
    const labels = Array.from({ length: 10 }).map((_, i) => `W${i + 1}`);
    return {
      labels,
      datasets: [
        {
          label: "Risk Trend",
          data: riskTrend,
          borderColor: meta.color,
          backgroundColor: "rgba(239,68,68,0.08)",
          tension: 0.35,
          fill: true,
          pointRadius: 2,
        },
      ],
    };
  }, [riskTrend, meta.color]);

  const chartAttendance = useMemo(() => {
    const labels = Array.from({ length: 10 }).map((_, i) => `W${i + 1}`);
    return {
      labels,
      datasets: [
        {
          label: "Attendance Trend",
          data: attendanceTrend,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.08)",
          tension: 0.35,
          fill: true,
          pointRadius: 2,
        },
      ],
    };
  }, [attendanceTrend]);

  const analyticsCards = useMemo(() => {
    const todayCount = history.length;
    const highRiskCount = history.filter((h) => String(h.risk_level).toUpperCase() === "AT RISK").length;
    const avgAttendance = history.length ? Math.round(history.reduce((s, x) => s + x.attendance, 0) / history.length) : 0;
    const avgGpa = history.length ? Number((history.reduce((s, x) => s + x.gpa, 0) / history.length).toFixed(2)) : 0;
    const successProbability = clamp(100 - Math.round((highRiskCount / Math.max(1, todayCount)) * 45 + (100 - avgAttendance) * 0.15), 5, 99);
    return {
      todayCount,
      highRiskCount,
      avgAttendance,
      avgGpa,
      successProbability,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((h) => {
      const matchesQuery =
        !q ||
        String(h.risk_level).toLowerCase().includes(q) ||
        String(h.prediction_score).toLowerCase().includes(q) ||
        String(h.suggested_intervention).toLowerCase().includes(q) ||
        String(h.gpa).toLowerCase().includes(q) ||
        String(h.attendance).toLowerCase().includes(q);

      const matchesRisk =
        riskFilter === "ALL" || String(h.risk_level).toUpperCase() === String(riskFilter).toUpperCase();

      return matchesQuery && matchesRisk;
    });
  }, [history, query, riskFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, riskFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedHistory = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page]);

  const doPredict = async () => {
    const g = clamp(parseFloat(gpaStr), 0, 4);
    const a = clamp(parseFloat(attendanceStr), 0, 100);

    if (!canPredict) {
      toast.error("Fix inputs to predict.");
      return;
    }

    setLoading(true);
    setPredictPulse(true);
    try {
      const res = await API.post("/predict", {
        gpa: g,
        attendance: a,
      });

      const risk = res?.data?.risk ?? derivedRiskLevel;
      const confidence = res?.data?.confidence ?? aiConfidenceMock;
      const score = res?.data?.prediction_score ?? derivedScore;

      const created = new Date().toISOString();

      const newItem = {
        id: `pred-${Date.now()}`,
        created_at: created,
        gpa: g,
        attendance: a,
        risk_level: risk,
        prediction_score: clamp(Math.round(score), 0, 100),
        suggested_intervention: riskToMeta(risk).intervention,
        confidence: clamp(Math.round(confidence), 0, 100),
      };

      setPrediction(newItem);
      setHistory((prev) => [newItem, ...prev]);

      toast.success(`Prediction complete: ${riskToMeta(risk).label}`);

      setTimeout(() => setPredictPulse(false), 550);
    } catch (error) {
      console.error(error);
      // Fallback to derived results so UI works even if backend differs.
      const created = new Date().toISOString();
      const fallback = {
        id: `pred-${Date.now()}`,
        created_at: created,
        gpa: g,
        attendance: a,
        risk_level: derivedRiskLevel,
        prediction_score: derivedScore,
        suggested_intervention: riskToMeta(derivedRiskLevel).intervention,
        confidence: aiConfidenceMock,
      };

      setPrediction(fallback);
      setHistory((prev) => [fallback, ...prev]);

      toast.error(error.response?.data?.message || "Prediction failed — using mock forecast.");
      setTimeout(() => setPredictPulse(false), 550);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setGpaStr("");
    setAttendanceStr("");
    setPrediction(null);
    toast.info("Inputs cleared.");
  };

  const exportCsv = () => {
    const header = ["Date & Time", "Prediction Score", "Risk Level", "Suggested Intervention", "Forecast Confidence", "GPA", "Attendance"];
    const rows = filteredHistory.map((h) => [
      formatDateTime(h.created_at),
      h.prediction_score,
      h.risk_level,
      h.suggested_intervention,
      h.confidence,
      h.gpa,
      h.attendance,
    ]);

    const csv =
      [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n") + "\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "risk_forecast_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    // Simple PDF export fallback: open print dialog.
    toast.info("Exporting to PDF via print dialog...");
    setTimeout(() => window.print(), 350);
  };

  return (
    <motion.div className="forecast-page" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <style>{`
        .forecast-page{ padding: 0; }
        .forecast-wrap{ max-width: 1240px; margin: 0 auto; }
        .forecast-hero{
          background: linear-gradient(135deg, rgba(37,99,235,0.10), rgba(16,185,129,0.08));
          border: 1px solid rgba(59,130,246,0.18);
          border-radius: 18px;
          padding: 18px 18px;
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(10px);
        }
        .forecast-hero-top{ display:flex; justify-content:space-between; gap: 12px; align-items:flex-start; flex-wrap:wrap; }
        .forecast-title{ font-size: 26px; font-weight: 1000; letter-spacing: -0.02em; display:flex; align-items:center; gap: 10px; }
        .forecast-sub{ color: var(--text-secondary); font-weight: 650; margin-top: 6px; max-width: 680px; }
        .forecast-grid{ margin-top: 18px; display:grid; grid-template-columns: 1.05fr 0.95fr; gap: 16px; }
        @media (max-width: 980px){ .forecast-grid{ grid-template-columns: 1fr; } }
        .panel-card{ background: rgba(255,255,255,0.72); backdrop-filter: blur(12px); border: 1px solid rgba(226,232,240,0.9); border-radius: 18px; box-shadow: var(--shadow-md); padding: 16px; }
        [data-theme='dark'] .panel-card{ background: rgba(30,41,59,0.55); border-color: rgba(51,65,85,0.8); }
        .glass{ background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); }
        .section-title{ font-size: 14px; color: var(--text-secondary); font-weight: 950; display:flex; align-items:center; gap: 10px; margin-bottom: 10px; }
        .fl{ width: 100%; }
        .fl-icon{ position:absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 16px; pointer-events:none; }
        .fl-input{
          width:100%;
          border: 1px solid rgba(226,232,240,0.95);
          background: rgba(255,255,255,0.8);
          border-radius: 14px;
          padding: 22px 14px 12px 42px;
          font-size: 15px;
          outline:none;
          transition: var(--transition);
          color: var(--text-primary);
        }
        [data-theme='dark'] .fl-input{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); }
        .fl-input:focus{ border-color: rgba(37,99,235,0.65); box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        .fl-label{
          position:absolute; left: 42px; top: 14px;
          color: var(--text-secondary); font-weight: 800; font-size: 12px;
          pointer-events:none;
          opacity: 0.8;
          transform-origin: left top;
          transition: 180ms ease;
        }
        .fl-label--active{ opacity: 1; transform: translateY(-3px) scale(0.98); }
        .fl-error{ margin-top: 6px; color: var(--danger); font-weight: 900; font-size: 12px; }

        .attendance-slider{ display:flex; gap: 12px; flex-direction:column; }
        .range-row{ display:flex; gap: 12px; align-items:center; }
        .range-row input[type='range']{ width: 100%; }
        .range-pill{ min-width: 92px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.8); font-weight: 1000; text-align:center; }
        [data-theme='dark'] .range-pill{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); }
        .atten-indicator{ display:flex; align-items:center; justify-content:space-between; gap: 10px; flex-wrap:wrap; }
        .dot{ width: 10px; height: 10px; border-radius: 999px; background: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,0.12); }
        .predict-btn{
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 14px 16px;
          color: white;
          font-weight: 1000;
          cursor: pointer;
          background: linear-gradient(135deg, #38bdf8, #2563eb);
          box-shadow: 0 18px 45px rgba(37,99,235,0.25);
          transition: transform 160ms ease, filter 160ms ease;
          position: relative;
          overflow:hidden;
          display:flex; align-items:center; justify-content:center; gap: 10px;
        }
        .predict-btn:hover{ transform: translateY(-2px); filter: brightness(1.02); }
        .predict-btn:disabled{ opacity: 0.7; cursor:not-allowed; transform:none; }
        .predict-btn::after{ content:''; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent); transform: translateX(-100%); transition: 450ms ease; }
        .predict-btn:hover::after{ transform: translateX(100%); }
        .btn-row{ display:flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .btn-secondary-small{ flex: 1; min-width: 180px; border-radius: 16px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.7); padding: 12px 14px; font-weight: 950; cursor:pointer; transition: var(--transition); display:flex; align-items:center; justify-content:center; gap: 10px; }
        [data-theme='dark'] .btn-secondary-small{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); }
        .btn-secondary-small:hover{ transform: translateY(-1px); border-color: rgba(37,99,235,0.35); }

        .risk-badge{ font-weight: 1000; }
        .kpi-grid{ display:grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
        @media (max-width: 980px){ .kpi-grid{ grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px){ .kpi-grid{ grid-template-columns: 1fr; } }
        .kpi{ border-radius: 18px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.65); padding: 14px; }
        [data-theme='dark'] .kpi{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); }
        .kpi-title{ color: var(--text-secondary); font-weight: 900; font-size: 12px; display:flex; gap: 8px; align-items:center; }
        .kpi-value{ margin-top: 8px; font-size: 22px; font-weight: 1100; }

        .chart-card{ padding: 12px; border-radius: 18px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.65); }
        [data-theme='dark'] .chart-card{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); }

        .table-toolbar2{ display:flex; justify-content:space-between; align-items:center; gap: 10px; flex-wrap:wrap; margin-top: 14px; margin-bottom: 10px; }
        .tbl-controls{ display:flex; gap: 10px; align-items:center; flex-wrap:wrap; }
        .search-input2{ padding: 12px 12px 12px 12px; border-radius: 14px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.7); min-width: 280px; font-weight: 800; }
        [data-theme='dark'] .search-input2{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); color: var(--text-primary); }
        .select2{ padding: 12px; border-radius: 14px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.7); font-weight: 900; }
        [data-theme='dark'] .select2{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); color: var(--text-primary); }
        .table-wrap2{ border-radius: 18px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.65); overflow:hidden; box-shadow: var(--shadow-sm); }
        [data-theme='dark'] .table-wrap2{ background: rgba(30,41,59,0.45); border-color: rgba(51,65,85,0.9); }
        table.forecast-table{ border-collapse: collapse; width:100%; }
        table.forecast-table thead th{ position: sticky; top:0; z-index:2; background: rgba(15,23,42,0.95); color: white; padding: 12px; font-size: 12px; font-weight: 1000; }
        [data-theme='dark'] table.forecast-table thead th{ background: rgba(2,6,23,0.95); }
        table.forecast-table tbody td{ padding: 12px; border-bottom: 1px solid rgba(226,232,240,0.6); font-weight: 750; color: var(--text-primary); }
        [data-theme='dark'] table.forecast-table tbody td{ border-bottom-color: rgba(51,65,85,0.6); }
        table.forecast-table tbody tr:hover{ background: rgba(37,99,235,0.08); }

        .pagination2{ display:flex; justify-content:space-between; align-items:center; gap: 12px; padding: 12px; flex-wrap:wrap; }
        .empty2{ padding: 26px; text-align:center; color: var(--text-secondary); }
        .skeleton-row{ height: 18px; border-radius: 9px; background: linear-gradient(90deg, rgba(226,232,240,1) 25%, rgba(240,240,240,1) 50%, rgba(226,232,240,1) 75%); background-size: 200% 100%; animation: loading 1.2s infinite; }
        @media (prefers-reduced-motion: reduce){ .predict-btn::after{ display:none; } }
      `}</style>

      <div className="forecast-wrap">
        <motion.div className="forecast-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="forecast-hero-top">
            <div>
              <div className="forecast-title">
                <FiZap size={22} /> Scholarship Risk Forecasting
              </div>
              <div className="forecast-sub">
                AI-powered risk prediction using GPA and attendance trends to help prioritize scholarship interventions.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <ToastPill text={`Success Probability: ${analyticsCards.successProbability}%`} tone="success" />
              <div className="badge badge-neutral" style={{ fontWeight: 1000, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <FiClock /> {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-title"><FiActivity /> Total Predictions Today</div>
              <div className="kpi-value">{analyticsCards.todayCount}</div>
            </div>
            <div className="kpi">
              <div className="kpi-title"><FiAlertCircle /> High Risk Students Count</div>
              <div className="kpi-value" style={{ color: "#ef4444" }}>{analyticsCards.highRiskCount}</div>
            </div>
            <div className="kpi">
              <div className="kpi-title"><FiTrendingUp /> Average Attendance</div>
              <div className="kpi-value">{analyticsCards.avgAttendance}%</div>
            </div>
            <div className="kpi">
              <div className="kpi-title"><FiUsers /> Average GPA</div>
              <div className="kpi-value">{analyticsCards.avgGpa}</div>
            </div>
            <div className="kpi">
              <div className="kpi-title"><FiShield /> Success Probability Percentage</div>
              <div className="kpi-value">{analyticsCards.successProbability}%</div>
            </div>
          </div>
        </motion.div>

        <div className="forecast-grid">
          {/* Left: Input + Result */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <motion.div className="panel-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="section-title"><FiInfo /> Forecast Inputs</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FloatingLabelInput
                  label="GPA (0–4.0)"
                  value={gpaStr}
                  onChange={(e) => setGpaStr(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  icon={<FiZap />}
                  error={gpaError || ""}
                  ariaLabel="GPA input"
                  max={4}
                />

                <div className="fl" style={{ position: "relative" }}>
                  <div className="fl-icon" aria-hidden="true"><FiTrendingUp /></div>
                  <input
                    className="fl-input"
                    value={attendanceStr}
                    onChange={(e) => setAttendanceStr(e.target.value)}
                    type="number"
                    inputMode="numeric"
                    aria-invalid={Boolean(attendanceError)}
                    aria-label="Attendance numeric input"
                    placeholder=" "
                    max={100}
                  />
                  <label className={attendanceStr ? "fl-label fl-label--active" : "fl-label"}>Attendance % (0–100)</label>
                  {attendanceError ? <div className="fl-error" role="alert">{attendanceError}</div> : null}
                </div>
              </div>

              <div style={{ marginTop: 14 }} className="attendance-slider">
                <div className="range-row">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 12, width: 110 }}>Slider</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Number.isNaN(parseFloat(attendanceStr)) ? 0 : clamp(parseFloat(attendanceStr), 0, 100)}
                    onChange={(e) => setAttendanceStr(String(e.target.value))}
                    aria-label="Attendance slider"
                  />
                  <div className="range-pill">
                    {Number.isNaN(parseFloat(attendanceStr)) ? 0 : Math.round(clamp(parseFloat(attendanceStr), 0, 100))}%
                  </div>
                </div>

                {(() => {
                  const a = Number.isNaN(parseFloat(attendanceStr)) ? 0 : clamp(parseFloat(attendanceStr), 0, 100);
                  const tone = a >= 80 ? "success" : a >= 60 ? "warning" : "danger";
                  const color = tone === "success" ? "#22c55e" : tone === "warning" ? "#f59e0b" : "#ef4444";
                  const label = tone === "success" ? "On Track" : tone === "warning" ? "Monitor" : "Critical";
                  return (
                    <div className="atten-indicator">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="dot" style={{ background: color, boxShadow: `0 0 0 4px ${color}22` }} />
                        <div style={{ fontWeight: 1000 }}>{label}</div>
                      </div>
                      <div className="badge badge-neutral" style={{ fontWeight: 950 }}>
                        Indicator updates in real time
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="btn-row">
                <motion.button
                  className="predict-btn"
                  onClick={doPredict}
                  disabled={!canPredict}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  aria-busy={loading}
                >
                  {loading ? <motion.span style={{ display: "inline-flex", alignItems: "center", gap: 10 }} animate={predictPulse ? { rotate: 0 } : { rotate: 0 }}>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        border: "3px solid rgba(255,255,255,0.35)",
                        borderTopColor: "white",
                        display: "inline-block",
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    Predicting…
                  </motion.span> : (
                    <>
                      Predict Risk <FiArrowRight />
                    </>
                  )}
                </motion.button>
              </div>

              <div className="btn-row">
                <button className="btn-secondary-small" onClick={clearForm} type="button">
                  <FiRotateCcw /> Clear Form
                </button>
              </div>

              <motion.div style={{ marginTop: 14 }} initial={false} animate={{ opacity: prediction ? 1 : 0.95 }}>
                <div className="section-title" style={{ marginTop: 10 }}>
                  <FiShield /> Live Forecast Preview
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span className={`badge risk-badge ${riskToMeta(derivedRiskLevel).badge}`}>{riskToMeta(derivedRiskLevel).label}</span>
                      <span className="badge badge-neutral" style={{ fontWeight: 950 }}>
                        Confidence: {aiConfidenceMock}%
                      </span>
                    </div>
                    <div style={{ marginTop: 10, color: "var(--text-secondary)", fontWeight: 700, fontSize: 13 }}>
                      {riskToMeta(derivedRiskLevel).explanation}
                    </div>
                    <div style={{ marginTop: 10, fontWeight: 950, fontSize: 13 }}>
                      Recommended action: <span style={{ color: meta.color }}>{riskToMeta(derivedRiskLevel).intervention}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <ProgressGauge value={derivedScore} color={meta.color} />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div className="panel-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="section-title"><FiTrendingUp /> Intelligent Forecast Visuals</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="chart-card">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiActivity /> Risk Trend (Mock)
                  </div>
                  <div style={{ height: 220 }}>
                    <Line data={chartRisk} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  </div>
                </div>
                <div className="chart-card">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiTrendingUp /> Attendance Trend (Mock)
                  </div>
                  <div style={{ height: 220 }}>
                    <Line data={chartAttendance} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="chart-card">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiShield /> Risk Distribution (Today)
                  </div>
                  {(() => {
                    const safe = history.filter((h) => String(h.risk_level).toUpperCase() === "SAFE").length;
                    const warn = history.filter((h) => String(h.risk_level).toUpperCase() === "WARNING").length;
                    const risk = history.filter((h) => String(h.risk_level).toUpperCase() === "AT RISK").length;
                    const data = {
                      labels: ["Low Risk", "Moderate", "High Risk"],
                      datasets: [
                        {
                          data: [safe, warn, risk],
                          backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
                          borderWidth: 0,
                        },
                      ],
                    };
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "center" }}>
                        <div style={{ height: 210 }}>
                          <Doughnut data={data} options={{ plugins: { legend: { display: false } }, cutout: "68%" }} />
                        </div>
                        <div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div className="badge badge-success" style={{ justifyContent: "space-between" }}>
                              Low Risk <span style={{ fontWeight: 1000 }}>{safe}</span>
                            </div>
                            <div className="badge badge-warning" style={{ justifyContent: "space-between" }}>
                              Moderate <span style={{ fontWeight: 1000 }}>{warn}</span>
                            </div>
                            <div className="badge badge-danger" style={{ justifyContent: "space-between" }}>
                              High Risk <span style={{ fontWeight: 1000 }}>{risk}</span>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, color: "var(--text-secondary)", fontWeight: 750, fontSize: 13 }}>
                            Based on local history (mock + predictions).
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="chart-card">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiActivity /> GPA vs Attendance Signals
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {(() => {
                      const g = clamp(parseFloat(gpaStr), 0, 4);
                      const a = clamp(parseFloat(attendanceStr), 0, 100);
                      const gScore = clamp(Math.round((g / 4) * 100), 0, 100);
                      const aScore = clamp(Math.round(a), 0, 100);
                      const gTone = gScore >= 75 ? "success" : gScore >= 55 ? "warning" : "danger";
                      const aTone = aScore >= 80 ? "success" : aScore >= 60 ? "warning" : "danger";

                      const bar = (val, tone, label) => {
                        const color = tone === "success" ? "#22c55e" : tone === "warning" ? "#f59e0b" : "#ef4444";
                        const bg = `${color}1f`;
                        return (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ fontWeight: 950, fontSize: 13, color: "var(--text-secondary)" }}>{label}</div>
                              <div style={{ fontWeight: 1100, color: color }}>{val}%</div>
                            </div>
                            <div style={{ height: 10, borderRadius: 999, background: bg, border: `1px solid ${bg}` , overflow: "hidden", marginTop: 8 }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.5 }} style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 999 }} />
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {bar(gScore, gTone, "GPA Performance")}
                          {bar(aScore, aTone, "Attendance Performance")}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="panel-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="section-title"><FiTrendingUp /> Forecast Prediction Result</div>

              <AnimatePresence>
                {prediction ? (
                  <motion.div key={prediction.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 14, alignItems: "center" }}>
                      <ProgressGauge value={prediction.prediction_score} color={riskToMeta(prediction.risk_level).color} />
                      <div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <span className={`badge ${riskToMeta(prediction.risk_level).badge}`} style={{ fontWeight: 1000 }}>
                            Student Risk Level: {riskToMeta(prediction.risk_level).label}
                          </span>
                          <span className="badge badge-neutral" style={{ fontWeight: 1000 }}>
                            Forecast Confidence: {prediction.confidence}%
                          </span>
                        </div>

                        <div style={{ marginTop: 10, color: "var(--text-secondary)", fontWeight: 750, fontSize: 13 }}>
                          {riskToMeta(prediction.risk_level).explanation}
                        </div>

                        <div style={{ marginTop: 10, fontWeight: 1000 }}>
                          Recommended action:
                          <div style={{ marginTop: 6, color: riskToMeta(prediction.risk_level).color, fontWeight: 950 }}>
                            {prediction.suggested_intervention}
                          </div>
                        </div>

                        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div className="chart-card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 1000 }}>Attendance</div>
                            <div style={{ fontSize: 18, fontWeight: 1100 }}>{prediction.attendance}%</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 800, marginTop: 4 }}>
                              {prediction.attendance >= 80 ? "On Track" : prediction.attendance >= 60 ? "Monitor" : "Critical"}
                            </div>
                          </div>
                          <div className="chart-card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 1000 }}>GPA</div>
                            <div style={{ fontSize: 18, fontWeight: 1100 }}>{Number(prediction.gpa).toFixed(2)}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 800, marginTop: 4 }}>
                              {prediction.gpa >= 3.0 ? "Strong" : prediction.gpa >= 2.2 ? "Needs Support" : "High Priority"}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <div className="section-title" style={{ marginBottom: 8 }}>
                            <FiZap /> AI Insights
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontWeight: 780, fontSize: 13, lineHeight: 1.7 }}>
                            <ul style={{ paddingLeft: 18, margin: 0 }}>
                              <li>Attendance drop is a leading indicator for risk escalation.</li>
                              <li>Higher GPA partially offsets attendance-related risk.</li>
                              <li>Confidence reflects how closely inputs match training patterns.</li>
                            </ul>
                          </div>
                        </div>

                        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <ToastPill tone={prediction.risk_level === "SAFE" ? "success" : prediction.risk_level === "WARNING" ? "warning" : "danger"} text="Action Required" />
                          <span className="badge badge-neutral" style={{ fontWeight: 1000, display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <FiCheckCircle /> Generated {formatDateTime(prediction.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="empty2">
                      <div style={{ fontSize: 38, marginBottom: 10 }}>📈</div>
                      <div style={{ fontWeight: 1000, color: "var(--text-primary)" }}>No prediction yet</div>
                      <div style={{ marginTop: 8 }}>Enter GPA & Attendance and click <b>Predict Risk</b> to generate an AI forecast.</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right: History Table + Exports + Charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <motion.div className="panel-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="section-title"><FiUsers /> Forecast History Analytics</div>

              <div className="table-toolbar2">
                <div className="tbl-controls">
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}><FiSearch /></div>
                    <input
                      className="search-input2"
                      style={{ paddingLeft: 42 }}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search predictions (risk, score, intervention)…"
                      aria-label="Search predictions"
                    />
                  </div>

                  <select className="select2" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} aria-label="Filter by risk level">
                    <option value="ALL">All Risk Levels</option>
                    <option value="SAFE">Low Risk</option>
                    <option value="WARNING">Moderate Risk</option>
                    <option value="AT RISK">High Risk</option>
                  </select>
                </div>

                <div className="tbl-controls">
                  <button className="btn-secondary-small" type="button" onClick={exportCsv} style={{ minWidth: 160 }}>
                    <FiDownload /> Export CSV
                  </button>
                  <button className="btn-secondary-small" type="button" onClick={exportPdf} style={{ minWidth: 160 }}>
                    <FiDownload /> Export PDF
                  </button>
                </div>
              </div>

              <div ref={tableTopRef} className="table-wrap2">
                <div style={{ overflowX: "auto" }}>
                  <table className="forecast-table" aria-label="Predictions history table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Prediction Score</th>
                        <th>Risk Level</th>
                        <th>Suggested Intervention</th>
                        <th>Forecast Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {pagedHistory.length ? (
                          pagedHistory.map((h) => {
                            const tone = String(h.risk_level).toUpperCase() === "SAFE" ? "success" : String(h.risk_level).toUpperCase() === "WARNING" ? "warning" : "danger";
                            const color = tone === "success" ? "#22c55e" : tone === "warning" ? "#f59e0b" : "#ef4444";
                            return (
                              <motion.tr key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
                                <td>{formatDateTime(h.created_at)}</td>
                                <td style={{ fontWeight: 1100 }}>{Math.round(h.prediction_score)}</td>
                                <td>
                                  <span className={`badge ${tone === "success" ? "badge-success" : tone === "warning" ? "badge-warning" : "badge-danger"}`} style={{ borderRadius: 999, border: `1px solid ${color}55`, background: `${color}1a`, color: color, fontWeight: 1100 }}>
                                    {String(h.risk_level).toUpperCase()}
                                  </span>
                                </td>
                                <td>{h.suggested_intervention}</td>
                                <td>
                                  <span className="badge badge-neutral" style={{ fontWeight: 1100 }}>{Math.round(h.confidence)}%</span>
                                </td>
                              </motion.tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5}>
                              <div className="empty2">
                                <div style={{ fontSize: 42, marginBottom: 8 }}>🧠</div>
                                <div style={{ fontWeight: 1000, color: "var(--text-primary)" }}>No predictions found</div>
                                <div style={{ marginTop: 8 }}>Adjust filters or generate a new forecast.</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <div className="pagination2">
                  <div style={{ color: "var(--text-secondary)", fontWeight: 900 }}>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredHistory.length)} of {filteredHistory.length}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button className="btn-secondary-small" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.6 : 1, minWidth: 140 }}>
                      Prev
                    </button>
                    <div className="badge badge-neutral" style={{ fontWeight: 1100 }}>Page {page} / {totalPages}</div>
                    <button className="btn-secondary-small" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: page >= totalPages ? 0.6 : 1, minWidth: 140 }}>
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="panel-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="section-title"><FiAlertCircle /> Risk Analytics Snapshot</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <div className="chart-card">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>High-risk vs others</div>
                  {(() => {
                    const safe = history.filter((h) => String(h.risk_level).toUpperCase() === "SAFE").length;
                    const warn = history.filter((h) => String(h.risk_level).toUpperCase() === "WARNING").length;
                    const risk = history.filter((h) => String(h.risk_level).toUpperCase() === "AT RISK").length;
                    const data = {
                      labels: ["Low", "Moderate", "High"],
                      datasets: [
                        {
                          label: "Count",
                          data: [safe, warn, risk],
                          backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
                          borderRadius: 12,
                        },
                      ],
                    };
                    return (
                      <div style={{ height: 220 }}>
                        <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                      </div>
                    );
                  })()}
                </div>

                <div className="chart-card">
                  <div style={{ fontWeight: 1000, color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>Forecast confidence distribution (mock)</div>
                  {(() => {
                    const conf = history.slice(0, 8).map((h) => clamp(Math.round(h.confidence), 0, 100));
                    const data = {
                      labels: conf.map((_, i) => `P${i + 1}`),
                      datasets: [
                        {
                          label: "Confidence",
                          data: conf,
                          borderColor: "#2563eb",
                          backgroundColor: "rgba(37,99,235,0.10)",
                          tension: 0.35,
                          fill: true,
                          pointRadius: 2,
                        },
                      ],
                    };
                    return (
                      <div style={{ height: 220 }}>
                        <Line data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </motion.div>
  );
}

export default Forecast;

