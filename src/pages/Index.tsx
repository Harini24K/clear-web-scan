import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, ShieldCheck, ShieldAlert, AlertTriangle,
  Activity, Brain, Layers, Sparkles, Globe, TrendingUp,
  Link2, FileText, Lock,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { extractFeatures, featureToRiskFactors } from "@/lib/featureExtraction";
import { predict, type EnsembleResult } from "@/lib/ensembleModel";
import { analyzeWebsite, type WebsiteAnalysisResult } from "@/lib/websiteAnalysis";
import type { URLFeatures } from "@/lib/featureExtraction";
import RiskScoreBar from "@/components/RiskScoreBar";
import ModelCard from "@/components/ModelCard";
import FeatureRow from "@/components/FeatureRow";
import HistoryPanel, { type HistoryEntry } from "@/components/HistoryPanel";
import ScanAnimation from "@/components/ScanAnimation";
import AnalysisReport from "@/components/AnalysisReport";

const SAFE_SUGGESTIONS: Record<string, string> = {
  "paypal": "https://www.paypal.com",
  "google": "https://www.google.com",
  "facebook": "https://www.facebook.com",
  "amazon": "https://www.amazon.com",
  "apple": "https://www.apple.com",
  "microsoft": "https://www.microsoft.com",
};

const Index = () => {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<EnsembleResult | null>(null);
  const [features, setFeatures] = useState<URLFeatures | null>(null);
  const [analysis, setAnalysis] = useState<WebsiteAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [safeSuggestion, setSafeSuggestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trust" | "ml" | "features">("trust");

  const handleScan = useCallback(async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setFeatures(null);
    setAnalysis(null);
    setSafeSuggestion(null);

    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1500));

    const extracted = extractFeatures(url);
    const prediction = predict(extracted);
    const websiteAnalysis = analyzeWebsite(url);

    setFeatures(extracted);
    setResult(prediction);
    setAnalysis(websiteAnalysis);
    setScanning(false);
    setActiveTab("trust");

    setHistory((prev) => [
      { url, prediction: websiteAnalysis.verdict === "safe" ? "legitimate" : "phishing", riskScore: 100 - websiteAnalysis.trustScore, timestamp: new Date() },
      ...prev.slice(0, 19),
    ]);

    if (websiteAnalysis.verdict === "phishing") {
      const lower = url.toLowerCase();
      for (const [key, safe] of Object.entries(SAFE_SUGGESTIONS)) {
        if (lower.includes(key)) {
          setSafeSuggestion(safe);
          break;
        }
      }
    }
  }, [url]);

  const riskFactors = features ? featureToRiskFactors(features) : [];

  const verdictConfig = analysis ? {
    safe: { icon: ShieldCheck, color: "text-safe", bg: "bg-safe/5 border-safe/30 glow-safe", label: "✅ Website Appears Trustworthy" },
    suspicious: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/5 border-warning/30", label: "⚠️ Suspicious — Proceed With Caution" },
    phishing: { icon: ShieldAlert, color: "text-danger", bg: "bg-danger/5 border-danger/30 glow-danger", label: "🚨 High Risk — Likely Phishing" },
  }[analysis.verdict] : null;

  return (
    <div className="min-h-screen bg-background scan-line">
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-primary">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">PhishGuard AI</h1>
              <p className="text-xs text-muted-foreground">Advanced Website Trust Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="w-3 h-3 text-safe animate-pulse-glow" />
              <span>7 Modules Active</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-8"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="gradient-text">Deep Website Analysis</span>
            <br />
            <span className="text-foreground">Beyond URL Scanning</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Multi-factor trust analysis: domain WHOIS, traffic rank, backlinks, search indexing,
            content signals, reputation checks & ML ensemble.
          </p>
        </motion.section>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 max-w-2xl mx-auto"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="Enter URL to analyze (e.g., https://example.com)"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
              />
            </div>
            <button
              onClick={handleScan}
              disabled={scanning || !url.trim()}
              className="px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-primary flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Analyze
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {scanning && <ScanAnimation />}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {analysis && result && !scanning && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Verdict Banner */}
              {verdictConfig && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className={`rounded-2xl p-6 border ${verdictConfig.bg}`}
                >
                  <div className="flex items-start gap-4">
                    <verdictConfig.icon className={`w-10 h-10 ${verdictConfig.color} shrink-0`} />
                    <div className="flex-1 space-y-2">
                      <h3 className={`text-xl font-bold ${verdictConfig.color}`}>
                        {verdictConfig.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">{analysis.verdictExplanation}</p>
                      {safeSuggestion && (
                        <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-safe/10 border border-safe/20">
                          <Sparkles className="w-4 h-4 text-safe" />
                          <span className="text-sm text-safe">
                            Did you mean: <a href={safeSuggestion} className="font-mono underline">{safeSuggestion}</a>?
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Trust Score</p>
                      <p className={`text-3xl font-bold font-mono ${verdictConfig.color}`}>{analysis.trustScore}%</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Trust Score Bar */}
              <div className="glass rounded-xl p-5 space-y-4">
                <RiskScoreBar score={100 - analysis.trustScore} />
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { icon: Globe, label: "Domain Age", value: `${analysis.domainInfo.registeredDays}d` },
                    { icon: TrendingUp, label: "Traffic Rank", value: analysis.trafficAnalysis.estimatedRank > 0 ? `#${analysis.trafficAnalysis.estimatedRank.toLocaleString()}` : "N/A" },
                    { icon: Link2, label: "Backlinks", value: analysis.backlinkAnalysis.estimatedBacklinks.toLocaleString() },
                    { icon: Search, label: "Indexed", value: analysis.searchPresence.likelyIndexed ? "Yes" : "No" },
                    { icon: Lock, label: "SSL", value: analysis.domainInfo.sslValid ? "Valid" : "Invalid" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center p-2 rounded-lg bg-secondary/50">
                      <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold font-mono text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {([
                  { key: "trust", label: "Trust Analysis", icon: ShieldCheck },
                  { key: "ml", label: "ML Models", icon: Brain },
                  { key: "features", label: "URL Features", icon: Layers },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === key
                        ? "bg-primary text-primary-foreground"
                        : "glass text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "trust" && <AnalysisReport result={analysis} />}

              {activeTab === "ml" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-3">
                    {result.models.map((m, i) => (
                      <ModelCard key={m.name} model={m} index={i} />
                    ))}
                  </div>
                  {result.accuracy && (
                    <div className="glass rounded-lg p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Training Accuracy</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { name: "Random Forest", acc: result.accuracy.rf },
                          { name: "Logistic Regression", acc: result.accuracy.lr },
                          { name: "XGBoost", acc: result.accuracy.xgb },
                        ].map(({ name, acc }) => (
                          <div key={name} className="text-xs">
                            <span className="text-foreground font-bold">{acc}%</span>
                            <br />
                            <span className="text-muted-foreground">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "features" && (
                <div className="glass rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    URL Feature Extraction
                  </h3>
                  {riskFactors.map((f, i) => (
                    <FeatureRow key={f.label} label={f.label} value={f.value} risk={f.risk} index={i} />
                  ))}
                </div>
              )}

              {/* History */}
              <HistoryPanel entries={history} />
            </motion.div>
          )}
        </AnimatePresence>

        {!analysis && !scanning && history.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <HistoryPanel entries={history} />
          </div>
        )}

        {!analysis && !scanning && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4"
          >
            {[
              { icon: Globe, title: "Domain & WHOIS", desc: "Age, SSL, TLD reputation analysis" },
              { icon: TrendingUp, title: "Traffic & SEO", desc: "Rank, backlinks, search indexing" },
              { icon: Brain, title: "ML Ensemble", desc: "3 models + content signal analysis" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass rounded-xl p-5 text-center space-y-2"
              >
                <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border/50 mt-16 py-6 text-center text-xs text-muted-foreground">
        PhishGuard AI — Advanced Website Trust Analysis with Adaptive Ensemble Learning
      </footer>
    </div>
  );
};

export default Index;
