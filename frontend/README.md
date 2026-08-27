# InnovateX Frontend

InnovateX is a complete, modern, professional Hackathon Management System. It serves as a unified workspace for participants to form teams and submit project entries, organizers to approve registrations and announce winners, and judges to evaluate solutions.

This React application acts as the client-side frontend, designed to integrate with the Node.js / Express.js / MongoDB backend.

---

## 🚀 Key Features

*   **Public Landing Page:** SaaS-style startup page illustrating features, step-by-step onboarding, and call-to-actions.
*   **Role-Based Security:** Custom layout menus, navigation items, and protected routes based on user role (`participant`, `organizer`, `judge`, `admin`).
*   **Hackathon Workspace:** Discover events, inspect descriptions, domains, deadlines, and registration criteria.
*   **Collaborative Teams:** Form teams as a leader, join open channels, or leave teams with safety modal checkpoints.
*   **Submission & Grading Console:**
    *   Team leaders publish Github repositories and demo links for approved registrations.
    *   Judges grade projects across 4 metrics (Innovation, Tech, Impact, Presentation) using interactive sliders and provide review comments.
*   **Podium Standings:** Public Winners Podium showing declared results, and private Leaderboard for judges/organizers showing dynamic ranks sorted by score statistics.
*   **Notification Engine:** Live alerts console with type-based icons tracking registration status, results, and team actions.

---

## 🛠️ Tech Stack

*   **Framework:** React (Vite-scaffolded)
*   **Styling:** Tailwind CSS (utility-first, responsive grids)
*   **Navigation:** React Router DOM (v6, protected route guards)
*   **API Client:** Centralized Axios instance with JWT Authorization Bearer interceptors
*   **Icons:** Lucide React

---

## ⚙️ Project Setup

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 1. Configure Environments

Create a `.env` file in the root of the `frontend/` directory (matching the `.env.example` file):

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Install Packages

Run the following command inside the `frontend/` directory:

```bash
npm install
```

### 3. Run Development Server

Launch the local development workspace:

```bash
npm run dev
```

*   The client application typically runs at `http://localhost:5173`.
*   Ensure the InnovateX backend is running separately on port `5000`.

### 4. Build for Production

Compile static assets optimized for hosting:

```bash
npm run build
```

---

## 📂 Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/             # Central Axios client and API resource endpoints
│   ├── components/      # Common components (spinners, buttons, badges, modals)
│   │   ├── common/
│   │   ├── navigation/  # Sidebars, topbars, notification drop-downs
│   │   └── dashboard/
│   ├── context/         # AuthContext state and sessions persistence
│   ├── layouts/         # Shared dashboard wrappers
│   ├── pages/           # Pages (Dashboard, Teams, Hackathons, Submissions, Scoring)
│   ├── routes/          # Protected and RoleProtectedRoute route guards
│   ├── utils/           # Time and capitalize helpers
│   ├── App.css
│   ├── App.jsx          # Route mappings and adaptive panels
│   ├── index.css        # Tailwind directives and custom scrollbars
│   └── main.jsx
├── .env.example
├── tailwind.config.js   # Tailwind custom theme variables
├── postcss.config.js
└── vite.config.js
```
