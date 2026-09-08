import { z } from "zod";

/** Regras minimas de senha aplicadas no cadastro e na troca de senha. */
export const senhaSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiuscula")
  .regex(/[a-z]/, "A senha deve conter ao menos uma letra minuscula")
  .regex(/\d/, "A senha deve conter ao menos um numero");

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(1, "Informe a senha"),
});

export const registerSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: senhaSchema,
  fullName: z.string().min(3, "Informe o nome completo"),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: senhaSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
