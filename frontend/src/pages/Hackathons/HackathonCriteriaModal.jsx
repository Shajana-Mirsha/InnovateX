import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Sliders, CheckCircle2, AlertCircle, Save, HelpCircle } from "lucide-react";
import Button from "../../components/common/Button";
import { updateHackathonCriteria } from "../../api/hackathonApi";
import { toast } from "sonner";

const DEFAULT_CRITERIA = [
  { name: "innovation", description: "Originality, novelty, and creative problem-solving approach.", weight: 0.25, maxScore: 10 },
  { name: "technicalImplementation", description: "Architecture soundness, engineering complexity, repository feasibility, and technical execution.", weight: 0.25, maxScore: 10 },
  { name: "impact", description: "Real-world value, scalability, market applicability, and practical problem resolution.", weight: 0.25, maxScore: 10 },
  { name: "presentation", description: "Documentation clarity, pitch coherence, and communication of the project value.", weight: 0.25, maxScore: 10 }
];

const HackathonCriteriaModal = ({ isOpen, onClose, hackathon, onUpdated }) => {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hackathon) {
      if (hackathon.criteria && hackathon.criteria.length > 0) {
        setCriteria(
          hackathon.criteria.map((c) => ({
            name: c.name || "",
            description: c.description || "",
            weight: typeof c.weight === "number" ? c.weight : 0.25,
            maxScore: typeof c.maxScore === "number" ? c.maxScore : 10
          }))
        );
      } else {
        setCriteria(DEFAULT_CRITERIA);
      }
    }
  }, [hackathon]);

  if (!isOpen || !hackathon) return null;

  const totalWeight = Math.round(criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) * 100);
  const isWeightValid = totalWeight === 100 || totalWeight === criteria.length * 100; // Allow 1.0 (100%) or raw integers

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        name: `criterion_${criteria.length + 1}`,
        description: "Evaluation description and standards for this dimension.",
        weight: 0.2,
        maxScore: 10
      }
    ]);
  };

  const handleRemoveCriterion = (index) => {
    if (criteria.length <= 1) {
      toast.error("At least one evaluation criterion is required");
      return;
    }
    setCriteria(criteria.filter((_, idx) => idx !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleNormalizeWeights = () => {
    if (criteria.length === 0) return;
    const equalWeight = Math.round((1.0 / criteria.length) * 100) / 100;
    setCriteria(
      criteria.map((c, i) => ({
        ...c,
        weight: i === criteria.length - 1 ? Math.round((1.0 - equalWeight * (criteria.length - 1)) * 100) / 100 : equalWeight
      }))
    );
    toast.success("Weights evenly distributed to sum to 100%");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const c of criteria) {
      if (!c.name.trim()) {
        toast.error("All criteria must have a non-empty name");
        return;
      }
      if (Number(c.weight) <= 0) {
        toast.error(`Weight for "${c.name}" must be greater than 0`);
        return;
      }
      if (Number(c.maxScore) <= 0) {
        toast.error(`Max score for "${c.name}" must be greater than 0`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = criteria.map((c) => ({
        name: c.name.trim(),
        description: c.description.trim(),
        weight: Number(c.weight),
        maxScore: Number(c.maxScore)
      }));

      const res = await updateHackathonCriteria(hackathon._id, payload);
      if (res.success) {
        toast.success("Evaluation rubric updated successfully");
        if (onUpdated) onUpdated(res.hackathon);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update criteria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Evaluation Rubric & Criteria</h2>
              <p className="text-xs text-slate-500">{hackathon.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Weight Status Bar */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Rubric Weight Balance:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                totalWeight === 100
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {totalWeight}%
            </span>
            {totalWeight === 100 ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal 100% distribution
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Sums to {totalWeight}%, recommend 100%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleNormalizeWeights}
            className="text-brand-600 hover:text-brand-700 font-semibold"
          >
            Auto-Balance Evenly
          </button>
        </div>

        {/* Criteria List Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <AnimatePresence>
            {criteria.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Criterion Identifier
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleChange(idx, "name", e.target.value)}
                      placeholder="e.g. algorithmicInnovation"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={item.maxScore}
                      onChange={(e) => handleChange(idx, "maxScore", parseFloat(e.target.value) || 10)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weight: {(item.weight * 100).toFixed(0)}%
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      max="1.0"
                      value={item.weight}
                      onChange={(e) => handleChange(idx, "weight", parseFloat(e.target.value) || 0.1)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="p-2 mt-5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                    title="Delete criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Evaluation Guidance & Rubric Standards (Given to AI and Human Judges)
                  </label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleChange(idx, "description", e.target.value)}
                    placeholder="Describe what high-scoring submissions must demonstrate for this criterion..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCriterion}
            icon={Plus}
            className="w-full border-dashed border-slate-300 hover:border-brand-500 text-slate-600 bg-white"
          >
            Add Evaluation Criterion
          </Button>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * AI and Human judges score strictly against these calibrated rubrics.
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                icon={Save}
              >
                Save Rubric
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default HackathonCriteriaModal;
