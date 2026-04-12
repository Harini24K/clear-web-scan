import { motion } from "framer-motion";
import type { TrustFactor } from "@/lib/websiteAnalysis";

interface TrustFactorRowProps {
  factor: TrustFactor;
  index: number;
}

const TrustFactorRow = ({ factor, index }: TrustFactorRowProps) => {
  const barColor =
    factor.status === "good" ? "bg-safe" : factor.status === "warning" ? "bg-warning" : "bg-danger";
  const textColor =
    factor.status === "good" ? "text-safe" : factor.status === "warning" ? "text-warning" : "text-danger";
  const bgColor =
    factor.status === "good" ? "bg-safe/5" : factor.status === "warning" ? "bg-warning/5" : "bg-danger/5";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className={`rounded-lg p-3 ${bgColor} border border-border/30`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{factor.category}</span>
          <span className="text-sm font-semibold text-foreground">{factor.label}</span>
        </div>
        <span className={`text-sm font-bold font-mono ${textColor}`}>{factor.score}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${factor.score}%` }}
          transition={{ duration: 0.8, delay: 0.05 * index }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{factor.detail}</p>
    </motion.div>
  );
};

export default TrustFactorRow;
