import { useAuth } from "@/lib/auth";
import { differenceInCalendarDays } from "date-fns";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function TrialBanner() {
  const { clinica } = useAuth();
  if (!clinica) return null;

  if (clinica.status_cobranca === "suspenso") {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center gap-2">
        <AlertCircle className="size-4" />
        Clínica suspensa por inadimplência.
        <Link to="/app/Configuracoes" search={{ tab: "cobranca" } as any} className="underline ml-auto">Regularizar</Link>
      </div>
    );
  }
  if (clinica.status_cobranca === "inadimplente") {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-sm flex items-center gap-2">
        <AlertTriangle className="size-4" />
        Pagamento em atraso.
        <Link to="/app/Configuracoes" search={{ tab: "cobranca" } as any} className="underline ml-auto">Pagar agora</Link>
      </div>
    );
  }
  if (clinica.status === "trial" && clinica.trial_ate) {
    const days = differenceInCalendarDays(new Date(clinica.trial_ate), new Date());
    if (days <= 3 && days >= 0) {
      return (
        <div className="bg-yellow-400 text-yellow-950 px-4 py-2 text-sm flex items-center gap-2">
          <Clock className="size-4" />
          Seu período de teste termina em {days} dia{days !== 1 && "s"}.
          <Link to="/app/Configuracoes" search={{ tab: "cobranca" } as any} className="underline ml-auto">Assinar</Link>
        </div>
      );
    }
  }
  return null;
}
