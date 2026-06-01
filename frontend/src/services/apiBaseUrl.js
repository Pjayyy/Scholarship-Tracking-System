function normalizeUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  // Remove trailing slash for consistent concatenation with axios.
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function getCandidateUrls() {
  // Preferred: allow multiple backend candidates (useful when WiFi/LAN IP changes)
  const envUrlsRaw = process.env.REACT_APP_API_URLS;
  // CRA injects env vars at build-time. Normalize to string.
  const envUrls = typeof envUrlsRaw === "string" ? envUrlsRaw : "";
  if (envUrls.trim()) {
    // Expect comma-separated list.
    const urls = envUrls
      .split(",")
      .map(normalizeUrl)
      .filter(Boolean);

    // Only return valid base URLs.
    // IMPORTANT: Never return a comma-separated string as a single baseURL.
    return urls;
  }

  // Backward compatible: single URL
  const envUrl = process.env.REACT_APP_API_URL;
  const single = normalizeUrl(envUrl);
  if (single) return [single];

  // Local/dev fallback
  return ["http://localhost:5000"];
}

export function getApiBaseUrl() {
  // IMPORTANT: axios.create({ baseURL }) must receive a SINGLE URL string.
  // Never pass a comma-separated string as baseURL.

  let candidates = getCandidateUrls();

  // Defensive guard: if something upstream accidentally returns a comma-separated string,
  // split it here.
  if (typeof candidates === "string") {
    candidates = candidates
      .split(",")
      .map(normalizeUrl)
      .filter(Boolean);
  }

  // If we've previously succeeded, prefer that.
  const lastOk = localStorage.getItem("apiBaseUrl:lastOk");
  const normalizedLastOk = normalizeUrl(lastOk);
  if (normalizedLastOk && Array.isArray(candidates) && candidates.includes(normalizedLastOk)) {
    return normalizedLastOk;
  }

  return Array.isArray(candidates) ? candidates[0] : "http://127.0.0.1:5000";
}


export function getApiBaseUrlCandidates() {
  const candidates = getCandidateUrls();
  const normalizedCandidates = [...new Set(candidates)];

  // If we have last known good, move it to the front.
  const lastOk = normalizeUrl(localStorage.getItem("apiBaseUrl:lastOk"));
  if (lastOk && normalizedCandidates.includes(lastOk)) {
    return [lastOk, ...normalizedCandidates.filter((u) => u !== lastOk)];
  }

  return normalizedCandidates;
}






