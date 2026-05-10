# Scholarship Tracking System

This repository contains a scholarship management system with separate backend and frontend applications.

## Accessing and using the system

### 1. Prerequisites
- Install Node.js.
- Install MySQL and make sure the service is running.
- Use a terminal or PowerShell.
- Open the repository folder in your code editor:
  `c:\Users\PJ\OneDrive\Desktop\scholarship system`

### 2. Start the backend
1. Open a terminal.
2. Go to the backend folder:
   ```powershell
   cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\backend"
   ```
3. Install backend packages:
   ```powershell
   npm install
   ```
4. Create or update `.env` in the backend folder with these values:
   ```text
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=scholarship_system
   JWT_SECRET=SECRET123
   PORT=5000
   ```
5. Create the database in MySQL. Run `scheme.sql` or use a MySQL client to create `scholarship_system`.
6. Start the backend:
   ```powershell
   npm start
   ```
7. Confirm the backend runs successfully and listens on port `5000`.

### 3. Start the frontend
1. Open another terminal.
2. Go to the frontend folder:
   ```powershell
   cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\frontend"
   ```
3. Install frontend packages:
   ```powershell
   npm install
   ```
4. Start the frontend:
   ```powershell
   npm start
   ```
5. Open your browser at:
   `http://localhost:3000`

### 4. Log in to the system
- Use a test account if available.
- A recommended admin login is:
  - Email: `admin@admin.com`
  - Password: `password123`

### 5. Expected behavior
- After login, the dashboard or main page should appear.
- The frontend should communicate with the backend at `http://localhost:5000`.
- User sessions should persist after refreshing the page.

### 6. Troubleshooting
- If the backend does not start:
  - Confirm MySQL is running.
  - Confirm `.env` values are correct.
  - Confirm the database `scholarship_system` exists.
- If the frontend does not start:
  - Run `npm install` again in the frontend folder.
  - Check the browser terminal and app console for errors.
- If login fails:
  - Confirm the backend is running.
  - Confirm the frontend is using the correct API URL.

### 7. Useful commands
- Backend:
  ```powershell
  cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\backend"
  npm start
  ```
- Frontend:
  ```powershell
  cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\frontend"
  npm start
  ```

## Notes
- Both frontend and backend must run together.
- Use `TESTING_GUIDE.md` for more detailed testing steps.
