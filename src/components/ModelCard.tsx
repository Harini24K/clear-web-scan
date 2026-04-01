import { motion } from "framer-motion";
import type { ModelPrediction } from "@/lib/ensembleModel";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface ModelCardProps {
  model: ModelPrediction;
  index: number;
}

const ModelCard = ({ model, index }: ModelCardProps) => {
  const isPhishing = model.prediction === "phishing";
  const Icon = isPhishing ? ShieldAlert : ShieldCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.15 }}
      className={`glass rounded-lg p-4 ${isPhishing ? "border-danger/30" : "border-safe/30"}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-md ${isPhishing ? "bg-danger/10" : "bg-safe/10"}`}>
          <Icon className={`w-4 h-4 ${isPhishing ? "text-danger" : "text-safe"}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{model.name}</p>
          <p className="text-xs text-muted-foreground">Weight: {(model.weight * 100).toFixed(0)}%</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isPhishing ? "bg-danger/10 text-danger" : "bg-safe/10 text-safe"
        }`}>
          {isPhishing ? "Phishing" : "Legitimate"}
        </span>
        <span className="text-sm font-mono text-muted-foreground">{model.confidence}%</span>
      </div>
    </motion.div>
  );
};

export default ModelCard;
