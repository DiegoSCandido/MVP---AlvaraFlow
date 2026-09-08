# AlvaraFlow

Sistema de acompanhamento de **alvarás, licenças e taxas de funcionamento** de empresas — o tipo de controle que hoje costuma viver em planilhas dentro de escritórios contábeis.

MVP full-stack em TypeScript: API REST em Express + Prisma e SPA em React. Roda inteiro na máquina, sem serviço externo: banco SQLite em arquivo e anexos em disco.

> **Dados:** todo o conteúdo do banco é gerado pelo `seed`. As empresas não existem, os CNPJs são números sintéticos com dígito verificador calculado só para as validações passarem, e nenhum dado real de cliente é usado ou distribuído neste repositório.

---

## O problema

Alvará não é um documento único: uma mesma empresa acumula alvará de funcionamento, bombeiros, sanitário, licença ambiental, laudo acústico — cada um com órgão emissor, prazo e ciclo de renovação próprios. Perder um vencimento significa multa ou interdição.

O sistema responde a três perguntas, que são as três telas principais:

1. **O que vence agora?** — vigência calculada a partir das datas, com destaque para o que vence em até 30 dias.
2. **Onde cada processo travou?** — o alvará ainda não emitido tem um andamento próprio (aguardando cliente, aguardando órgão, protocolado, aguardando pagamento).
3. **A taxa anual foi paga?** — controle da guia por cliente e por ano, em três etapas sequenciais.

## Decisões de modelagem

- **Vigência é derivada, nunca gravada.** `pending` / `valid` / `expiring` / `expired` saem das datas de emissão e validade no momento da leitura ([`domain.ts`](apps/api/src/lib/domain.ts)). Guardar o status no banco significaria um job para envelhecer registros e a garantia de que alguma linha ficaria desatualizada.
- **Duas dimensões de estado, não uma.** A vigência do documento (`status`) e o andamento do processo (`processingStatus` / `andamento`) são independentes: um alvará vigente pode estar em renovação, e um vencido pode estar protocolado.
- **Datas comparadas em UTC.** As datas trafegam em ISO à meia-noite UTC e são formatadas pelos componentes UTC. Converter para o fuso local deslocaria o dia em qualquer fuso negativo — o caso do Brasil.
- **A tela de taxas é orientada a cliente, não a taxa.** Ela lista todo cliente ativo do ano e anexa a guia quando existe; sem isso, quem nunca teve guia emitida simplesmente sumiria da lista — exatamente quem precisa aparecer.
- **Três flags, não um enum.** `gerada` / `enviada` / `paga` são etapas cumulativas; a situação exibida é derivada delas, do estágio mais avançado ao inicial.

## Stack

| Camada  | Tecnologias |
| ------- | ----------- |
| API     | Node 20+, Express 4, TypeScript, Prisma 6 (SQLite), Zod, JWT, bcrypt, Multer |
| Web     | React 18, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS, shadcn/ui, Recharts |
| Repo    | npm workspaces |

## Como rodar

Requisitos: Node 20+ e npm 10+. Nada mais — sem Docker, sem banco para subir, sem compilação nativa.

```bash
git clone https://github.com/<usuario>/alvaraflow.git
cd alvaraflow

cp apps/api/.env.example apps/api/.env     # Windows: copy apps\api\.env.example apps\api\.env

npm run setup      # instala as dependências, cria o banco e popula a demo
npm run dev        # API em :3333 e web em :5173
```

Abra <http://localhost:5173> e entre com:

```
admin@alvaraflow.dev / Demo@1234     (administrador)
analista@alvaraflow.dev / Demo@1234  (perfil comum, sem a aba Usuários)
```

Para recriar o banco do zero a qualquer momento: `npm run db:reset`.

### Scripts

| Comando | O que faz |
| ------- | --------- |
| `npm run dev` | Sobe API e frontend juntos |
| `npm run build` | Compila os dois pacotes |
| `npm run typecheck` | Checagem de tipos em ambos |
| `npm run db:reset` | Recria o schema e roda o seed |
| `npm run db:studio -w @alvaraflow/api` | Prisma Studio para inspecionar o banco |

## Estrutura

```
apps/
  api/
    prisma/schema.prisma      modelo de dados
    prisma/seed.ts            gerador da base de demonstração
    src/lib/domain.ts         vocabulário e regra de vigência
    src/middleware/           auth (JWT), upload, tratamento de erro
    src/modules/              auth, users, clientes, alvaras, taxas, documentos, dashboard
  web/
    src/lib/api.ts            cliente HTTP tipado
    src/lib/status.ts         rótulos e cores dos estados
    src/components/           layout, badges, formulários
    src/pages/                Login, Dashboard, Clientes, Alvaras, Taxas, Usuarios
```

Cada módulo da API segue o mesmo formato: `*.schema.ts` (validação Zod na borda), `*.repository.ts` (consultas e serialização) e `*.routes.ts` (HTTP). Erros conhecidos — Zod, Multer, unicidade do Prisma — viram resposta JSON estável no [handler central](apps/api/src/middleware/error-handler.ts).

## API

Todas as rotas exigem `Authorization: Bearer <token>`, exceto `/api/health`, `/api/auth/login` e `/api/auth/register`.

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| `POST` | `/api/auth/login` | Autentica e devolve o JWT (limitado a 10 tentativas / 15 min por IP) |
| `GET` | `/api/auth/me` | Usuário da sessão |
| `PUT` | `/api/auth/change-password` | Troca a própria senha |
| `GET` | `/api/clientes` | Lista com `busca`, `uf` e `situacao` |
| `POST` `PUT` `DELETE` | `/api/clientes/:id` | CRUD de clientes |
| `GET` | `/api/alvaras` | Lista com `busca`, `tipo`, `status`, `clienteId` |
| `POST` | `/api/alvaras/:id/finalizar` | Registra emissão/validade e encerra o andamento |
| `GET` | `/api/taxas?ano=2026` | Uma linha por cliente ativo, com resumo do ano |
| `PUT` | `/api/taxas` | Cria ou atualiza a guia do par (cliente, ano) |
| `POST` | `/api/documentos/upload` | Anexa arquivos a um cliente **ou** a um alvará |
| `GET` | `/api/dashboard` | Contadores, distribuição por tipo e prioridades |

## Segurança

Práticas aplicadas, na medida que um MVP comporta:

- Senhas com bcrypt; o hash nunca sai do servidor (`toPublicUser` monta a resposta campo a campo).
- Login com mensagem única para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
- Rate limit no login, `helmet` e CORS restrito por origem.
- Validação Zod em toda entrada, incluindo dígito verificador do CNPJ.
- Upload com allowlist de MIME, limite de tamanho e nome de arquivo opaco gerado pelo servidor; o download resolve o caminho e confere o prefixo antes de ler.

Limitação conhecida: excluir um cliente ou alvará remove os registros de anexo em cascata, mas os arquivos correspondentes permanecem no disco — a limpeza depende de uma rotina que este MVP não tem.

O que um deploy real exigiria a mais: refresh token com rotação, `httpOnly cookie` no lugar de `localStorage`, auditoria de alterações, storage de objetos no lugar do disco local e Postgres no lugar do SQLite.

## Licença

MIT — veja [LICENSE](LICENSE).
