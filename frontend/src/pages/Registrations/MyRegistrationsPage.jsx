import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyRegistrations } from "../../api/registrationApi";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
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
      console.error(err);
      setError("Failed to fetch registrations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="My Registrations"
        description="Check status approvals and deadlines for registrations submitted by you."
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryAction={fetchRegistrations} />
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No registrations found"
          message="You haven't registered any team for a hackathon yet. Go to a hackathon details page to register your team."
          actionButton={
            <Link to="/hackathons">
              <Button variant="primary">Browse Hackathons</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-3xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                  <th className="px-6 py-4">Hackathon Event</th>
                  <th className="px-6 py-4">Registered Team</th>
                  <th className="px-6 py-4">Deadline / Dates</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Solutions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <Link
                        to={`/hackathons/${reg.hackathon?._id}`}
                        className="text-sm font-bold text-slate-800 hover:text-sky-600 underline block"
                      >
                        {reg.hackathon?.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/teams/${reg.team?._id}`}
                        className="text-xs font-semibold text-slate-700 hover:text-sky-600 underline block"
                      >
                        {reg.team?.name}
                      </Link>
                      <p className="text-4xs text-slate-400 mt-1 uppercase">
                        {reg.team?.members?.length || 0} Members
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-650">
                      {formatDate(reg.hackathon?.startDate)} – {formatDate(reg.hackathon?.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reg.status === "approved" ? (
                        <Link to="/submissions/create">
                          <button className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                            Submit Project
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      ) : (
                        <span className="text-3xs text-slate-400 font-medium">Awaiting Approval</span>
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
