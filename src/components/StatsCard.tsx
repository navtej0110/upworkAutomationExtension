import { type LucideIcon } from "lucide-react";

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color = "text-zinc-600",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-zinc-50 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900">{value}</p>
          <p className="text-sm text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
