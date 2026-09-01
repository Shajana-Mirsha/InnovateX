import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getSystemStats, getSystemActivity } from "../../api/adminApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import { CardSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import {
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  FileCode,
  Trophy,
  Activity,
  Sparkles,
  Scale,
  RefreshCw,
  UserCheck,
  UserX,
  Gavel,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Brain,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

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
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            System Administration & Research Governance
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Registered Accounts</span>
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white font-mono">{stats?.users?.total || 0}</p>
                <div className="flex items-center gap-2 mt-1 text-3xs text-slate-400 font-mono">
                  <span className="text-emerald-400">Active: {stats?.users?.active || 0}</span>
                  <span>•</span>
                  <span className="text-rose-400">Suspended: {stats?.users?.suspended || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Hackathons Hosted</span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-sky-300 font-mono">{stats?.hackathons?.total || 0}</p>
                <p className="text-3xs text-slate-400 mt-1">
                  <strong className="text-sky-400">{stats?.hackathons?.active || 0}</strong> active/open events
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Project Submissions</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileCode className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-emerald-300 font-mono">{stats?.submissions?.total || 0}</p>
                <p className="text-3xs text-slate-400 mt-1">
                  Across <strong className="text-emerald-400">{stats?.teams?.total || 0}</strong> formed teams
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Evaluations & Validations</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-indigo-300 font-mono">{stats?.evaluations?.total || 0}</p>
                <p className="text-3xs text-slate-400 mt-1">
                  <strong className="text-emerald-400">{stats?.evaluations?.humanValidated || 0}</strong> expert validated
                </p>
              </div>
            </div>
          </div>

          {/* ADMIN MANAGEMENT & RESEARCH PLATFORM WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Platform Governance Hub */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-brand-400" />
                    Platform Governance & Telemetry Modules
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/admin/users"
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-brand-500/60 transition group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition">
                      User & Role Management
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Manage user privileges, suspend or activate accounts, and assign judge/organizer roles.
                    </p>
                  </Link>

                  <Link
                    to="/manage/evaluation-intelligence"
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-brand-500/60 transition group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Brain className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                      Evaluation Intelligence
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      8-stage pipeline telemetry, AI model transparency, and inter-judge disagreement alerts.
                    </p>
                  </Link>

                  <Link
                    to="/manage/similarity"
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/60 transition group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <ShieldAlert className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                      Semantic Similarity Defense
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Monitor cosine vector overlap alerts, investigate suspicious code clones, and audit labels.
                    </p>
                  </Link>

                  <Link
                    to="/manage/research-metrics"
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/60 transition group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <BarChart3 className="w-4.5 h-4.5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                      Research Metrics & Calibration
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Empirical evaluation metrics (MAE, RMSE, Spearman $\rho$, Kappa) and paper JSON export.
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Live Activity Stream */}
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live Activity Stream
                  </h3>
                  <Link
                    to="/admin/activity"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300"
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
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white capitalize">{act.action.replace("_", " ")}</span>
                          <span className="text-4xs text-slate-500 font-mono">
                            {formatDate(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-3xs text-slate-400 truncate">
                          Judge <strong className="text-slate-300">{act.user}</strong> reviewed project{" "}
                          <strong className="text-slate-300">"{act.target}"</strong>
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
