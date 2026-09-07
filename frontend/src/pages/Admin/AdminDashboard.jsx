import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSystemStats, getSystemActivity } from "../../api/adminApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { CardSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Users,
  ShieldCheck,
  Calendar,
  FileCode,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Brain,
  Sliders,
  Activity
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, actRes] = await Promise.all([
        getSystemStats(),
        getSystemActivity(8)
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (actRes.success) setActivities(actRes.activities || []);
    } catch (err) {
      setError("Failed to load admin system statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            System Administration & Research Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time aggregate platform operations, user role governance, and human-in-the-loop telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/users">
            <Button variant="primary" size="md" icon={Users}>
              User Directory
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchAdminData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchAdminData} />
      ) : (
        <div className="space-y-8">
          {/* PRIMARY SYSTEM STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Registered Users</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900 font-mono">{stats?.users?.total || 0}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-mono">
                  <span className="text-emerald-600 font-semibold">Active: {stats?.users?.active || 0}</span>
                  <span>•</span>
                  <span className="text-rose-600 font-semibold">Suspended: {stats?.users?.suspended || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hackathons Hosted</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900 font-mono">{stats?.hackathons?.total || 0}</p>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong className="text-indigo-600 font-semibold">{stats?.hackathons?.active || 0}</strong> active/open events
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Project Submissions</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileCode className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900 font-mono">{stats?.submissions?.total || 0}</p>
                <p className="text-xs text-slate-500 mt-1.5">
                  Across <strong className="text-emerald-600 font-semibold">{stats?.teams?.total || 0}</strong> registered teams
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Evaluations & Scorecards</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900 font-mono">{stats?.evaluations?.total || 0}</p>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong className="text-emerald-600 font-semibold">{stats?.evaluations?.humanValidated || 0}</strong> expert validated
                </p>
              </div>
            </div>
          </div>

          {/* ADMIN MANAGEMENT & RESEARCH PLATFORM WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Platform Governance Hub */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    Platform Governance & Telemetry Modules
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/admin/users"
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-white transition group space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                      User & Role Management
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Manage user privileges, suspend or activate accounts, and assign judge/organizer roles.
                    </p>
                  </Link>

                  <Link
                    to="/manage/evaluation-intelligence"
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:bg-white transition group space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Brain className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      Evaluation Intelligence
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      8-stage pipeline telemetry, AI model transparency, and inter-judge disagreement alerts.
                    </p>
                  </Link>

                  <Link
                    to="/manage/similarity"
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-500 hover:bg-white transition group space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <ShieldAlert className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
                      Semantic Similarity Defense
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Monitor cosine vector overlap alerts, investigate suspicious code clones, and audit labels.
                    </p>
                  </Link>

                  <Link
                    to="/manage/research-metrics"
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-white transition group space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <BarChart3 className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
                      Research Metrics & Analytics
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Empirical evaluation metrics (MAE, RMSE, Spearman rho, Cohen Kappa) and paper JSON export.
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Live Activity Stream */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Live Activity Stream
                  </h3>
                  <Link
                    to="/admin/activity"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </Link>
                </div>

                {activities.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No activity recorded"
                    message="System validation events will appear here in real time."
                  />
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 capitalize">{act.action.replace("_", " ")}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {formatDate(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">
                          Judge <strong className="text-slate-800">{act.user}</strong> reviewed project{" "}
                          <strong className="text-slate-800">"{act.target}"</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
