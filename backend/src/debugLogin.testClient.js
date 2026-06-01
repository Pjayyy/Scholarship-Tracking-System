/*
  Simple Node client to call backend /login and print response.
  Usage:
    node backend/src/debugLogin.testClient.js
  Make sure backend is running and .env (DB_* and JWT_SECRET) are set.
*/

const axios = require("axios");

async function main() {
  const baseURL = process.env.API_URL || "http://127.0.0.1:5000";

  const username = process.env.LOGIN_USER || "admin@admin.com";
  const password = process.env.LOGIN_PASS || "password123";

  try {
    const resp = await axios.post(`${baseURL}/login`, {
      email: username,
      password,
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
      validateStatus: () => true,
    });

    console.log("REQUEST:", { baseURL, username });
    console.log("STATUS:", resp.status);
    console.log("DATA:", resp.data);
  } catch (e) {
    console.error("ERROR:", e?.message || e);
    console.error(e?.response?.data);
  }
}

main();

