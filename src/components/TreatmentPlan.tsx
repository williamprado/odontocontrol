// Plano de tratamento: lista de etapas para um tratamento.
import { brl, dateBR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function TreatmentPlan({ tratamento }: { tratamento: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Cell k="Paciente" v={tratamento.paciente_nome} />
        <Cell k="Profissional" v={tratamento.profissional_nome} />
        <Cell k="Início" v={dateBR(tratamento.data_inicio)} />
        <Cell k="Conclusão" v={dateBR(tratamento.data_conclusao)} />
        <Cell k="Dente/Local" v={tratamento.dente} />
        <Cell k="Status" v={<Badge>{tratamento.status}</Badge>} />
        <Cell k="Valor total" v={brl(tratamento.valor_total)} />
      </div>
      <div>
        <div className="font-medium text-sm mb-1">Descrição</div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tratamento.descricao}</p>
      </div>
      {tratamento.observacoes && (
        <div>
          <div className="font-medium text-sm mb-1">Observações</div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tratamento.observacoes}</p>
        </div>
      )}
    </div>
  );
}

function Cell({ k, v }: { k: string; v: any }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{k}</div>
      <div>{v ?? "—"}</div>
    </div>
  );
}
