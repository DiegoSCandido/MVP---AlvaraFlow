import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../lib/http-error.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { toPublicUser } from "../auth/auth.service.js";

export const usersRoutes = Router();

usersRoutes.use(requireAuth, requireAdmin);

usersRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    res.json(users.map(toPublicUser));
  }),
);

usersRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw badRequest("Um administrador nao pode excluir a propria conta");
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
