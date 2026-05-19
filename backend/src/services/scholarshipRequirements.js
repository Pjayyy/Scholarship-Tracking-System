function getRequirementsForScholarshipType(type) {
  const t = String(type || "").trim().toUpperCase();

  const base = [
    "Valid school ID",
    "Certificate of Registration / Enrollment",
    "Latest grades (copy of grades / report of grades)",
    "Good moral certificate",
  ];

  const map = {
    TES: [
      ...base,
      "TES application / renewal form (if applicable)",
      "Proof of income / indigency (if required by your school)",
    ],
    TDP: [
      ...base,
      "TDP application / renewal form (if applicable)",
      "Proof of residency / barangay certificate (if required)",
    ],
  };

  return map[t] || base;
}

module.exports = { getRequirementsForScholarshipType };

