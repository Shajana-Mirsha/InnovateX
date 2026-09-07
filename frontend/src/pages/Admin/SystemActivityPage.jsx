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
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Logging & Compliance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            System Activity & Human Validation Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time chronological stream of judge evaluation reviews, score revisions, and validation audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:border-brand-500 focus:outline-none shadow-sm"
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3.5">Action Type</th>
                  <th className="px-6 py-3.5">Evaluator / Judge</th>
                  <th className="px-6 py-3.5">Target Submission & Hackathon</th>
                  <th className="px-6 py-3.5">Audit Notes</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          act.action === "accept_unchanged"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : act.action === "edit"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : act.action === "reject"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {act.action === "accept_unchanged" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {act.action === "edit" && <Edit3 className="w-3.5 h-3.5" />}
                        {act.action === "reject" && <XCircle className="w-3.5 h-3.5" />}
                        {act.action === "view" && <Eye className="w-3.5 h-3.5" />}
                        {act.action.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900 block">{act.user}</span>
                      <span className="text-xs text-slate-500 font-mono">{act.userEmail || "judge"}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800 block">{act.target}</span>
                      <span className="text-xs text-brand-600 font-medium">Event: {act.hackathon}</span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600 italic max-w-xs truncate">
                      "{act.notes || "Standard workflow validation"}"
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-500 font-mono">
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
