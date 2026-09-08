/**
 * Popula o banco de demonstracao.
 *
 * Todos os dados sao ficticios e gerados por este arquivo: as empresas nao
 * existem e os CNPJs sao numeros sinteticos com digito verificador calculado,
 * apenas para as validacoes do sistema passarem. Nada aqui vem de base real.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** PRNG deterministico (mulberry32): o mesmo seed gera sempre a mesma demo. */
function criarRandom(seed: number) {
  let estado = seed >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = criarRandom(20260908);

const escolher = <T,>(itens: readonly T[]): T => itens[Math.floor(random() * itens.length)];
const inteiro = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
const talvez = (probabilidade: number) => random() < probabilidade;

function digitoVerificador(base: string, pesoInicial: number): number {
  let peso = pesoInicial;
  let soma = 0;
  for (const char of base) {
    soma += Number(char) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Monta um CNPJ sintetico valido a partir de um numero sequencial. */
function cnpjFicticio(sequencial: number): string {
  const base = String(sequencial).padStart(8, "0") + "0001";
  const dv1 = digitoVerificador(base, 5);
  const dv2 = digitoVerificador(`${base}${dv1}`, 6);
  return `${base}${dv1}${dv2}`;
}

function dataRelativa(diasAPartirDeHoje: number): Date {
  const data = new Date();
  data.setUTCHours(0, 0, 0, 0);
  data.setUTCDate(data.getUTCDate() + diasAPartirDeHoje);
  return data;
}

// --- Vocabulario ficticio -------------------------------------------------

const PREFIXOS = [
  "Aurora", "Bonanza", "Cordilheira", "Dunas", "Encosta", "Farol", "Girassol",
  "Horizonte", "Ilhota", "Jacaranda", "Lagoa", "Manancial", "Nevoa", "Oliveira",
  "Palmeira", "Quartzo", "Recife", "Sabia", "Trilha", "Ubatuba", "Videira",
] as const;

const NUCLEOS = [
  "Comercio", "Servicos", "Industria", "Distribuidora", "Logistica", "Alimentos",
  "Engenharia", "Tecnologia", "Transportes", "Confeccoes", "Metalurgia", "Saude",
] as const;

const SUFIXOS = ["LTDA", "ME LTDA", "EIRELI", "SLU"] as const;

/** Codigos CNAE reais (tabela publica IBGE/CONCLA) usados como exemplo. */
const ATIVIDADES = [
  { codigo: "4712-1/00", descricao: "Comercio varejista de mercadorias em geral" },
  { codigo: "5611-2/01", descricao: "Restaurantes e similares" },
  { codigo: "6201-5/01", descricao: "Desenvolvimento de programas de computador sob encomenda" },
  { codigo: "4930-2/02", descricao: "Transporte rodoviario de carga intermunicipal" },
  { codigo: "8630-5/03", descricao: "Atividade medica ambulatorial restrita a consultas" },
  { codigo: "4744-0/99", descricao: "Comercio varejista de materiais de construcao em geral" },
  { codigo: "1091-1/02", descricao: "Fabricacao de produtos de padaria e confeitaria" },
  { codigo: "9602-5/01", descricao: "Cabeleireiros, manicure e pedicure" },
  { codigo: "4120-4/00", descricao: "Construcao de edificios" },
  { codigo: "4530-7/03", descricao: "Comercio a varejo de pecas e acessorios para veiculos" },
  { codigo: "2512-8/00", descricao: "Fabricacao de esquadrias de metal" },
  { codigo: "8599-6/04", descricao: "Treinamento em desenvolvimento profissional e gerencial" },
] as const;

/** Municipios reais (dado publico) apenas para dar realismo as telas. */
const MUNICIPIOS = [
  { municipio: "Florianopolis", uf: "SC" },
  { municipio: "Sao Jose", uf: "SC" },
  { municipio: "Palhoca", uf: "SC" },
  { municipio: "Biguacu", uf: "SC" },
  { municipio: "Blumenau", uf: "SC" },
  { municipio: "Joinville", uf: "SC" },
  { municipio: "Itajai", uf: "SC" },
  { municipio: "Criciuma", uf: "SC" },
  { municipio: "Curitiba", uf: "PR" },
  { municipio: "Porto Alegre", uf: "RS" },
] as const;

const TIPOS_ALVARA = [
  "Alvara de Funcionamento",
  "Alvara dos Bombeiros",
  "Alvara Sanitario",
  "Licenciamento Ambiental",
  "Laudo Acustico",
  "Alvara da Policia Civil",
] as const;

const PROCESSING_STATUS_PENDENTES = [
  "aguardando_cliente",
  "aguardando_orgao",
  "renovacao",
] as const;

const ANDAMENTOS = [
  "protocolado",
  "aguardando_cliente",
  "aguardando_orgao",
  "aguardando_pagamento",
  "finalizado",
] as const;

const TIPOS_ISENTAVEIS: readonly string[] = [
  "Alvara de Funcionamento",
  "Alvara Sanitario",
  "Alvara dos Bombeiros",
];

const TOTAL_CLIENTES = 24;

async function main() {
  console.log("Limpando dados anteriores...");
  await prisma.documento.deleteMany();
  await prisma.taxaFuncionamento.deleteMany();
  await prisma.alvara.deleteMany();
  await prisma.atividadeSecundaria.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando usuarios de demonstracao...");
  const senhaHash = await bcrypt.hash("Demo@1234", 10);
  await prisma.user.createMany({
    data: [
      {
        email: "admin@alvaraflow.dev",
        fullName: "Administrador Demo",
        role: "ADMIN",
        passwordHash: senhaHash,
      },
      {
        email: "analista@alvaraflow.dev",
        fullName: "Analista Demo",
        role: "USER",
        passwordHash: senhaHash,
      },
    ],
  });

  console.log(`Criando ${TOTAL_CLIENTES} clientes ficticios...`);
  const anoAtual = new Date().getFullYear();

  for (let i = 0; i < TOTAL_CLIENTES; i += 1) {
    const prefixo = PREFIXOS[i % PREFIXOS.length];
    const nucleo = escolher(NUCLEOS);
    const local = escolher(MUNICIPIOS);
    const atividade = escolher(ATIVIDADES);

    const ativo = talvez(0.88);
    const semAtividade = ativo && talvez(0.1);

    const secundarias = Array.from({ length: inteiro(0, 2) }, () => escolher(ATIVIDADES))
      .filter((a) => a.codigo !== atividade.codigo)
      // O par (cliente, codigo) e unico: descarta repeticoes do sorteio.
      .filter((a, indice, lista) => lista.findIndex((o) => o.codigo === a.codigo) === indice);

    const cliente = await prisma.cliente.create({
      data: {
        cnpj: cnpjFicticio(10_000_000 + i * 37),
        razaoSocial: `${prefixo} ${nucleo} ${escolher(SUFIXOS)}`,
        nomeFantasia: `${prefixo} ${nucleo}`,
        municipio: local.municipio,
        uf: local.uf,
        atividadePrincipalCodigo: atividade.codigo,
        atividadePrincipalDescricao: atividade.descricao,
        ativo,
        semAtividade,
        isNovo: ativo && talvez(0.15),
        atividadesSecundarias: {
          create: secundarias.map((a) => ({ codigo: a.codigo, descricao: a.descricao })),
        },
      },
    });

    // Cada cliente recebe de 1 a 4 tipos de alvara distintos.
    const tipos = [...TIPOS_ALVARA].sort(() => random() - 0.5).slice(0, inteiro(1, 4));

    for (const tipo of tipos) {
      const emitido = talvez(0.72);
      const requestDate = dataRelativa(-inteiro(60, 900));

      // Distribui vencimentos entre vencido, vencendo (ate 30 dias) e vigente.
      const sorteio = random();
      const diasParaVencer =
        sorteio < 0.18 ? -inteiro(1, 180) : sorteio < 0.38 ? inteiro(0, 30) : inteiro(45, 700);

      const issueDate = emitido ? dataRelativa(-inteiro(30, 400)) : null;
      const expirationDate = emitido && talvez(0.9) ? dataRelativa(diasParaVencer) : null;

      const processingStatus = emitido
        ? talvez(0.2)
          ? "renovacao"
          : "lancado"
        : escolher(PROCESSING_STATUS_PENDENTES);

      await prisma.alvara.create({
        data: {
          clienteId: cliente.id,
          tipo,
          requestDate,
          issueDate,
          expirationDate,
          processingStatus,
          andamento:
            emitido && processingStatus === "lancado" ? "finalizado" : escolher(ANDAMENTOS),
          isento: talvez(0.12) && TIPOS_ISENTAVEIS.includes(tipo),
          semPontoFixo: talvez(0.08),
          protocoloPrefeitura:
            tipo === "Alvara de Funcionamento" ? `${anoAtual}/${inteiro(1000, 9999)}` : null,
          notes: talvez(0.25) ? "Registro de demonstracao gerado pelo seed." : null,
        },
      });
    }

    // Taxa de funcionamento do ano corrente para a maioria dos clientes ativos.
    if (ativo && talvez(0.8)) {
      const enviada = talvez(0.75);
      const paga = enviada && talvez(0.6);

      await prisma.taxaFuncionamento.create({
        data: {
          clienteId: cliente.id,
          ano: anoAtual,
          gerada: true,
          enviada,
          paga,
          protocolo: `TX-${anoAtual}-${String(i + 1).padStart(3, "0")}`,
          valor: Number((inteiro(18000, 95000) / 100).toFixed(2)),
          dataEnvio: enviada ? dataRelativa(-inteiro(20, 120)) : null,
          dataPagamento: paga ? dataRelativa(-inteiro(1, 19)) : null,
        },
      });
    }
  }

  const [clientes, alvaras, taxas] = await Promise.all([
    prisma.cliente.count(),
    prisma.alvara.count(),
    prisma.taxaFuncionamento.count(),
  ]);

  console.log(`\nPronto: ${clientes} clientes, ${alvaras} alvaras, ${taxas} taxas.`);
  console.log("Login de demonstracao: admin@alvaraflow.dev / Demo@1234");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
