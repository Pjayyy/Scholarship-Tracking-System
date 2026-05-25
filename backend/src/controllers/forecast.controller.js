const db = require("../services/db.js");
const axios = require("axios");

function normalizeRisk(risk) {
  const v = String(risk || "").toUpperCase();
  if (v === "SAFE") return "SAFE";
  if (v === "WARNING") return "WARNING";
  if (v === "AT RISK" || v === "ATRISK" || v === "AT_RISK") return "AT RISK";
  // Default to AT RISK to be conservative
  return "AT RISK";
}

function riskFromScore(score0to100) {
  const s = Number(score0to100);
  if (!Number.isFinite(s)) return "WARNING";
  if (s < 35) return "SAFE";
  if (s < 70) return "WARNING";
  return "AT RISK";
}

function scoreFromInputs(gpa, attendance) {
  const g = Math.max(0, Math.min(4, Number(gpa)));
  const a = Math.max(0, Math.min(100, Number(attendance)));
  // Match frontend approximation: (4-g)*18 + (100-a)*0.55
  const score = (4 - g) * 18 + (100 - a) * 0.55;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function confidenceHeuristic(gpa, attendance, risk) {
  const g = Math.max(0, Math.min(4, Number(gpa)));
  const a = Math.max(0, Math.min(100, Number(attendance)));
  // Match frontend heuristic
  const riskFactor = (4 - g) * 22 + (100 - a) * 0.55;
  const confidence = 92 - riskFactor;
  return Math.max(35, Math.min(98, Math.round(confidence)));
}

function suggestedIntervention(riskLevel) {
  const r = normalizeRisk(riskLevel);
  if (r === "SAFE") {
    return {
      label: "Low Risk",
      intervention:
        "Maintain current support. Consider enrichment activities to sustain performance.",
      explanation:
        "Model indicates a strong likelihood of academic stability based on GPA and attendance patterns.",
    };
  }
  if (r === "WARNING") {
    return {
      label: "Moderate Risk",
      intervention:
        "Schedule check-ins and targeted tutoring. Focus on attendance consistency and study habits.",
      explanation:
        "Model sees early indicators of risk. With structured interventions, outcomes can improve.",
    };
  }
  return {
    label: "High Risk",
    intervention:
      "Prioritize intervention: mentoring, attendance recovery plan, and academic assistance.",
    explanation:
      "Model flags elevated risk due to GPA/attendance factors. Immediate support is recommended.",
  };
}

async function callPythonModel(gpa, attendance) {
  const mlBaseUrl = process.env.RISK_ML_BASE_URL || "http://127.0.0.1:5001";

  // app.py exposes /predict expecting {gpa, attendance}
  const res = await axios.post(`${mlBaseUrl}/predict`, { gpa, attendance }, { timeout: 30000 });
  const risk = res?.data?.risk;
  return { risk };
}

async function predictRisk(req, res) {
  try {
    const { gpa, attendance, student_id } = req.body || {};

    const g = Number(gpa);
    const a = Number(attendance);

    if (!Number.isFinite(g) || g < 0 || g > 4) {
      return res.status(400).json({ status: "error", message: "gpa must be between 0 and 4" });
    }
    if (!Number.isFinite(a) || a < 0 || a > 100) {
      return res.status(400).json({ status: "error", message: "attendance must be between 0 and 100" });
    }

    // 1) Try python risk model (authoritative)
    let modelRisk;
    let usedFallback = false;
    let confidence;
    let predictionScore;

    try {
      const modelRes = await callPythonModel(g, a);
      modelRisk = modelRes?.risk;
    } catch (e) {
      usedFallback = true;
      modelRisk = null;
    }

    predictionScore = scoreFromInputs(g, a);
    const derivedRisk = riskFromScore(predictionScore);

    const riskLevel = normalizeRisk(modelRisk || derivedRisk);

    // Confidence + score: provide consistent fields for UI.
    confidence = confidenceHeuristic(g, a, riskLevel);

    const meta = suggestedIntervention(riskLevel);

    const createdAt = new Date().toISOString();

    // Persist into forecasts table
    // Note: schema.sql includes student_id nullable; frontend doesn't send it.
    await db.query(
      `INSERT INTO forecasts (student_id, gpa, attendance_rate, risk_level, prediction_date)
       VALUES (?, ?, ?, ?, ?)` ,
      [student_id || null, g, a, riskLevel, createdAt]
    );

    return res.json({
      status: "success",
      data: {
        risk: riskLevel,
        confidence,
        prediction_score: predictionScore,
        suggested_intervention: meta.intervention,
        created_at: createdAt,
        used_fallback: usedFallback,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("predictRisk error", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function forecastsList(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         student_id,
         gpa,
         attendance_rate,
         risk_level,
         prediction_date AS created_at
       FROM forecasts
       ORDER BY prediction_date DESC
       LIMIT 200`
    );

    const data = (rows || []).map((r) => {
      const score = scoreFromInputs(r.gpa, r.attendance_rate);
      const confidence = confidenceHeuristic(r.gpa, r.attendance_rate, r.risk_level);
      const meta = suggestedIntervention(r.risk_level);
      return {
        id: r.id,
        created_at: r.created_at,
        gpa: Number(r.gpa),
        attendance: Number(r.attendance_rate),
        risk_level: r.risk_level,
        prediction_score: score,
        suggested_intervention: meta.intervention,
        confidence,
      };
    });

    return res.json({ status: "success", data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("forecastsList error", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = { forecastsList, predictRisk };

