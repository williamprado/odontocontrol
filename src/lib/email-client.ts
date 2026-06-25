import { enviarEmail } from "./clinica-admin.functions";

export async function sendWelcomeEmail(args: { to: string; nome_admin: string; clinica: string; senha: string; link_publico: string }) {
  return enviarEmail({
    data: {
      to: args.to,
      subject: `Bem-vindo ao OdontoControl AI — ${args.clinica}`,
      template: "welcome_admin",
      data: args as any,
    },
  });
}

export async function sendBookingConfirmation(args: { to: string; paciente: string; clinica: string; data: string; hora: string; procedimento: string; profissional: string; protocolo: string }) {
  return enviarEmail({
    data: {
      to: args.to,
      subject: `Agendamento confirmado — ${args.clinica}`,
      template: "booking_confirmation",
      data: args as any,
    },
  });
}

export async function sendPasswordResetEmail(args: { to: string; nova_senha: string }) {
  return enviarEmail({
    data: {
      to: args.to,
      subject: "Sua senha de acesso foi redefinida",
      template: "password_reset",
      data: args as any,
    },
  });
}
