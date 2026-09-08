import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { calcularStatus, diasAteVencimento } from "../../lib/domain.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

const LIMITE_PROXIMOS_VENCIMENTOS = 10;

dashboardRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [clientesAtivos, clientesInativos, alvaras] = await Promise.all([
      prisma.cliente.count({ where: { ativo: true } }),
      prisma.cliente.count({ where: { ativo: false } }),
      prisma.alvara.findMany({
        include: { cliente: { select: { id: true, razaoSocial: true, cnpj: true } } },
        orderBy: { expirationDate: "asc" },
      }),
    ]);

    const comStatus = alvaras.map((alvara) => ({
      ...alvara,
      status: calcularStatus(alvara),
      diasParaVencer: diasAteVencimento(alvara.expirationDate),
    }));

    const porTipo = comStatus.reduce<Record<string, number>>((acc, alvara) => {
      acc[alvara.tipo] = (acc[alvara.tipo] ?? 0) + 1;
      return acc;
    }, {});

    res.json({
      clientes: { ativos: clientesAtivos, inativos: clientesInativos },
      alvaras: {
        total: comStatus.length,
        validos: comStatus.filter((a) => a.status === "valid").length,
        vencendo: comStatus.filter((a) => a.status === "expiring").length,
        vencidos: comStatus.filter((a) => a.status === "expired").length,
        pendentes: comStatus.filter((a) => a.status === "pending").length,
      },
      porTipo,
      proximosVencimentos: comStatus
        .filter((a) => a.status === "expiring" || a.status === "expired")
        .slice(0, LIMITE_PROXIMOS_VENCIMENTOS)
        .map((a) => ({
          id: a.id,
          tipo: a.tipo,
          status: a.status,
          expirationDate: a.expirationDate,
          diasParaVencer: a.diasParaVencer,
          cliente: a.cliente,
        })),
    });
  }),
);
