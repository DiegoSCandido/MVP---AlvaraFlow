import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { unauthorized } from "../../lib/http-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { changePasswordSchema, loginSchema, registerSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

export const authRoutes = Router();

/** Limite por IP para reduzir tentativa de forca bruta no login. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

authRoutes.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    res.json(await authService.login(input));
  }),
);

authRoutes.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    res.status(201).json(await authService.register(input));
  }),
);

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized();
    res.json(authService.toPublicUser(user));
  }),
);

authRoutes.put(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.status(204).send();
  }),
);
