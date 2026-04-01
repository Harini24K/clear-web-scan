import { motion } from "framer-motion";

interface FeatureRowProps {
  label: string;
  value: number;
  risk: "low" | "medium" | "high";
  index: number;
}

const FeatureRow = ({ label, value, risk, index }: FeatureRowProps) => {
  const barColor =
    risk === "high" ? "bg-danger" : risk === "medium" ? "bg-warning" : "bg-safe";
  const textColor =
    risk === "high" ? "text-danger" : risk === "medium" ? "text-warning" : "text-safe";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center gap-4 py-2"
    >
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, delay: 0.1 * index }}
        />
      </div>
      <span className={`text-xs font-medium uppercase w-16 text-right ${textColor}`}>{risk}</span>
    </motion.div>
  );
};

export default FeatureRow;
