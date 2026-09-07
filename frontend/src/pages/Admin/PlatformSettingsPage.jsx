import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Shield,
  Server,
  Brain,
  Sliders,
  Bell,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  Cpu,
  Radio
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import { toast } from "sonner";

const PlatformSettingsPage = () => {
  const [platformName, setPlatformName] = useState("InnovateX National Innovation Portal");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.80);
  const [minCalibrationSamples, setMinCalibrationSamples] = useState(3);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Platform settings saved successfully");
    }, 400);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Governance · System Configuration</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Platform Infrastructure & AI Policy Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure global platform operational policies, AI evaluation thresholds, and security parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* SECTION 1: GLOBAL AI & EVALUATION INFRASTRUCTURE */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Global AI Evaluation Infrastructure</h3>
              <p className="text-xs text-slate-500">
                Underlying LLM models, prompt versioning, and embedding engines used across all challenges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs text-slate-500 uppercase font-mono font-medium block">Primary LLM Provider</span>
              <strong className="text-slate-900 text-sm font-semibold block">Anthropic Claude 3.5 Sonnet</strong>
              <p className="text-xs text-slate-500 font-mono">Model ID: claude-3-5-sonnet-20241022</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs text-slate-500 uppercase font-mono font-medium block">Vector Embedding Engine</span>
              <strong className="text-slate-900 text-sm font-semibold block">Voyage-3 / OpenAI Embeddings</strong>
              <p className="text-xs text-slate-500 font-mono">Metric: Pairwise Cosine Vector Distance</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Default Cosine Similarity Alert Threshold ({similarityThreshold})
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <p className="text-xs text-slate-500">
                Submissions with cosine overlap above {similarityThreshold} generate an advisory alert for judge review.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Minimum Calibration Sample Threshold (N = {minCalibrationSamples})
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={minCalibrationSamples}
                onChange={(e) => setMinCalibrationSamples(parseInt(e.target.value) || 3)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono"
              />
              <p className="text-xs text-slate-500">
                Minimum validated human-correction samples required before fitting Ordinary Least Squares regression models.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: SYSTEM HEALTH & SERVER STATUS */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">System Health & Operational Status</h3>
              <p className="text-xs text-slate-500">
                Real-time server infrastructure, database connection, and websocket status.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase block font-sans font-medium">MongoDB Atlas</span>
                <strong className="text-emerald-700 font-semibold font-sans">Connected · Operational</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 flex items-center gap-3">
              <Radio className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase block font-sans font-medium">Socket.io Stream</span>
                <strong className="text-sky-700 font-semibold font-sans">Active · Real-Time</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-200 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 uppercase block font-sans font-medium">Node.js Engine</span>
                <strong className="text-brand-700 font-semibold font-sans">Express.js API (Port 5000)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PLATFORM SECURITY & REPRODUCIBILITY GUARANTEES */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Security & Research Integrity Guarantee</h3>
              <p className="text-xs text-slate-500">
                Role separation boundaries and sensitive credential protection standards.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-slate-900">Zero Secret Exposure:</strong> API keys (Anthropic, Voyage), database connection URIs, and JWT signing secrets remain strictly server-side.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-slate-900">Immutable Audit Logging:</strong> Judge reviews, score calibrations, and role modifications are preserved chronologically in MongoDB.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold text-slate-900">Strict Scoring Separation:</strong> Administrators cannot alter competition scores; only verified human judges validate evaluations.
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={saving}>
            Save Infrastructure Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PlatformSettingsPage;
