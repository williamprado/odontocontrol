import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label, value, icon, hint,
}: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          {icon && <span className="text-primary">{icon}</span>}
        </div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
