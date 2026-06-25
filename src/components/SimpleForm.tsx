import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
  step?: string;
  placeholder?: string;
  col?: 1 | 2;
};

export function SimpleForm({
  fields, initial, onSubmit, busy, children,
}: {
  fields: Field[];
  initial: any;
  onSubmit: (values: any) => Promise<void> | void;
  busy?: boolean;
  children?: ReactNode;
}) {
  const [v, setV] = useState<any>(() => initial ?? {});
  useEffect(() => { setV(initial ?? {}); }, [initial]);

  const set = (n: string, val: any) => setV((s: any) => ({ ...s, [n]: val }));

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const clean: any = { ...v };
        fields.forEach((f) => {
          if (f.type === "number" && clean[f.name] !== undefined && clean[f.name] !== "") {
            clean[f.name] = Number(clean[f.name]);
          }
          if (clean[f.name] === "") clean[f.name] = null;
        });
        await onSubmit(clean);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name} className={`space-y-1 ${f.col === 2 ? "col-span-2" : ""}`}>
            <Label>{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</Label>
            {f.type === "textarea" ? (
              <Textarea value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} required={f.required} />
            ) : f.type === "select" ? (
              <Select value={v[f.name] ?? ""} onValueChange={(val) => set(f.name, val)}>
                <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Selecione..."} /></SelectTrigger>
                <SelectContent>
                  {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={f.type ?? "text"}
                step={f.step}
                value={v[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                required={f.required}
                placeholder={f.placeholder}
              />
            )}
          </div>
        ))}
      </div>
      {children}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin mr-2" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}
