import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
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

import { getAllHackathons } from "../../api/hackathonApi";
import { getAllTeams, getMyTeams } from "../../api/teamApi";
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
        const currentUserId = (user?._id || user?.id)?.toString();

        if (user.role === "participant") {
          const [hackData, teamData, regData, subData] = await Promise.all([
            getAllHackathons(),
            getMyTeams(),
            getMyRegistrations(),
            getAllSubmissions(),
          ]);

          setHackathons(hackData.hackathons || []);
          const userTeams = teamData.teams || [];
          setTeams(userTeams);
          setRegistrations(regData.registrations || []);

          const teamIds = userTeams.map((ut) => (ut._id || ut)?.toString());
          const userSubs = (subData.submissions || []).filter(
            (s) =>
              (s.submittedBy?._id || s.submittedBy)?.toString() === currentUserId ||
              teamIds.includes((s.team?._id || s.team)?.toString())
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
            (s) => (s.judge?._id || s.judge)?.toString() === currentUserId
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adaptive Human-in-the-Loop Evaluation Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">
            Signed in as <strong className="text-slate-800">{user.role}</strong> • Explore challenges, manage teams, track AI evaluations, and view results.
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
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Available Hackathons</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{hackathons.length}</p>
                <p className="text-2xs font-semibold text-blue-600 mt-0.5">{openHackathons.length} open for signups</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">My Teams</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{teams.length}</p>
                <p className="text-2xs text-slate-400 mt-0.5">Joined or created</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">My Registrations</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{registrations.length}</p>
                <p className="text-2xs text-emerald-600 font-medium mt-0.5">
                  {registrations.filter((r) => r.status === "approved").length} approved
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">My Submissions</p>
                <p className="text-2xl font-bold text-sky-600 mt-1">{submissions.length}</p>
                <p className="text-2xs text-sky-600 font-medium mt-0.5">Evaluated in competition</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <FileCode className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {(user.role === "organizer" || user.role === "admin") && (
          <>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Hosted Hackathons</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{hackathons.length}</p>
                <p className="text-2xs font-semibold text-blue-600 mt-0.5">{openHackathons.length} registration open</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Teams Formed</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{teams.length}</p>
                <p className="text-2xs text-slate-400 mt-0.5">Registered teams</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Pending Registrations</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {registrations.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-2xs text-rose-600 font-medium mt-0.5">Awaiting review</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Project Submissions</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{submissions.length}</p>
                <p className="text-2xs text-emerald-600 font-medium mt-0.5">Ready for AI evaluation</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileCode className="w-5 h-5" />
              </div>
            </div>
          </>
        )}

        {user.role === "judge" && (
          <>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Competitions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{hackathons.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Submissions to Grade</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{submissions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Gavel className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Scores Validated</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{scores.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Validation Rate</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {submissions.length > 0
                    ? `${Math.round((scores.length / submissions.length) * 100)}%`
                    : "0%"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* PARTICIPANT FOCUSED WORKSPACE SECTION */}
      {user.role === "participant" ? (
        <div className="space-y-6">
          {/* Row 1: Active Challenges with Real Calculated Deadlines */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Active Innovation Challenges
              </h2>
              <Link
                to="/hackathons"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
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
                      className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-semibold text-blue-600 uppercase tracking-wider">
                            {hack.domain || "Technology"}
                          </span>
                          {isClosed ? (
                            <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Submission Closed
                            </span>
                          ) : daysLeft !== null ? (
                            <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {daysLeft} Day{daysLeft !== 1 ? "s" : ""} Remaining
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{hack.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {hack.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>Deadline: <strong className="text-slate-700">{formatDate(hack.endDate)}</strong></span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Teams */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    My Teams
                  </h2>
                  <Link
                    to="/my-teams"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
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
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{tm.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
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
                <div className="pt-4 border-t border-slate-100">
                  <Link to="/teams/create">
                    <Button variant="outline" size="sm" className="w-full" icon={PlusCircle}>
                      Create Another Team
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* My Submissions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-sky-600" />
                    My Submissions & Evaluations
                  </h2>
                  <Link
                    to="/submissions"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
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
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{sub.title}</h4>
                          <p className="text-xs text-slate-500">
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
                <div className="pt-4 border-t border-slate-100">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Featured Challenge Events
                </h2>
                <Link
                  to="/hackathons"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
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
                <div className="divide-y divide-slate-100">
                  {hackathons.slice(0, 4).map((item) => (
                    <div
                      key={item._id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Platform Navigation</h3>
              <div className="space-y-2">
                <Link
                  to="/leaderboard"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Live Leaderboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/manage/evaluation-intelligence"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Evaluation Intelligence</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/manage/similarity"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition text-xs font-semibold text-slate-700 hover:text-blue-700"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Similarity Review</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
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
