function normalizeUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  // Remove trailing slash for consistent concatenation with axios.
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function getCandidateUrls() {
  // Preferred: allow multiple backend candidates (useful when WiFi/LAN IP changes)
  const envUrls = process.env.REACT_APP_API_URLS;
  if (envUrls && envUrls.trim()) {
    return envUrls
      .split(",")
      .map(normalizeUrl)
      .filter(Boolean);
  }

  // Backward compatible: single URL
  const envUrl = process.env.REACT_APP_API_URL;
  const single = normalizeUrl(envUrl);
  if (single) return [single];

  // Local/dev fallback
  return ["http://127.0.0.1:5000"];
}

export function getApiBaseUrl() {
  // Keep existing behavior: return a base URL synchronously.
  // Retry/fallback between candidates is implemented in api.js.
  const candidates = getCandidateUrls();

  // If we've previously succeeded, prefer that.
  const lastOk = localStorage.getItem("apiBaseUrl:lastOk");
  const normalizedLastOk = normalizeUrl(lastOk);
  if (normalizedLastOk && candidates.includes(normalizedLastOk)) {
    return normalizedLastOk;
  }

  return candidates[0];
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






