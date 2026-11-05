# Quiz Arena - Full-stack Multiplayer Quiz

React (Vite) + Express + Socket.IO + **MongoDB**.

- **Two logins:** Candidate login and Admin login (JWT + bcrypt, role-protected routes and APIs)
- **Admin panel:** add, edit and delete questions (stored in MongoDB), search and filter them, view stats and all candidate results
- **Candidate area:** solo quiz graded on the server, real-time multiplayer rooms (Socket.IO), leaderboard, game history
- **Multiplayer:** host a room, share a 5-letter code, 15 seconds per question, speed bonus scoring. Correct answers never reach the browser until the reveal.

## 1. Requirements

- Node.js 18+
- A MongoDB database: local MongoDB (`mongodb://127.0.0.1:27017`) **or** a free MongoDB Atlas cluster

## 2. Run locally

```bash
npm install
cp .env.example .env      # then edit MONGODB_URI / JWT_SECRET / ADMIN_PASSWORD
npm run dev
```

Open the Vite URL (usually http://localhost:5173).

On first start the server automatically:
- creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (default `admin@quiz.com` / `admin123`)
- adds 10 sample questions if the question bank is empty

Candidates create their own accounts with **Create a candidate account** on the login screen.
Run `npm run seed` any time to reset the questions to the sample set.

## 3. Production (single server)

```bash
npm run build
npm run start     # serves the API, sockets and the built React app together
```

## 4. Deploy to Render

`render.yaml` is included. Set these environment variables in Render:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | generated automatically by the blueprint |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the admin login you want |

## Project structure

```
server/
  index.js            Express + Socket.IO + Mongo connection, serves dist/
  rooms.js            Multiplayer game engine (rooms, timers, scoring)
  bootstrap.js        Creates admin + sample questions on first run
  models/             User, Question, Result (Mongoose)
  routes/             auth.js, questions.js (admin CRUD), quiz.js
  middleware/auth.js  JWT + role guards
src/
  pages/              Login, CandidateHome, Quiz, Multiplayer, Room, Leaderboard,
                      AdminDashboard, AdminQuestions, AdminResults
  components/         Layout, Toast
  styles.css          Full design system
```

## API summary

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | public (candidate) |
| POST | `/api/auth/login` | public (`role`: candidate or admin) |
| GET | `/api/questions` | admin |
| POST / PUT / DELETE | `/api/questions[/:id]` | admin |
| GET | `/api/quiz/start` | candidate |
| POST | `/api/quiz/submit` | candidate |
| GET | `/api/quiz/leaderboard`, `/api/quiz/results/me` | logged in |
| GET | `/api/quiz/admin/stats`, `/api/quiz/admin/results` | admin |
