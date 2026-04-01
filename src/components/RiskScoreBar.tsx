import { motion } from "framer-motion";

interface RiskScoreBarProps {
  score: number;
  animated?: boolean;
}

const RiskScoreBar = ({ score, animated = true }: RiskScoreBarProps) => {
  const color =
    score > 65 ? "bg-danger" : score > 35 ? "bg-warning" : "bg-safe";
  const glowClass =
    score > 65 ? "glow-danger" : score > 35 ? "" : "glow-safe";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Risk Score</span>
        <span className={`text-2xl font-bold font-mono ${score > 65 ? "text-danger" : score > 35 ? "text-warning" : "text-safe"}`}>
          {score}%
        </span>
      </div>
      <div className={`h-3 rounded-full bg-secondary overflow-hidden ${glowClass}`}>
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={animated ? { width: 0 } : undefined}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default RiskScoreBar;
