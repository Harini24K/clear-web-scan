import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Search, ShieldCheck, ShieldAlert, AlertTriangle,
  Activity, Brain, Layers, ChevronRight, Sparkles,
} from "lucide-react";
import { extractFeatures, featureToRiskFactors } from "@/lib/featureExtraction";
import { predict, type EnsembleResult } from "@/lib/ensembleModel";
import type { URLFeatures } from "@/lib/featureExtraction";
import RiskScoreBar from "@/components/RiskScoreBar";
import ModelCard from "@/components/ModelCard";
import FeatureRow from "@/components/FeatureRow";
import HistoryPanel, { type HistoryEntry } from "@/components/HistoryPanel";
import ScanAnimation from "@/components/ScanAnimation";

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [safeSuggestion, setSafeSuggestion] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setFeatures(null);
    setSafeSuggestion(null);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 1200));

    const extracted = extractFeatures(url);
    const prediction = predict(extracted);

    setFeatures(extracted);
    setResult(prediction);
    setScanning(false);

    setHistory((prev) => [
      { url, prediction: prediction.finalPrediction, riskScore: prediction.riskScore, timestamp: new Date() },
      ...prev.slice(0, 19),
    ]);

    // Safe suggestion
    if (prediction.finalPrediction === "phishing") {
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
  const isPhishing = result?.finalPrediction === "phishing";

  return (
    <div className="min-h-screen bg-background scan-line">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-primary">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">PhishGuard AI</h1>
              <p className="text-xs text-muted-foreground">Adaptive Ensemble Detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3 text-safe animate-pulse-glow" />
            <span>System Active</span>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-8"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="gradient-text">Detect Phishing</span>
            <br />
            <span className="text-foreground">Before It's Too Late</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Powered by an adaptive ensemble of Random Forest, Logistic Regression & XGBoost.
            Real-time URL analysis with feature-level explainability.
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
              Check
            </button>
          </div>
        </motion.div>

        {/* Scanning Animation */}
        <AnimatePresence>
          {scanning && <ScanAnimation />}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !scanning && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Alert Banner */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`rounded-2xl p-6 border ${
                  isPhishing
                    ? "bg-danger/5 border-danger/30 glow-danger"
                    : "bg-safe/5 border-safe/30 glow-safe"
                }`}
              >
                <div className="flex items-start gap-4">
                  {isPhishing ? (
                    <ShieldAlert className="w-10 h-10 text-danger shrink-0" />
                  ) : (
                    <ShieldCheck className="w-10 h-10 text-safe shrink-0" />
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className={`text-xl font-bold ${isPhishing ? "text-danger" : "text-safe"}`}>
                      {isPhishing ? "⚠️ Phishing Detected" : "✅ Website Appears Legitimate"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    {safeSuggestion && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-safe/10 border border-safe/20">
                        <Sparkles className="w-4 h-4 text-safe" />
                        <span className="text-sm text-safe">
                          Did you mean: <a href={safeSuggestion} className="font-mono underline">{safeSuggestion}</a>?
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Risk Score + Models Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Risk Score + Features */}
                <div className="space-y-6">
                  <div className="glass rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      Risk Assessment
                    </h3>
                    <RiskScoreBar score={result.riskScore} />
                  </div>

                  <div className="glass rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Feature Analysis
                    </h3>
                    {riskFactors.map((f, i) => (
                      <FeatureRow key={f.label} label={f.label} value={f.value} risk={f.risk} index={i} />
                    ))}
                  </div>
                </div>

                {/* Right: Models + History */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      Model Predictions
                    </h3>
                    <div className="grid gap-3">
                      {result.models.map((m, i) => (
                        <ModelCard key={m.name} model={m} index={i} />
                      ))}
                    </div>
                    {result.accuracy && (
                      <div className="glass rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Training Accuracy</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { name: "RF", acc: result.accuracy.rf },
                            { name: "LR", acc: result.accuracy.lr },
                            { name: "XGB", acc: result.accuracy.xgb },
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

                  <HistoryPanel entries={history} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History when no result */}
        {!result && !scanning && history.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <HistoryPanel entries={history} />
          </div>
        )}

        {/* Features overview when idle */}
        {!result && !scanning && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4"
          >
            {[
              { icon: Brain, title: "Ensemble ML", desc: "3 models with weighted voting" },
              { icon: Layers, title: "Feature Analysis", desc: "8+ URL features extracted" },
              { icon: Shield, title: "Real-time", desc: "Instant phishing detection" },
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

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-6 text-center text-xs text-muted-foreground">
        PhishGuard AI — Phishing Website Detection using Adaptive Ensemble Learning
      </footer>
    </div>
  );
};

export default Index;
