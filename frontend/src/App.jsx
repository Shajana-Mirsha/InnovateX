import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Route Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";

// Dashboard Pages
import Dashboard from "./pages/Dashboard/Dashboard";

// Hackathon Pages
import HackathonListPage from "./pages/Hackathons/HackathonListPage";
import HackathonDetailsPage from "./pages/Hackathons/HackathonDetailsPage";
import ManageHackathonsPage from "./pages/Hackathons/ManageHackathonsPage";

// Team Pages
import TeamsPage from "./pages/Teams/TeamsPage";
import TeamDetailsPage from "./pages/Teams/TeamDetailsPage";
import CreateTeamPage from "./pages/Teams/CreateTeamPage";
import MyTeamsPage from "./pages/Teams/MyTeamsPage";

// Registration Pages
import MyRegistrationsPage from "./pages/Registrations/MyRegistrationsPage";
import ManageRegistrationsPage from "./pages/Registrations/ManageRegistrationsPage";

// Submission Pages
import SubmissionsPage from "./pages/Submissions/SubmissionsPage";
import CreateSubmissionPage from "./pages/Submissions/CreateSubmissionPage";
import SubmissionDetailsPage from "./pages/Submissions/SubmissionDetailsPage";

// Judge Pages
import JudgeSubmissionsPage from "./pages/Judge/JudgeSubmissionsPage";
import MyScoresPage from "./pages/Judge/MyScoresPage";

// Leaderboard Pages
import LeaderboardPage from "./pages/Leaderboard/LeaderboardPage";

// Results/Winners Pages
import ResultsPage from "./pages/Results/ResultsPage";
import ManageResultsPage from "./pages/Results/ManageResultsPage";

// Profile & Notifications Pages
import ProfilePage from "./pages/Profile/ProfilePage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";

// Adaptive Layout for Hackathons (shows Sidebar if logged in, public header if not)
const AdaptiveHackathonLayout = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <DashboardLayout />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Public Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-40 border-b border-slate-105 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-655 text-white font-extrabold text-lg">
            IX
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-wide">InnovateX</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-sky-600 transition">Home</Link>
          <Link to="/hackathons" className="hover:text-sky-600 transition">Hackathons</Link>
          <Link to="/login" className="hover:text-sky-600 transition">Login</Link>
        </div>
      </nav>
      
      <main className="flex-grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      
      {/* Public Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center border-t border-slate-800 text-xs">
        <p>&copy; 2026 InnovateX Hackathon Management. All rights reserved.</p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Adaptive Hackathon Routes (Public but styled differently if authenticated) */}
          <Route element={<AdaptiveHackathonLayout />}>
            <Route path="/hackathons" element={<HackathonListPage />} />
            <Route path="/hackathons/:id" element={<HackathonDetailsPage />} />
          </Route>

          {/* Protected Dashboard/App Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/create" element={<CreateTeamPage />} />
            <Route path="/teams/:id" element={<TeamDetailsPage />} />
            <Route path="/my-teams" element={<MyTeamsPage />} />
            <Route path="/registrations" element={<MyRegistrationsPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/submissions/create" element={<CreateSubmissionPage />} />
            <Route path="/submissions/:id" element={<SubmissionDetailsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Organizer & Admin Role-Protected Routes */}
            <Route
              element={
                <RoleProtectedRoute
                  allowedRoles={["organizer", "admin"]}
                />
              }
            >
              <Route path="/manage/hackathons" element={<ManageHackathonsPage />} />
              <Route path="/manage/registrations" element={<ManageRegistrationsPage />} />
              <Route path="/manage/results" element={<ManageResultsPage />} />
            </Route>

            {/* Judge Role-Protected Routes */}
            <Route
              element={
                <RoleProtectedRoute allowedRoles={["judge", "organizer", "admin"]} />
              }
            >
              <Route path="/leaderboard" element={<LeaderboardPage />} />
            </Route>
            <Route
              element={
                <RoleProtectedRoute allowedRoles={["judge"]} />
              }
            >
              <Route path="/judge/submissions" element={<JudgeSubmissionsPage />} />
              <Route path="/judge/scores" element={<MyScoresPage />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
