import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import DashboardStatCard from "../../components/dashboard/DashboardStatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
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
        // Fetch depending on role
        if (user.role === "participant") {
          const [hackData, teamData, regData, subData] = await Promise.all([
            getAllHackathons(),
            getAllTeams(),
            getMyRegistrations(),
            getAllSubmissions(),
          ]);

          setHackathons(hackData.hackathons || []);
          
          // Filter teams where user is leader or member
          const userTeams = (teamData.teams || []).filter(
            (t) =>
              t.leader?._id === user.id ||
              t.members?.some((m) => m._id === user.id)
          );
          setTeams(userTeams);
          setRegistrations(regData.registrations || []);

          // Filter submissions belonging to user's teams
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
          
          // Filter scores submitted by this judge
          const judgeScores = (scoreData.scores || []).filter(
            (s) => s.judge?._id === user.id
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Active registration open hackathons
  const openHackathons = hackathons.filter(
    (h) => h.status === "registration_open"
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-350">
      <PageHeader
        title={`${user.name}'s Dashboard`}
        description={`View updates, stats and hackathon schedules. Account Role: ${user.role}`}
        action={
          user.role === "participant" ? (
            <Link to="/teams/create">
              <button className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition">
                <PlusCircle className="w-4 h-4" />
                Create New Team
              </button>
            </Link>
          ) : user.role === "organizer" || user.role === "admin" ? (
            <Link to="/manage/hackathons">
              <button className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition">
                <PlusCircle className="w-4 h-4" />
                Host Hackathon
              </button>
            </Link>
          ) : null
        }
      />

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === "participant" && (
          <>
            <DashboardStatCard
              title="Available Hackathons"
              value={hackathons.length}
              icon={Calendar}
              description={`${openHackathons.length} open for registrations`}
              color="sky"
            />
            <DashboardStatCard
              title="My Teams"
              value={teams.length}
              icon={Users}
              description="Teams you lead or joined"
              color="amber"
            />
            <DashboardStatCard
              title="My Registrations"
              value={registrations.length}
              icon={ClipboardCheck}
              description={`${
                registrations.filter((r) => r.status === "approved").length
              } Approved registrations`}
              color="emerald"
            />
            <DashboardStatCard
              title="My Submissions"
              value={submissions.length}
              icon={FileCode}
              description="Project source codes submitted"
              color="indigo"
            />
          </>
        )}

        {(user.role === "organizer" || user.role === "admin") && (
          <>
            <DashboardStatCard
              title="Hosted Hackathons"
              value={hackathons.length}
              icon={Calendar}
              description={`${openHackathons.length} open for registrations`}
              color="sky"
            />
            <DashboardStatCard
              title="Teams Registered"
              value={teams.length}
              icon={Users}
              description="Total hackathon teams formed"
              color="amber"
            />
            <DashboardStatCard
              title="Pending Registrations"
              value={registrations.filter((r) => r.status === "pending").length}
              icon={ClipboardCheck}
              description="Registrations awaiting review"
              color="rose"
            />
            <DashboardStatCard
              title="Project Submissions"
              value={submissions.length}
              icon={FileCode}
              description="Submissions ready for grading"
              color="indigo"
            />
          </>
        )}

        {user.role === "judge" && (
          <>
            <DashboardStatCard
              title="Total Hackathons"
              value={hackathons.length}
              icon={Calendar}
              description="Global hosted hackathons"
              color="sky"
            />
            <DashboardStatCard
              title="Submissions to Grade"
              value={submissions.length}
              icon={Gavel}
              description="Total submitted project solutions"
              color="amber"
            />
            <DashboardStatCard
              title="Projects Evaluated"
              value={scores.length}
              icon={Trophy}
              description="Submissions scored by you"
              color="emerald"
            />
            <DashboardStatCard
              title="Graded Percentage"
              value={
                submissions.length > 0
                  ? `${Math.round((scores.length / submissions.length) * 100)}%`
                  : "0%"
              }
              icon={Award}
              description="Grading completion status"
              color="indigo"
            />
          </>
        )}
      </div>

      {/* DETAILED CONTENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle area: Hackathons or Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Featured Hackathons</h2>
              <Link
                to="/hackathons"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {hackathons.length === 0 ? (
              <EmptyState
                title="No Hackathons Created"
                message="There are no hackathons listed on the platform yet."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {hackathons.slice(0, 3).map((item) => (
                  <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                      <p className="text-2xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-3xs text-slate-400">
                        <span className="capitalize bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {item.mode}
                        </span>
                        <span>Starts: {formatDate(item.startDate)}</span>
                      </div>
                    </div>
                    <Link to={`/hackathons/${item._id}`}>
                      <button className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-3xs px-3 py-1.5 rounded transition">
                        View
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional details */}
          {user.role === "participant" && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">My Registered Teams</h2>
                <Link
                  to="/my-teams"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                >
                  Manage Teams
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {teams.length === 0 ? (
                <EmptyState
                  title="No Teams Formed"
                  message="You are not a member of any teams. Create a team to get started."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teams.slice(0, 4).map((team) => (
                    <div key={team._id} className="p-4 border border-slate-100 rounded-lg">
                      <h4 className="text-sm font-bold text-slate-800">{team.name}</h4>
                      <p className="text-4xs text-slate-400 mt-1 uppercase font-semibold">
                        Hackathon: {team.hackathon?.title}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-3xs text-slate-500">
                          {team.members?.length} Members
                        </span>
                        <Link
                          to={`/teams/${team._id}`}
                          className="text-3xs font-semibold text-sky-600 hover:text-sky-700"
                        >
                          View Team &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Organizer activity overview */}
          {(user.role === "organizer" || user.role === "admin") && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800">Recent Submission Activity</h2>
                <Link
                  to="/submissions"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                >
                  View submissions
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {submissions.length === 0 ? (
                <EmptyState
                  title="No submissions yet"
                  message="No projects have been submitted for evaluation."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.slice(0, 3).map((item) => (
                    <div key={item._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-850">{item.title}</h4>
                        <p className="text-3xs text-slate-400 mt-1">
                          Submitted by Team: <span className="font-semibold text-slate-600">{item.team?.name}</span>
                        </p>
                      </div>
                      <Link to={`/submissions/${item._id}`}>
                        <span className="text-3xs font-semibold text-sky-600 hover:text-sky-700 underline">
                          Review Submission
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Quick links / system widgets */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Quick Navigation</h3>
            <div className="space-y-2">
              <Link to="/profile" className="flex items-center justify-between p-3 border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 rounded-lg transition text-xs font-semibold text-slate-700">
                <span>View User Profile</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link to="/notifications" className="flex items-center justify-between p-3 border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 rounded-lg transition text-xs font-semibold text-slate-700">
                <span>System Notifications</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              {user.role === "judge" && (
                <Link to="/judge/submissions" className="flex items-center justify-between p-3 border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 rounded-lg transition text-xs font-semibold text-slate-700">
                  <span>Submissions Workspace</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}
              {(user.role === "organizer" || user.role === "admin") && (
                <>
                  <Link to="/manage/registrations" className="flex items-center justify-between p-3 border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 rounded-lg transition text-xs font-semibold text-slate-700">
                    <span>Manage Team Approvals</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link to="/manage/results" className="flex items-center justify-between p-3 border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 rounded-lg transition text-xs font-semibold text-slate-700">
                    <span>Declare Results</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
            <div className="relative">
              <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
                InnovateX Info
              </h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Connect with mentors, form collaborative codebases, and push submissions through to final evaluations. Need help? Check details of specific hackathons.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-2xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>System status: Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
