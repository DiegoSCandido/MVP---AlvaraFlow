import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { conflict, unauthorized } from "../../lib/http-error.js";
import { assinarToken, type AuthUser } from "../../middleware/auth.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const SALT_ROUNDS = 10;

export function hashSenha(senha: string) {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

/** Representacao publica do usuario — nunca expoe o hash da senha. */
export function toPublicUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  ativo: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as AuthUser["role"],
    ativo: user.ativo,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  };
}

export async function login({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Mensagem unica para e-mail inexistente e senha errada: nao revela quais e-mails existem.
  if (!user || !user.ativo || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized("E-mail ou senha invalidos");
  }

  const token = assinarToken({ id: user.id, email: user.email, role: user.role as AuthUser["role"] });

  return { token, user: toPublicUser(user), mustChangePassword: user.mustChangePassword };
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase();

  if (await prisma.user.findUnique({ where: { email } })) {
    throw conflict("Ja existe um usuario com esse e-mail");
  }

  const user = await prisma.user.create({
    data: {
      email,
      fullName: input.fullName,
      role: input.role ?? "USER",
      passwordHash: await hashSenha(input.password),
    },
  });

  return toPublicUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw unauthorized("Senha atual incorreta");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashSenha(newPassword), mustChangePassword: false },
  });
}
