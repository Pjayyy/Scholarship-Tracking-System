/**
 * Student sign-in: site root (e.g. http://localhost:3000/).
 * Staff sign-in: add /1 (e.g. http://localhost:3000/1) — no link on the student page.
 */
export const STAFF_LOGIN_PATH = "/1";

export function getLoginVariant() {
  const raw = window.location.pathname || "/";
  const trimmed = raw.replace(/\/+$/, "") || "/";
  const segments = trimmed.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last === "1" ? "admin" : "student";
}
