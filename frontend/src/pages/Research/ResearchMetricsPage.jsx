import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCheck2,
  GitCommit,
  Layers,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Sliders,
  AlertCircle
} from "lucide-react";
import { getHackathons } from "../../api/hackathonApi";
import { getCalibrationReport, runCalibration } from "../../api/calibrationApi";
import {
  getAgreementMetrics,
  getSimilarityPerformanceMetrics,
  getTimeSavedMetrics,
  exportResearchMetrics
} from "../../api/metricsApi";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { toast } from "sonner";

const ResearchMetricsPage = () => {
  const { hackathonId } = useParams();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(hackathonId || "");
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'calibration' | 'agreement' | 'similarity' | 'turnaround'

  // Data states
  const [calibrationData, setCalibrationData] = useState(null);
  const [agreementData, setAgreementData] = useState(null);
  const [similarityData, setSimilarityData] = useState(null);
  const [timeSavedData, setTimeSavedData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [recalibrating, setRecalibrating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load Hackathon List
  useEffect(() => {
    const fetchHackathonsList = async () => {
      try {
        const res = await getHackathons();
        if (res.success) {
          setHackathons(res.hackathons || []);
          if (!selectedHackathonId && res.hackathons?.length > 0) {
            setSelectedHackathonId(res.hackathons[0]._id);
          }
        }
      } catch (err) {
        toast.error("Failed to load hackathon options");
      }
    };
    fetchHackathonsList();
  }, []);

  // Fetch all 4 research datasets for the selected hackathon
  const fetchAllMetrics = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [calibRes, agreeRes, simRes, timeRes] = await Promise.all([
        getCalibrationReport(id, true).catch(() => ({ report: null })),
        getAgreementMetrics(id).catch(() => ({ metrics: null })),
        getSimilarityPerformanceMetrics(id, 0.8).catch(() => ({ metrics: null })),
        getTimeSavedMetrics(id).catch(() => ({ metrics: null }))
      ]);

      setCalibrationData(calibRes?.report || null);
      setAgreementData(agreeRes?.metrics || null);
      setSimilarityData(simRes?.metrics || null);
      setTimeSavedData(timeRes?.metrics || null);
    } catch (err) {
      toast.error("Failed to compile research metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchAllMetrics(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleTriggerRecalibration = async () => {
    if (!selectedHackathonId) return;
    setRecalibrating(true);
    toast.info("Running bias analysis and regression fitting...");
    try {
      const res = await runCalibration(selectedHackathonId);
      if (res.success) {
        setCalibrationData(res.report);
        toast.success("Calibration report and regression models updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to run recalibration");
    } finally {
      setRecalibrating(false);
    }
  };

  const handleExportPaperData = async () => {
    if (!selectedHackathonId) return;
    setExporting(true);
    try {
      const res = await exportResearchMetrics(selectedHackathonId);
      if (res.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `innovatex_research_metrics_${selectedHackathonId}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Research dataset exported successfully");
      }
    } catch (err) {
      toast.error("Failed to export research dataset");
    } finally {
      setExporting(false);
    }
  };

  // Transform calibration bias for Recharts
  const biasChartData = calibrationData?.criterionBias
    ? Object.entries(calibrationData.criterionBias).map(([criterion, stats]) => ({
        criterion: criterion.replace(/([A-Z])/g, " $1"),
        meanSignedError: stats.meanSignedError,
        medianSignedError: stats.medianSignedError,
        stdDev: stats.stdDev,
        sampleCount: stats.sampleCount
      }))
    : [];

  // Correction distribution: accepted, increased, decreased
  const correctionDistributionData = React.useMemo(() => {
    if (!calibrationData?.criterionBias) return [];
    let increased = 0;
    let decreased = 0;
    let neutral = 0;

    Object.values(calibrationData.criterionBias).forEach((stat) => {
      if (stat.meanSignedError > 0) increased += stat.sampleCount;
      else if (stat.meanSignedError < 0) decreased += stat.sampleCount;
      else neutral += stat.sampleCount;
    });

    return [
      { name: "AI Underscored (Judge Increased)", value: increased, color: "#38bdf8" },
      { name: "AI Overscored (Judge Decreased)", value: decreased, color: "#f43f5e" },
      { name: "AI Accepted (Delta ≈ 0)", value: neutral, color: "#10b981" },
    ].filter((item) => item.value > 0);
  }, [calibrationData]);

  // Held-Out Before vs After Comparison Data
  const heldOutData = calibrationData?.heldOutEvaluation;
  const beforeVsAfterTable = heldOutData && heldOutData.status === "ready"
    ? [
        {
          metric: "Mean Absolute Error (MAE)",
          before: heldOutData.beforeCalibration.mae,
          after: heldOutData.afterCalibration.mae,
          change: `${heldOutData.improvement.maeReduction > 0 ? "-" : "+"}${Math.abs(heldOutData.improvement.maeReduction)}`,
          isBetter: heldOutData.improvement.maeReduction > 0,
        },
        {
          metric: "Root Mean Squared Error (RMSE)",
          before: heldOutData.beforeCalibration.rmse,
          after: heldOutData.afterCalibration.rmse,
          change: `${heldOutData.improvement.rmseReduction > 0 ? "-" : "+"}${Math.abs(heldOutData.improvement.rmseReduction)}`,
          isBetter: heldOutData.improvement.rmseReduction > 0,
        },
        {
          metric: "Spearman Rank Correlation (ρ)",
          before: heldOutData.beforeCalibration.spearmanRho,
          after: heldOutData.afterCalibration.spearmanRho,
          change: `${(heldOutData.afterCalibration.spearmanRho - heldOutData.beforeCalibration.spearmanRho).toFixed(4)}`,
          isBetter: heldOutData.afterCalibration.spearmanRho >= heldOutData.beforeCalibration.spearmanRho,
        },
        {
          metric: "Mean Systematic Bias",
          before: heldOutData.beforeCalibration.bias,
          after: heldOutData.afterCalibration.bias,
          change: `${heldOutData.afterCalibration.bias}`,
          isBetter: Math.abs(heldOutData.afterCalibration.bias) <= Math.abs(heldOutData.beforeCalibration.bias),
        },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>IEEE Empirical Evaluation Suite · Real Data Only</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Research & Evaluation Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real measurements from Anthropic Claude evaluations, human validation deltas, and held-out calibration splits.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none shadow-sm"
          >
            {hackathons.map((h) => (
              <option key={h._id} value={h._id}>
                {h.title}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportPaperData}
            loading={exporting}
          >
            Export Paper JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchAllMetrics(selectedHackathonId)}
            loading={loading}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "overview"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          1. Research Overview & Effect
        </button>

        <button
          onClick={() => setActiveTab("calibration")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "calibration"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          2. Bias & Calibration Models
        </button>

        <button
          onClick={() => setActiveTab("agreement")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "agreement"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          3. Inter-Rater Agreement
        </button>

        <button
          onClick={() => setActiveTab("similarity")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "similarity"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          4. Similarity Detection
        </button>

        <button
          onClick={() => setActiveTab("turnaround")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === "turnaround"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          5. Turnaround Efficiency
        </button>
      </div>

      {/* TAB 1: RESEARCH OVERVIEW & CALIBRATION EFFECT */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Paired Validations (N)
              </p>
              <p className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {agreementData?.sampleSize || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Real Human-AI score pairs</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Calibration Samples
              </p>
              <p className="text-2xl font-bold text-brand-600 font-mono mt-1">
                {calibrationData?.sampleCount || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Non-zero correction pairs</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Baseline MAE
              </p>
              <p className="text-2xl font-bold text-amber-600 font-mono mt-1">
                {agreementData?.overallMetrics?.meanAbsoluteError !== undefined
                  ? agreementData.overallMetrics.meanAbsoluteError
                  : "N/A"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Mean error before calibration</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Cohen's Kappa (κ)
              </p>
              <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                {agreementData?.overallMetrics?.cohenWeightedKappa !== undefined
                  ? agreementData.overallMetrics.cohenWeightedKappa
                  : "N/A"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Inter-rater agreement</p>
            </div>
          </div>

          {/* Held-Out Before vs After Comparison Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-brand-600" />
                  Held-Out Evaluation Split: Before vs. After Calibration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regression model trained on chronological calibration set (70%) and evaluated strictly on unseen held-out test submissions (30%).
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 border border-brand-200 font-mono self-start">
                Bias-based calibration
              </span>
            </div>

            {!heldOutData || heldOutData.status !== "ready" ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  {heldOutData?.message || "Not enough data for held-out evaluation."}
                </p>
                <p className="text-xs text-slate-500">
                  Additional human-validated evaluations are required (minimum 4 samples across train and test partitions).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-5 py-3">Evaluation Metric</th>
                        <th className="px-5 py-3 font-mono">Before Calibration (Uncalibrated AI)</th>
                        <th className="px-5 py-3 font-mono">After Calibration (Adaptive AI)</th>
                        <th className="px-5 py-3 font-mono text-right">Empirical Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-sm">
                      {beforeVsAfterTable.map((row) => (
                        <tr key={row.metric} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-sans font-medium text-slate-900">{row.metric}</td>
                          <td className="px-5 py-3 text-slate-600">{row.before}</td>
                          <td className="px-5 py-3 text-brand-600 font-bold">{row.after}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.isBetter ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                            }`}>
                              {row.change}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    Partition Split: <strong className="text-slate-800">{heldOutData.split.calibrationSetCount}</strong> calibration samples / <strong className="text-slate-800">{heldOutData.split.heldOutTestSetCount}</strong> held-out test samples.
                  </span>
                  <span className="text-emerald-600 font-semibold">
                    {heldOutData.improvement.isImproved ? "✓ Measured Error Reduction Achieved" : "No Overfitting Observed"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Criterion Bias & Correction Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Criterion Bias Bar Chart */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                Criterion Bias (Mean Signed Error = Human Score - AI Score)
              </h3>
              {biasChartData.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">Insufficient validated samples for bias breakdown.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={biasChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="criterion" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#0f172a"
                        }}
                      />
                      <Bar dataKey="meanSignedError" fill="#3b82f6" name="Bias (MSE)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Correction Direction Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-brand-600" />
                Judge Correction Direction Distribution
              </h3>
              {correctionDistributionData.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">No correction deltas recorded yet.</p>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={correctionDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {correctionDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#0f172a"
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALIBRATION MODELS & REGRESSION */}
      {activeTab === "calibration" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Human-Correction Calibration & Bias Modeling
              </h2>
              <p className="text-xs text-slate-500">
                Measures signed judge deltas $(\text{humanScore} - \text{aiScore})$ and fits regression adaptation models.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              loading={recalibrating}
              onClick={handleTriggerRecalibration}
            >
              Re-fit Regression Models
            </Button>
          </div>

          {!calibrationData || calibrationData.sampleCount === 0 ? (
            <EmptyState
              icon={Scale}
              title="Not enough calibration samples yet"
              message="When human judges edit AI-generated scores, real training pairs are recorded here to compute criterion bias and linear regression fits."
            />
          ) : (
            <div className="space-y-6">
              {/* Per-Criterion Regression Models Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                  Linear Calibration Equations: human_score = m * ai_score + b
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-5 py-3.5">Criterion</th>
                        <th className="px-5 py-3.5">Sample Count</th>
                        <th className="px-5 py-3.5">Mean AI Score</th>
                        <th className="px-5 py-3.5">Mean Human Score</th>
                        <th className="px-5 py-3.5">Bias Direction</th>
                        <th className="px-5 py-3.5">Slope (m)</th>
                        <th className="px-5 py-3.5">Intercept (b)</th>
                        <th className="px-5 py-3.5">Fit R²</th>
                        <th className="px-5 py-3.5 text-right">Fit MAE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {Object.entries(calibrationData.criterionBias || {}).map(([crit, stats]) => (
                        <tr key={crit} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 font-semibold text-slate-900 font-mono">
                            {crit}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            {stats.sampleCount}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            {stats.meanAiScore}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            {stats.meanHumanScore}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                stats.biasDirection === "AI_UNDERSCORING"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : stats.biasDirection === "AI_OVERSCORING"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {stats.biasDirection}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-brand-600 font-semibold">
                            {stats.regression.slope}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-brand-600 font-semibold">
                            {stats.regression.intercept}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">
                            {stats.regression.r2}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                            {stats.regression.mae}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTER-RATER AGREEMENT */}
      {activeTab === "agreement" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Inter-Rater Agreement & Reliability Metrics
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates statistical concordance between baseline AI scores and expert human-validated scores.
            </p>
          </div>

          {!agreementData || agreementData.sampleSize === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No paired scores available"
              message="No submissions with both AI and human-validated scores found for this hackathon."
            />
          ) : (
            <div className="space-y-6">
              {/* Overall Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Spearman (ρ)
                  </p>
                  <p className="text-2xl font-bold text-brand-600 font-mono mt-1">
                    {agreementData.overallMetrics?.spearmanRho !== null
                      ? agreementData.overallMetrics.spearmanRho
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Rank Correlation</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Kendall (τ)
                  </p>
                  <p className="text-2xl font-bold text-brand-600 font-mono mt-1">
                    {agreementData.overallMetrics?.kendallTau !== null
                      ? agreementData.overallMetrics.kendallTau
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Concordance tau</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Cohen's Kappa (κ)
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                    {agreementData.overallMetrics?.cohenWeightedKappa}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Quadratic Weighted</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Mean Abs Error (MAE)
                  </p>
                  <p className="text-2xl font-bold text-sky-600 font-mono mt-1">
                    {agreementData.overallMetrics?.meanAbsoluteError}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Points deviation</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    RMSE
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 font-mono mt-1">
                    {agreementData.overallMetrics?.rootMeanSquaredError}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Root Mean Sq Error</p>
                </div>
              </div>

              {/* Per Criterion Agreement Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                  Per-Criterion Statistical Agreement Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-5 py-3.5">Criterion</th>
                        <th className="px-5 py-3.5">Sample Size</th>
                        <th className="px-5 py-3.5">Criterion MAE</th>
                        <th className="px-5 py-3.5">Criterion RMSE</th>
                        <th className="px-5 py-3.5 text-right">Weighted Kappa (κ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {Object.entries(agreementData.criterionBreakdown || {}).map(([crit, stats]) => (
                        <tr key={crit} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 font-semibold text-slate-900 font-mono">{crit}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">{stats.sampleSize}</td>
                          <td className="px-5 py-3.5 font-mono text-brand-600">{stats.mae}</td>
                          <td className="px-5 py-3.5 font-mono text-sky-600">{stats.rmse}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                            {stats.cohenWeightedKappa}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SIMILARITY DUPLICATE DETECTION PERFORMANCE */}
      {activeTab === "similarity" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Semantic Similarity Duplicate Detection Performance
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates Precision, Recall, and F1-score against human ground-truth duplicate annotations.
            </p>
          </div>

          {!similarityData || similarityData.totalGroundTruthLabels === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No ground-truth labels recorded"
              message="Label duplicate pairs in the Similarity Review page to generate precision/recall evaluation matrices."
            />
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Precision</p>
                  <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                    {(similarityData.metrics.precision * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">TP / (TP + FP)</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Recall</p>
                  <p className="text-2xl font-bold text-brand-600 font-mono mt-1">
                    {(similarityData.metrics.recall * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">TP / (TP + FN)</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">F1-Score</p>
                  <p className="text-2xl font-bold text-sky-600 font-mono mt-1">
                    {(similarityData.metrics.f1Score * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Harmonic mean</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Accuracy</p>
                  <p className="text-2xl font-bold text-slate-900 font-mono mt-1">
                    {(similarityData.metrics.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Overall correctness</p>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">2x2 Confusion Matrix</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-xs uppercase font-semibold text-emerald-700">True Positives (TP)</p>
                    <p className="text-3xl font-extrabold text-emerald-800 font-mono mt-1">
                      {similarityData.confusionMatrix.truePositives}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Correctly Flagged Duplicates</p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-xs uppercase font-semibold text-rose-700">False Positives (FP)</p>
                    <p className="text-3xl font-extrabold text-rose-800 font-mono mt-1">
                      {similarityData.confusionMatrix.falsePositives}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Spurious Overlap Warnings</p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs uppercase font-semibold text-amber-700">False Negatives (FN)</p>
                    <p className="text-3xl font-extrabold text-amber-800 font-mono mt-1">
                      {similarityData.confusionMatrix.falseNegatives}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Missed Duplicates</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs uppercase font-semibold text-slate-700">True Negatives (TN)</p>
                    <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                      {similarityData.confusionMatrix.trueNegatives}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Correctly Cleared Distinct</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TURNAROUND TIME SAVINGS */}
      {activeTab === "turnaround" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Evaluation Turnaround Time Savings
            </h2>
            <p className="text-xs text-slate-500">
              Compares submission creation-to-scoring duration for AI-assisted workflows against manual baselines.
            </p>
          </div>

          {!timeSavedData ? (
            <EmptyState
              icon={Clock}
              title="No turnaround time data available"
              message="Turnaround time comparison will populate as submissions are submitted and evaluated."
            />
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    AI-Assisted Mean Turnaround
                  </p>
                  <p className="text-2xl font-bold text-brand-600 font-mono mt-1">
                    {timeSavedData.aiAssisted?.meanTurnaroundMinutes} <span className="text-xs text-slate-500">min</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">({timeSavedData.aiAssisted?.meanTurnaroundHours} hrs)</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Manual Baseline Turnaround
                  </p>
                  <p className="text-2xl font-bold text-slate-800 font-mono mt-1">
                    {timeSavedData.legacyManualBaseline?.meanTurnaroundMinutes !== null
                      ? `${timeSavedData.legacyManualBaseline.meanTurnaroundMinutes} min`
                      : "No legacy data"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Fully manual judging</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Time Reduction (%)
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                    {timeSavedData.timeSavedPercentage !== null
                      ? `${timeSavedData.timeSavedPercentage}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Turnaround acceleration</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchMetricsPage;
