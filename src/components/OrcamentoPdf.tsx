// Layout de impressão A4 para orçamento, usado com window.print()
import { brl, dateBR } from "@/lib/format";

export type OrcamentoPdfData = {
  clinica?: { nome?: string; cnpj?: string | null; telefone?: string | null; email?: string | null };
  orcamento: any;
};

export function OrcamentoPdf({ data }: { data: OrcamentoPdfData }) {
  const o = data.orcamento;
  const itens: any[] = Array.isArray(o.itens) ? o.itens : [];
  return (
    <div className="orc-pdf p-8 max-w-3xl mx-auto bg-white text-black">
      <style>{`@media print { body { background: white; } .no-print { display: none !important; } @page { margin: 14mm; } }`}</style>
      <header className="flex justify-between border-b pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold">{data.clinica?.nome ?? "Clínica"}</h1>
          <div className="text-xs text-gray-600">
            {data.clinica?.cnpj && <div>CNPJ: {data.clinica.cnpj}</div>}
            {data.clinica?.telefone && <div>Tel: {data.clinica.telefone}</div>}
            {data.clinica?.email && <div>{data.clinica.email}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">ORÇAMENTO</div>
          <div className="text-xs">Nº {o.numero ?? "—"}</div>
          <div className="text-xs">Data: {dateBR(o.data)}</div>
          <div className="text-xs">Validade: {dateBR(o.validade)}</div>
        </div>
      </header>

      <section className="mb-4">
        <div className="text-xs uppercase text-gray-500">Paciente</div>
        <div className="font-medium">{o.paciente_nome}</div>
      </section>

      <table className="w-full text-sm mb-4 border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2 w-16">Qtd</th>
            <th className="text-right py-2 w-28">Valor</th>
            <th className="text-right py-2 w-28">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {itens.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-400">Sem itens</td></tr>}
          {itens.map((it, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{it.nome ?? it.descricao}</td>
              <td className="text-right">{it.qtd ?? 1}</td>
              <td className="text-right">{brl(it.valor)}</td>
              <td className="text-right">{brl((it.valor ?? 0) * (it.qtd ?? 1))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-64 text-sm space-y-1">
        <Row k="Total" v={brl(o.total)} />
        {Number(o.desconto_pct) > 0 && <Row k={`Desconto (${o.desconto_pct}%)`} v={`- ${brl(Number(o.total) - Number(o.total_com_desconto ?? o.total))}`} />}
        <Row k="Total final" v={brl(o.total_com_desconto ?? o.total)} bold />
        <Row k="Parcelas" v={`${o.parcelas}x de ${brl(Number(o.total_com_desconto ?? o.total) / Math.max(1, o.parcelas))}`} />
      </div>

      {o.observacoes && <div className="mt-6 text-sm"><div className="font-medium">Observações</div><div className="text-gray-700">{o.observacoes}</div></div>}

      <footer className="mt-12 pt-12 grid grid-cols-2 gap-8 text-xs">
        <div className="border-t pt-2 text-center">Assinatura do paciente</div>
        <div className="border-t pt-2 text-center">Assinatura do responsável</div>
      </footer>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: any; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-base border-t pt-1" : ""}`}>
      <span>{k}</span><span>{v}</span>
    </div>
  );
}
