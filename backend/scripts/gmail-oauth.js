/**
 * One-time helper: prints a Gmail refresh token for backend/.env
 *
 * Prereqs in Google Cloud Console:
 * - Enable Gmail API
 * - OAuth client (Web app): add Authorized redirect URI matching GOOGLE_OAUTH_REDIRECT_URI below
 *
 * Run from backend folder:
 *   node scripts/gmail-oauth.js
 */
require("dotenv").config();
const http = require("http");
const { google } = require("googleapis");

const PORT = Number(process.env.GMAIL_OAUTH_PORT || 49153);
const REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  `http://127.0.0.1:${PORT}/oauth2callback`;

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend/.env"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.readonly"],
});

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const host = `http://127.0.0.1:${PORT}`;
  const url = new URL(req.url, host);
  const code = url.searchParams.get("code");

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!code) {
    res.writeHead(400);
    res.end("<p>Missing <code>code</code> query parameter.</p>");
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200);
    res.end(
      "<p>Success. Check the terminal for <strong>GMAIL_REFRESH_TOKEN</strong> to copy into <code>backend/.env</code>, then restart the server.</p>"
    );

    console.log("\n--- Add to backend/.env ---\n");
    console.log(`GOOGLE_OAUTH_REDIRECT_URI=${REDIRECT_URI}`);
    if (tokens.refresh_token) {
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log(
        "(No refresh_token returned — revoke app access in Google account and run again with prompt=consent.)"
      );
    }
    console.log("\n---------------------------\n");
  } catch (e) {
    res.writeHead(500);
    res.end(`<pre>${String(e.message || e)}</pre>`);
  }

  server.close();
});

server.listen(PORT, () => {
  console.log(`\nListening on ${REDIRECT_URI}`);
  console.log("\nOpen this URL in your browser and sign in:\n");
  console.log(authUrl);
  console.log(
    "\nEnsure this redirect URI is added in Google Cloud -> Credentials -> OAuth client.\n"
  );
});
