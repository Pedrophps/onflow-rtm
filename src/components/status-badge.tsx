
import { Badge } from "@/components/ui/badge";
import { OnboardingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: OnboardingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs = {
    pendente: {
      label: "Pendente",
      icon: Clock,
      className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
    },
    em_revisao: {
      label: "Em Revisão",
      icon: AlertCircle,
      className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
    concluida: {
      label: "Concluída",
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    },
  };

  const { label, icon: Icon, className: variantClasses } = configs[status];

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 font-medium py-0.5 px-2", variantClasses, className)}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
