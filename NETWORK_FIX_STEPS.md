# Network issue: frontend cannot reach backend via 192.168.43.160

## What we verified
- Backend is running and listening: `0.0.0.0:5000`
- From this machine:
  - `http://127.0.0.1:5000/health` returns `{"ok":true}`
  - `http://192.168.43.160:5000/health` times out
  - ICMP ping to `192.168.43.160` times out

This means `192.168.43.160` is not reachable from the machine that is running the frontend.

## Fix option A (recommended for same-machine testing)
Force the frontend API base URL to localhost.

1) Create/update environment variable for the frontend:
- `REACT_APP_API_URL=http://127.0.0.1:5000`

2) Rebuild/restart the frontend.

## Fix option B (if frontend and backend are on different machines)
Make sure the frontend uses the backend machine’s reachable IP/hostname.

1) Confirm that `192.168.43.160` is the backend host’s correct LAN IP.
2) On the backend host:
- Allow inbound TCP 5000 in Windows Defender Firewall.
3) Ensure both machines are on the same routable network and not separated by AP/client isolation/VLAN.

## One-file workaround
Edit `frontend/src/services/apiBaseUrl.js` temporarily to hardcode:
- `return 'http://127.0.0.1:5000'`

## Note about the other console error
`A listener indicated an asynchronous response ... message channel closed` is typically an extension messaging issue (Chrome `chrome.runtime` messaging) and is not related to the login timeout.

