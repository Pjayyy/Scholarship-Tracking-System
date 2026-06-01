# TODO: Auto-recover frontend when WiFi/LAN IP changes

- [x] Update `frontend/src/services/apiBaseUrl.js` to support multiple backend candidates via `REACT_APP_API_URLS`.
- [x] Update `frontend/src/services/api.js` to retry failed requests across candidate backend URLs (network/timeout errors only) and remember the last working URL in `localStorage`.
- [ ] Update `NETWORK_SETUP.md` / `NETWORK_FIX_STEPS.md` to document `REACT_APP_API_URLS` usage for multiple networks.
- [ ] Manual test: login from another device after switching WiFi.
- [ ] Manual test: verify fallback works when the first candidate URL is unreachable.

