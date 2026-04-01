import { motion } from "framer-motion";
import { Clock, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";

export interface HistoryEntry {
  url: string;
  prediction: "phishing" | "legitimate";
  riskScore: number;
  timestamp: Date;
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
}

const HistoryPanel = ({ entries }: HistoryPanelProps) => {
  if (entries.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No URLs checked yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Scan History
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {entries.map((entry, i) => {
          const isPhishing = entry.prediction === "phishing";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border ${
                isPhishing ? "border-danger/20" : "border-safe/20"
              }`}
            >
              {isPhishing ? (
                <ShieldAlert className="w-4 h-4 text-danger shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-safe shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground truncate">{entry.url}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <span className={`text-xs font-bold font-mono ${isPhishing ? "text-danger" : "text-safe"}`}>
                {entry.riskScore}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;
