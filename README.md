# Scholarship Tracking System

This repository contains a scholarship management system with separate backend and frontend applications.

## Quick access and use

### Prerequisites
- Node.js installed
- MySQL server installed and running
- A code editor or terminal available

### Start the backend
1. Open a terminal.
2. Change directory to the backend folder:
   ```powershell
   cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\backend"
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Create or update the `.env` file in the backend folder with at least:
   ```text
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=scholarship_system
   JWT_SECRET=SECRET123
   PORT=5000
   ```
5. Ensure the `scholarship_system` database exists in MySQL.
6. Start the backend server:
   ```powershell
   npm start
   ```
7. Verify the backend is running and listening on port `5000`.

### Start the frontend
1. Open another terminal.
2. Change to the frontend folder:
   ```powershell
   cd "c:\Users\PJ\OneDrive\Desktop\scholarship system\frontend"
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Start the frontend app:
   ```powershell
   npm start
   ```
5. Open the browser at:
   ```text
   http://localhost:3000
   ```

### How to use the system
- Open `http://localhost:3000` in your browser.
- Use test credentials to log in.
- The app should connect to the backend API automatically if the backend is running on `http://localhost:5000`.

### Recommended login
- Email: `admin@admin.com`
- Password: `password123`

### Notes
- Both frontend and backend must be running at the same time.
- If the frontend or backend fails, check the terminal output for errors.
- For a full testing and access checklist, see `TESTING_GUIDE.md`.
