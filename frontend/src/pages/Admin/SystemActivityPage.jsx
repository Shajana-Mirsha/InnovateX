import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSystemActivity } from "../../api/adminApi";
import PageHeader from "../../components/common/PageHeader";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { TableSkeleton } from "../../components/common/Skeleton";
import {
  Activity,
  CheckCircle2,
  Edit3,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  Filter,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

const SystemActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const fetchActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSystemActivity(50);
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (err) {
      setError("Failed to load system activity audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter((act) =>
    filterAction === "all" ? true : act.action === filterAction
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Logging & Compliance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            System Activity & Human Validation Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time chronological stream of judge evaluation reviews, score revisions, and validation audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="accept_unchanged">Accept Unchanged</option>
            <option value="edit">Score Edits</option>
            <option value="reject">Rejections</option>
            <option value="view">Views</option>
          </select>

          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchActivities}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Activity Timeline Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchActivities} />
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded"
          message="There are no system actions matching the selected filter criteria."
        />
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-4xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Action Type</th>
                  <th className="px-6 py-4">Evaluator / Judge</th>
                  <th className="px-6 py-4">Target Submission & Hackathon</th>
                  <th className="px-6 py-4">Audit Notes</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          act.action === "accept_unchanged"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-medium"
                            : act.action === "edit"
                            ? "bg-brand-500/15 text-brand-300 border-brand-500/30 font-medium"
                            : act.action === "reject"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30 font-medium"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {act.action === "accept_unchanged" && <CheckCircle2 className="w-3 h-3" />}
                        {act.action === "edit" && <Edit3 className="w-3 h-3" />}
                        {act.action === "reject" && <XCircle className="w-3 h-3" />}
                        {act.action === "view" && <Eye className="w-3 h-3" />}
                        {act.action.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white block">{act.user}</span>
                      <span className="text-3xs text-slate-400 font-mono">{act.userEmail || "judge"}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-200 block">{act.target}</span>
                      <span className="text-3xs text-brand-400 font-mono">Event: {act.hackathon}</span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 italic max-w-xs truncate">
                      "{act.notes || "Standard workflow validation"}"
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemActivityPage;
