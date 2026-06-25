import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const brl = (n: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

export const dateBR = (d: string | Date | null | undefined, fmt = "dd/MM/yyyy") =>
  d ? format(new Date(d), fmt, { locale: ptBR }) : "—";

export const dateTimeBR = (d: string | Date | null | undefined) =>
  d ? format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";

export const initials = (s?: string | null) =>
  (s ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
