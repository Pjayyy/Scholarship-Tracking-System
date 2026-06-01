# Network Configuration Guide

## Problem: Application doesn't work on different WiFi networks

When you connected to different WiFi at your defense, the system couldn't login because:
- **Frontend was hardcoded to `127.0.0.1:5000`** (loopback - only works on that machine)
- **Backend only listened on localhost** (not accessible from other devices)

When you connected to your personal WiFi, it worked because both frontend and backend ran on the same machine.

---

## Solution: Proper Network Configuration

### Backend Changes ✅
- Backend now listens on `0.0.0.0` (all network interfaces)
- This makes it accessible from any device on the network

### Frontend Changes ✅
- Frontend API base URL is configured via environment variables:
  - `REACT_APP_API_URL` (single backend URL)
  - `REACT_APP_API_URLS` (comma-separated list of backend URLs)
- Defaults to `http://127.0.0.1:5000` if none are set

When the network/IP changes, the frontend will try multiple backend URLs (network/timeout errors only) and remember the last working one in `localStorage`.

---

## How to Use Different Networks

### 1. LOCAL DEVELOPMENT (same machine)
No changes needed - works automatically with default `localhost:5000`

### 2. NETWORK/DEFENSE (multiple devices)

**Step 1: Find your laptop's IP address**

Windows (PowerShell):
```powershell
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.50`)

Mac/Linux (Terminal):
```bash
ifconfig
```

**Step 2: Set environment variable in frontend**

Create `.env` file in the `frontend/` folder:

**Option A (single network):**
```
REACT_APP_API_URL=http://192.168.1.50:5000
```

**Option B (multiple WiFi networks / multiple possible IPs):**
```
REACT_APP_API_URLS=http://192.168.1.50:5000,http://10.0.0.25:5000
```

Replace both example IPs with the backend host's reachable IPs on each WiFi network.

**Step 3: Restart the frontend**
```bash
npm start
```

**Step 4: Other devices connect to your laptop**
- Backend is accessible at `http://<your-laptop-ip>:5000`
- Any browser can access `http://<your-laptop-ip>:3000` (or whatever port frontend runs on)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Other devices still can't connect | Check firewall - allow port 5000 and 3000 |
| Login fails after switching WiFi | Ensure `REACT_APP_API_URLS` includes all backend IPs you might get |
| "Connection refused" error | Make sure backend is running: `npm start` in backend folder |
| Frontend shows error but no login page | Check browser console - verify configured API URL(s) |

---

## For Permanent/Production Setup

Consider using:
- **DNS name** instead of IP address (e.g., `scholarship-system.local`) so IP changes never matter
- **Environment-based configuration** (.env.local, .env.development, .env.production)
- **Docker + Docker Compose** for consistent deployment
- **Reverse proxy** (nginx) for cleaner routing

