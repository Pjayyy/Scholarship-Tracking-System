# Scholarship System Step-by-Step Testing Guide

Follow these steps exactly to test the Scholarship System in an easy, reliable way.

---

## Step 1: Confirm prerequisites

1. Verify Node.js is installed.
2. Verify MySQL server is installed and running.
3. Open the project folder in your code editor:
   `c:\Users\PJ\OneDrive\Desktop\scholarship system`

---

## Step 2: Prepare the backend

1. Open a terminal.
2. Change to the backend folder:
   ```powershell
   cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\backend"
   ```
3. Install backend dependencies:
   ```powershell
   npm install
   ```
4. Create or update the `.env` file in the backend folder with these values:
   ```text
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=scholarship_system
   JWT_SECRET=SECRET123
   PORT=5000
   ```
5. Ensure the database exists by running `scheme.sql` in your MySQL client, or manually create the `scholarship_system` database.

---

## Step 3: Start the backend server

1. In the backend terminal, run:
   ```powershell
   npm start
   ```
2. Confirm the backend starts successfully and prints:
   `Server running on port 5000`
3. If the backend fails with `ECONNREFUSED`:
   - Confirm MySQL is running.
   - Confirm `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` are correct.
   - Restart the backend.

---

## Step 4: Prepare the frontend

1. Open a second terminal.
2. Change to the frontend folder:
   ```powershell
   cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\frontend"
   ```
3. Install frontend dependencies:
   ```powershell
   npm install
   ```
4. Start the frontend app:
   ```powershell
   npm start
   ```
5. The browser should open at:
   `http://localhost:3000`

---

## Step 5: Login with test accounts

1. On the login page, enter:
   - Email: `admin@admin.com`
   - Password: `password123`
2. Click the login button.
3. Confirm a success toast appears.
4. If login fails, check the backend terminal for errors.

---

## Step 6: Verify app behavior

### 6.1 Confirm successful login

1. After login, confirm the dashboard or main page appears.
2. Confirm the app does not redirect back to login.

### 6.2 Confirm role-specific access

- For admin users, verify pages like:
  - Dashboard
  - Students
  - QR attendance scanner
  - Forecast
  - Notifications
  - Analytics
- For student users, verify student portal pages open correctly.

### 6.3 Confirm session persistence

1. Refresh the browser after login.
2. Confirm you remain logged in.
3. Confirm `token` and `user` appear in browser `localStorage`.

### 6.4 Test validation and errors

Try these scenarios:

- Enter wrong email or password.
- Leave email or password blank.
- Stop the backend and then try login.

Confirm the app shows a clear error message each time.

---

## Step 7: Common commands for testing

### Start backend
```powershell
cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\backend"
npm start
```

### Start frontend
```powershell
cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\frontend"
npm start
```

### Check MySQL connection

1. Open your MySQL client.
2. Run:
   ```sql
   SHOW DATABASES;
   USE scholarship_system;
   SHOW TABLES;
   ```
3. Confirm the database and tables exist.

---

## Step 8: Troubleshooting guide

### Problem: backend will not connect to MySQL

1. Confirm MySQL is running.
2. Confirm `.env` values match your MySQL settings.
3. If MySQL uses a password, set `DB_PASSWORD` accordingly.
4. Restart the backend.

### Problem: frontend fails to start

1. Run `npm install` in the frontend folder.
2. Confirm there are no compile or syntax errors in the terminal.
3. Restart the frontend.

### Problem: login does not work

1. Confirm the backend is running.
2. Confirm the frontend is pointing to the correct backend API.
3. Check backend logs for error details.

---

## Step 9: Quick test checklist

1. Backend server starts successfully.
2. Frontend loads in browser.
3. Admin login succeeds.
4. Student login succeeds (if testing student role).
5. Invalid login shows error.
6. Pages load after login.
7. `token` is saved in `localStorage`.
8. Refresh stays logged in.
9. Database read/write actions succeed.

---

## Step 10: Important notes

- Both frontend and backend must be running at the same time.
- The backend uses JWT authentication and stores the token in `localStorage`.
- Use sample accounts in the database for immediate testing.
