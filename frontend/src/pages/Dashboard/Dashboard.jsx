import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/common/PageHeader";
import DashboardStatCard from "../../components/dashboard/DashboardStatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import { CardSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Calendar,
  Users,
  ClipboardCheck,
  FileCode,
  Trophy,
  Award,
  PlusCircle,
  Clock,
  ArrowRight,
  Gavel,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Scale,
  GitCommit,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from "lucide-react";

// API calls
import { getAllHackathons } from "../../api/hackathonApi";
import { getAllTeams } from "../../api/teamApi";
import { getAllRegistrations, getMyRegistrations } from "../../api/registrationApi";
import { getAllSubmissions } from "../../api/submissionApi";
import { getAllScores } from "../../api/scoreApi";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dashboard stats state
  const [hackathons, setHackathons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        if (user.role === "participant") {
          const [hackData, teamData, regData, subData] = await Promise.all([
            getAllHackathons(),
            getAllTeams(),
            getMyRegistrations(),
            getAllSubmissions(),
          ]);

          setHackathons(hackData.hackathons || []);

          const userTeams = (teamData.teams || []).filter(
            (t) =>
              t.leader?._id === user.id ||
              t.members?.some((m) => m._id === user.id)
          );
          setTeams(userTeams);
          setRegistrations(regData.registrations || []);

          const teamIds = userTeams.map((ut) => ut._id);
          const userSubs = (subData.submissions || []).filter(
            (s) => s.submittedBy?._id === user.id || teamIds.includes(s.team?._id)
          );
          setSubmissions(userSubs);
        } else if (user.role === "organizer" || user.role === "admin") {
          const [hackData, teamData, regData, subData] = await Promise.all([
            getAllHackathons(),
            getAllTeams(),
            getAllRegistrations(),
            getAllSubmissions(),
          ]);

          setHackathons(hackData.hackathons || []);
          setTeams(teamData.teams || []);
          setRegistrations(regData.registrations || []);
          setSubmissions(subData.submissions || []);
        } else if (user.role === "judge") {
          const [hackData, subData, scoreData] = await Promise.all([
            getAllHackathons(),
            getAllSubmissions(),
            getAllScores(),
          ]);

          setHackathons(hackData.hackathons || []);
          setSubmissions(subData.submissions || []);

          const judgeScores = (scoreData.scores || []).filter(
            (s) => (s.judge?._id || s.judge) === user.id
          );
          setScores(judgeScores);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError("Could not load dashboard statistics. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6">
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const openHackathons = hackathons.filter(
    (h) => h.status === "registration_open"
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adaptive Human-in-the-Loop Evaluation Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1 capitalize">
            Signed in as <strong>{user.role}</strong> • Explore challenges, manage teams, track AI evaluations, and view results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === "participant" && (
            <Link to="/submissions/create">
              <Button variant="primary" size="md" icon={PlusCircle}>
                Submit Project
              </Button>
            </Link>
          )}

          {user.role === "organizer" && (
            <Link to="/manage/hackathons?create=true">
              <Button variant="primary" size="md" icon={PlusCircle}>
                Host Hackathon
              </Button>
            </Link>
          )}

          {user.role === "admin" && (
            <Link to="/admin/dashboard">
              <Button variant="primary" size="md" icon={ShieldCheck}>
                Admin Center
              </Button>
            </Link>
          )}

          {user.role === "judge" && (
            <Link to="/judge/submissions">
              <Button variant="primary" size="md" icon={Gavel}>
                Judge Workspace
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* STATS TILES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user.role === "participant" && (
          <>
            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Available Hackathons</p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{hackathons.length}</p>
                <p className="text-4xs text-brand-400 mt-0.5">{openHackathons.length} open for signups</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">My Teams</p>
                <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{teams.length}</p>
                <p className="text-4xs text-slate-400 mt-0.5">Joined or created</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">My Registrations</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{registrations.length}</p>
                <p className="text-4xs text-emerald-400 mt-0.5">
                  {registrations.filter((r) => r.status === "approved").length} approved
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">My Submissions</p>
                <p className="text-2xl font-bold text-sky-300 mt-1 font-mono">{submissions.length}</p>
                <p className="text-4xs text-sky-400 mt-0.5">Evaluated in competition</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <FileCode className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {(user.role === "organizer" || user.role === "admin") && (
          <>
            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Hosted Hackathons</p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{hackathons.length}</p>
                <p className="text-4xs text-brand-400 mt-0.5">{openHackathons.length} registration open</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Teams Formed</p>
                <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{teams.length}</p>
                <p className="text-4xs text-slate-400 mt-0.5">Registered teams</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Pending Registrations</p>
                <p className="text-2xl font-bold text-rose-300 mt-1 font-mono">
                  {registrations.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-4xs text-slate-400 mt-0.5">Awaiting review</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Project Submissions</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{submissions.length}</p>
                <p className="text-4xs text-emerald-400 mt-0.5">Ready for AI evaluation</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileCode className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {user.role === "judge" && (
          <>
            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Competitions</p>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{hackathons.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Submissions to Grade</p>
                <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{submissions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Gavel className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Scores Validated</p>
                <p className="text-2xl font-bold text-emerald-300 font-mono">{scores.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Validation Rate</p>
                <p className="text-2xl font-bold text-indigo-300 font-mono">
                  {submissions.length > 0
                    ? `${Math.round((scores.length / submissions.length) * 100)}%`
                    : "0%"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* PARTICIPANT FOCUSED WORKSPACE SECTION */}
      {user.role === "participant" ? (
        <div className="space-y-8">
          {/* Row 1: Active Challenges with Real Calculated Deadlines */}
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                Active Innovation Challenges
              </h2>
              <Link
                to="/hackathons"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
              >
                Browse All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {hackathons.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No active challenges"
                message="Explore new competitions to register your team and submit projects."
                actionButton={
                  <Link to="/hackathons">
                    <Button variant="primary" size="sm">Explore Challenges</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hackathons.slice(0, 4).map((hack) => {
                  const deadline = hack.endDate ? new Date(hack.endDate) : null;
                  const isClosed = deadline ? new Date() > deadline : false;
                  const daysLeft = deadline
                    ? Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)))
                    : null;

                  return (
                    <div
                      key={hack._id}
                      className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-mono font-bold text-brand-400 uppercase">
                            {hack.domain || "Technology"}
                          </span>
                          {isClosed ? (
                            <span className="text-4xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Submission Closed
                            </span>
                          ) : daysLeft !== null ? (
                            <span className="text-4xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {daysLeft} Day{daysLeft !== 1 ? "s" : ""} Remaining
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-sm font-bold text-white line-clamp-1">{hack.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {hack.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-3xs text-slate-400 font-mono">
                        <span>Deadline: <strong className="text-slate-300">{formatDate(hack.endDate)}</strong></span>
                        <Link to={`/hackathons/${hack._id}`}>
                          <Button variant="outline" size="sm">
                            View Challenge
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 2: My Teams & My Submissions Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Teams */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    My Teams
                  </h2>
                  <Link
                    to="/my-teams"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {teams.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No teams joined"
                    message="Form a team or join an open roster to participate in challenges."
                    actionButton={
                      <Link to="/teams/create">
                        <Button variant="primary" size="sm">Create Team</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {teams.slice(0, 3).map((tm) => (
                      <div
                        key={tm._id}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">{tm.name}</h4>
                          <p className="text-3xs text-slate-400 font-mono mt-0.5">
                            {tm.hackathon?.title || "Challenge Team"} • {tm.members?.length || 1} Members
                          </p>
                        </div>
                        <Link to={`/teams/${tm._id}`}>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {teams.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80">
                  <Link to="/teams/create">
                    <Button variant="outline" size="sm" className="w-full" icon={PlusCircle}>
                      Create Another Team
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* My Submissions */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    My Submissions & Evaluations
                  </h2>
                  <Link
                    to="/submissions"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {submissions.length === 0 ? (
                  <EmptyState
                    icon={FileCode}
                    title="No projects submitted yet"
                    message="Submit your codebase and presentation before the challenge closes."
                    actionButton={
                      <Link to="/submissions/create">
                        <Button variant="primary" size="sm">Create Submission</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {submissions.slice(0, 3).map((sub) => (
                      <div
                        key={sub._id}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white line-clamp-1">{sub.title}</h4>
                          <p className="text-3xs text-slate-400 font-mono">
                            Event: {sub.hackathon?.title || "Hackathon"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link to={`/submissions/${sub._id}`}>
                            <Button variant="outline" size="sm">
                              Dossier
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submissions.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80">
                  <Link to="/submissions/create">
                    <Button variant="primary" size="sm" className="w-full" icon={PlusCircle}>
                      Submit New Project
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Organizer / Judge / Admin View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-400" />
                  Featured Challenge Events
                </h2>
                <Link
                  to="/hackathons"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  Browse All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {hackathons.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No competitions listed yet"
                  message="Upcoming national challenges will appear here."
                />
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {hackathons.slice(0, 4).map((item) => (
                    <div
                      key={item._id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-3 text-3xs text-slate-400 font-mono pt-1">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.mode}
                          </span>
                          <span>Starts: {formatDate(item.startDate)}</span>
                          <span>•</span>
                          <span>{item.criteria?.length || 4} Rubric Dimensions</span>
                        </div>
                      </div>

                      <Link to={`/hackathons/${item._id}`}>
                        <Button variant="outline" size="sm">
                          View Event
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Platform Navigation</h3>
              <div className="space-y-2">
                <Link
                  to="/leaderboard"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-brand-500 transition text-xs font-semibold text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Live Leaderboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  to="/manage/evaluation-intelligence"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-brand-500 transition text-xs font-semibold text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span>Evaluation Intelligence</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  to="/manage/similarity"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-brand-500 transition text-xs font-semibold text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Similarity Review</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
