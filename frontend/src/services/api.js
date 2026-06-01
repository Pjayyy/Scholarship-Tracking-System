import axios from "axios";
import { getApiBaseUrl, getApiBaseUrlCandidates } from "./apiBaseUrl";

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function getCandidatesRotating() {
  const candidates = getApiBaseUrlCandidates();
  // Ensure at least 1 candidate.
  return candidates.length ? candidates : [getApiBaseUrl()];
}

async function withApiBaseUrlFallback(config) {
  // Retry only for network-type failures/timeouts.
  // When WiFi changes, the backend IP may change, so trying multiple URLs helps.
  const candidates = getCandidatesRotating();
  const maxAttempts = Math.min(4, candidates.length);

  // Start from current baseURL if it's in the candidate list.

  const currentBase = normalizeBaseUrl(API.defaults.baseURL);
  let startIndex = 0;
  const idx = candidates.findIndex((u) => u === currentBase);
  if (idx >= 0) startIndex = idx;

  let lastErr = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const url = candidates[(startIndex + attempt) % candidates.length];
    if (!url) continue;

    try {
      // Clone config to avoid axios reusing internal resolution artifacts.
      const requestConfig = {
        ...config,
        baseURL: url,
      };
      // If config.url was already combined/cached by axios, clear it so baseURL takes effect.
      if (requestConfig.url) {
        // Keep relative paths only (axios will concatenate baseURL + url).
        // If url is absolute (already full), we want to override it.
        if (String(requestConfig.url).startsWith("http")) {
          requestConfig.url = config.url.replace(/^https?:\/\//i, "");
        }
      }

      API.defaults.baseURL = url;

      const resp = await API.request(requestConfig);
      localStorage.setItem("apiBaseUrl:lastOk", url);
      return resp;
    } catch (e) {
      lastErr = e;
      // continue
    }
  }

  throw lastErr;
}

function normalizeBaseUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    // If we don't have request config, can't retry.
    if (!config) return Promise.reject(error);

    const isNetworkError =
      error?.code === "ECONNABORTED" ||
      error?.code === "ERR_NETWORK" ||
      error?.message?.toLowerCase().includes("network error") ||
      error?.message?.toLowerCase().includes("timeout") ||
      // Axios can throw without a response when CORS/connection fails.
      !error?.response;

    // Avoid infinite loops.
    if (!isNetworkError || config.__didFallback) {
      return Promise.reject(error);
    }

    config.__didFallback = true;
    return withApiBaseUrlFallback(config);
  }
);

export default API;

