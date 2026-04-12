import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnalysisModuleProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  index: number;
}

const AnalysisModule = ({ icon, title, children, index }: AnalysisModuleProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 * index }}
    className="glass rounded-xl p-5 space-y-3"
  >
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {children}
  </motion.div>
);

export default AnalysisModule;
