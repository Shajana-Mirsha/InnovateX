import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyRegistrations } from "../../api/registrationApi";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { TableSkeleton } from "../../components/common/Skeleton";
import { formatDate } from "../../utils/helpers";
import { Calendar, Users, ClipboardCheck, ArrowRight } from "lucide-react";

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRegistrations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyRegistrations();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      setError("Failed to fetch registrations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Challenge Registrations</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            My Event Registrations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Check approval statuses, challenge timelines, and unlock code submission portals.
          </p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchRegistrations} />
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No registrations found"
          message="You haven't registered any team for a challenge yet. Explore hackathons to submit your team."
          actionButton={
            <Link to="/hackathons">
              <Button variant="primary" size="sm">Browse Challenges</Button>
            </Link>
          }
        />
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-4xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Hackathon Event</th>
                  <th className="px-6 py-4">Registered Team</th>
                  <th className="px-6 py-4">Event Dates</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4 text-right">Project Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <Link
                        to={`/hackathons/${reg.hackathon?._id || reg.hackathon}`}
                        className="text-sm font-bold text-white hover:text-brand-400 block transition"
                      >
                        {reg.hackathon?.title || "Challenge"}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/teams/${reg.team?._id || reg.team}`}
                        className="text-xs font-semibold text-slate-300 hover:text-white block transition"
                      >
                        {reg.team?.name || "Team"}
                      </Link>
                      <p className="text-4xs text-slate-500 font-mono mt-0.5 uppercase">
                        {reg.team?.members?.length || 1} Members
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {formatDate(reg.hackathon?.startDate)} – {formatDate(reg.hackathon?.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.status === "approved" ? (
                        <Link to="/submissions/create">
                          <button className="text-xs font-bold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                            Submit Project
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      ) : (
                        <span className="text-3xs text-slate-500 font-mono">Awaiting Review</span>
                      )}
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

export default MyRegistrationsPage;
