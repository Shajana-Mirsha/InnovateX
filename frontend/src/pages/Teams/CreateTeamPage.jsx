import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createTeam } from "../../api/teamApi";
import { getAllHackathons } from "../../api/hackathonApi";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ArrowLeft, Users, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const CreateTeamPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hackathonId, setHackathonId] = useState("");
  const [hackathons, setHackathons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllHackathons();
        if (data.success) {
          const activeEvents = (data.hackathons || []).filter(
            (h) => h.status !== "completed" && h.status !== "cancelled"
          );
          setHackathons(activeEvents);
          if (activeEvents.length > 0) {
            setHackathonId(activeEvents[0]._id);
          }
        }
      } catch (err) {
        setError("Failed to load hackathons list.");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !hackathonId) {
      setError("Team name and hackathon event are required.");
      return;
    }

    setSubmitLoading(true);
    try {
      const data = await createTeam({
        name,
        description,
        hackathonId,
      });

      if (data.success) {
        toast.success("Team created successfully!");
        navigate("/my-teams");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create team. Name might be taken."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams List
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Create a New Challenge Team
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build a team for a specific hackathon. You will be registered as the Team Leader.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-2xs font-semibold text-slate-500 uppercase mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Neural Nexus"
              className="block w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-500 uppercase mb-2">
              Target Hackathon Challenge *
            </label>
            {hackathons.length === 0 ? (
              <p className="text-xs text-rose-600 font-medium p-3 bg-rose-50 border border-rose-200 rounded-xl">
                No active hackathons available to create a team for.
              </p>
            ) : (
              <select
                required
                className="block w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                value={hackathonId}
                onChange={(e) => setHackathonId(e.target.value)}
              >
                {hackathons.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.title} (Max members: {h.maxTeamSize})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-500 uppercase mb-2">
              Team Description
            </label>
            <textarea
              rows={3}
              placeholder="Briefly state your team focus, stack, or open member roles..."
              className="block w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Link to="/teams">
              <Button variant="outline" type="button" disabled={submitLoading}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              loading={submitLoading}
              disabled={hackathons.length === 0}
            >
              Create Team
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;
