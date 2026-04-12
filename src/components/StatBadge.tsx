interface StatBadgeProps {
  label: string;
  value: string;
  status?: "good" | "warning" | "danger" | "neutral";
}

const StatBadge = ({ label, value, status = "neutral" }: StatBadgeProps) => {
  const colors = {
    good: "bg-safe/10 text-safe border-safe/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    neutral: "bg-secondary text-foreground border-border/30",
  };

  return (
    <div className={`rounded-lg p-3 border ${colors[status]}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-bold font-mono">{value}</p>
    </div>
  );
};

export default StatBadge;
