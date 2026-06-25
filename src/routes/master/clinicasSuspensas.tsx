import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/master/clinicasSuspensas")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["master-susp"],
    queryFn: async () => (await supabase.from("clinica").select("*").in("status_cobranca", ["suspenso", "inadimplente"]).order("updated_at", { ascending: false })).data ?? [],
  });

  const reativar = async (id: string) => {
    const { error } = await supabase.from("clinica").update({ status_cobranca: "ativo" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Reativada"); qc.invalidateQueries({ queryKey: ["master-susp"] }); }
  };

  return (
    <>
      <PageHeader title="Clínicas suspensas / inadimplentes" />
      <DataTable
        rows={rows as any[]}
        searchKeys={["nome" as any, "owner_email" as any]}
        columns={[
          { key: "nome", header: "Nome" },
          { key: "owner_email", header: "Owner" },
          { key: "status_cobranca", header: "Status", render: (r: any) => <Badge variant="destructive">{r.status_cobranca}</Badge> },
          { key: "updated_at", header: "Desde", render: (r: any) => dateBR(r.updated_at) },
          { key: "_a", header: "", className: "w-32 text-right", render: (r: any) => (
            <Button size="sm" onClick={() => reativar(r.id)}>Reativar</Button>
          )},
        ]}
      />
    </>
  );
}
