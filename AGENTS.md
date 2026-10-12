# AGENTS.md - Guia para Agentes de IA

Este documento é a fonte da verdade para agentes de IA trabalhando no **Aponta**. **Leia este arquivo primeiro** antes de iniciar qualquer tarefa. Visão técnica mais profunda (modelo de dados, fluxos, referência de API) em [docs/ARQUITETURA.md](./docs/ARQUITETURA.md); setup e configuração em [README.md](./README.md).

## 1. Visão geral

Aponta é uma camada de **workflow e aprovação** sobre o sistema de ponto real da empresa (RHiD/Control iD). Ele não mede nem calcula horas — isso continua sendo responsabilidade do RHiD, que é a fonte da verdade para marcações e apuração. O que o Aponta resolve:

- Funcionário registra uma **justificativa** (falta, atraso, sem saída, ajuste) ou um pedido de ajuste para uma data específica.
- Funcionário abre um **chamado** com o RH em uma categoria pré-definida.
- RH/Admin revisa tudo isso em um painel (tabela ou kanban), aprova/reprova justificativas e responde chamados, com um dashboard de indicadores como porta de entrada.
- O app **lê** do RHiD (apuração já processada, cadastro de pessoas, empresas e departamentos) mas **não escreve de volta** — a API pública do RHiD não tem endpoint para isso. O lançamento final continua manual, na tela de "Atribuições em massa" do próprio RHiD.

Funcionário autentica só com CPF (sem senha); Admin/RH autentica com usuário+senha ou Zoho OAuth, com dois níveis (`RH` e `ADMIN`). Ver seção 2 de [docs/ARQUITETURA.md](./docs/ARQUITETURA.md) para o detalhamento de perfis e rotas protegidas.

## 2. Stack tecnológica

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript (strict mode)
- **Estilização**: Tailwind CSS + shadcn/ui (Radix), `class-variance-authority`
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma (schema em `prisma/schema.prisma`, migrations em `prisma/migrations/`)
- **Autenticação**: sessão própria via cookie `evora_session` (JWT assinado com `jose`, `src/lib/auth.ts`) — sem NextAuth/Auth0. Login de funcionário só por CPF; login de admin por usuário+senha ou Zoho OAuth (`src/lib/zoho.ts`)
- **Integração externa**: RHiD/Control iD (`src/lib/rhid.ts`, ver README para detalhes da API) — sincronização rodando tanto sob demanda quanto em processo separado (`worker/sync-worker.ts`)
- **PDF**: `pdfkit` · **Gráficos**: `recharts`
- **Testes**: Playwright (`tests/ux-audit/`) — testes de fluxo e auditoria de UX/acessibilidade (`@axe-core/playwright`), não há testes unitários no momento
- **Lint/Formatação**: `next lint` (ESLint via config padrão do Next.js)
- **Gerenciador de pacotes**: `npm` (há `package-lock.json` — não introduza `pnpm`/`yarn`)
- **Execução de scripts**: scripts padrão do `package.json` (`npm run <script>`) — não há task runner (`mise`/`Tilt`) neste projeto
- **Deploy**: Docker (`Dockerfile`, `docker-compose.prod.yml`, `docker-entrypoint.sh`) — não há Fly.io

## 3. Estrutura de diretórios (`src/`)

Alias `@/*` aponta para `src/*`.

- `src/app`: rotas e páginas (App Router)
  - `src/app/(employee)`: área do funcionário (`/ponto`, `/chamados`)
  - `src/app/admin`: área de RH/Admin (`/admin/dashboard`, `/admin/justificativas`, `/admin/chamados`, `/admin/folha`, `/admin/funcionarios`, `/admin/configuracoes`, `/admin/administradores`)
  - `src/app/api`: Route Handlers (`route.ts`) — não há Server Actions neste projeto, toda mutação/consulta passa por API routes
- `src/components`: componentes React
  - `src/components/ui`: componentes shadcn/ui
  - `src/components/admin`: componentes específicos da área admin
- `src/lib`: acesso a dados e lógica de negócio — não há camada `src/repo`/`src/services` separada; rotas de API chamam `@/lib/prisma` e os módulos de domínio diretamente
  - `auth.ts` (sessão/JWT, `requireAdmin`/`requireNivelAdmin`), `prisma.ts` (client), `rhid.ts` (integração RHiD), `zoho.ts` (OAuth admin), `folha.ts` (regras da folha de ponto), `storage.ts` (anexos), `crypto.ts`, `rhid.ts`, `utils.ts` (inclui `cn()`)
- `src/middleware.ts`: autenticação por rota (Edge runtime — não importa de `src/lib/auth.ts` porque este usa `next/headers`; a leitura do JWT está duplicada ali, ver comentário no arquivo)
- `prisma/`: `schema.prisma`, `migrations/`, `seed.ts`
- `worker/`: `sync-worker.ts` — processo separado (fora do Next.js) que roda a sincronização com o RHiD em loop
- `tests/ux-audit/`: specs Playwright
- `docs/`: `ARQUITETURA.md`, página de demonstração (`index.html`), docs de integrações (`docs/integrations/`, ex. swagger do RHiD)

## 4. Fluxo de desenvolvimento

### Scripts (`package.json`, via `npm run`)

```bash
npm run dev              # next dev
npm run build             # build de produção
npm run start             # next start
npm run lint               # next lint
npm run prisma:migrate    # prisma migrate dev
npm run prisma:seed        # popula dados iniciais (tsx prisma/seed.ts)
npm run prisma:studio      # Prisma Studio
npm run worker:sync        # roda o worker de sincronização com o RHiD
```

Não use `pnpm`/`yarn`/`npx` — use `npm`/scripts do `package.json` diretamente (`npx` só aparece dentro do `docker-entrypoint.sh` para produção).

### Banco de dados

- Edite `prisma/schema.prisma`, gere a migration com `npx prisma migrate dev --name <nome_descritivo>`, revise o SQL em `prisma/migrations/`.
- Use enums do Prisma para campos com valores fechados (ver `NivelAdmin`, `JustificativaStatus`, `ChamadoStatus` etc. em `prisma/schema.prisma`).
- Nunca edite migrations já aplicadas em produção.
- Em produção, migrations são aplicadas via `prisma migrate deploy` (ver `docker-entrypoint.sh`), não `migrate dev`.

### Variáveis de ambiente

- Este projeto usa `.env` (não validado via Zod em `src/env.ts` — acesse com `process.env` diretamente onde necessário, seguindo o padrão já usado em `src/lib`).
- Configuração de integrações (Zoho, RHiD, folha) tem parte em variáveis de ambiente e parte editável pela tela `/admin/configuracoes` (ver models `ZohoConfig`, `RhidConfig`, `FolhaConfig` em `prisma/schema.prisma`) — ao adicionar uma nova config de integração, prefira o padrão já existente (tabela editável no admin) a criar uma env var nova, salvo para segredos de infraestrutura.
- Nunca commite `.env` com segredos reais; use `.env.example`/`.env.production.example` como referência de quais chaves existem.

## 5. Convenções de código

### Nomenclatura de arquivos

- **kebab-case** na maioria dos arquivos (`route.ts`, `folha.ts`, `use-tiposjustificativa.ts` seria o ideal, mas hooks existentes usam camelCase — `useTiposJustificativa.ts`, `useUnidades.ts`; siga o padrão do arquivo vizinho ao decidir)
- Sem pseudo-extensões (`.service.ts`, `.repository.ts`) — nomes diretos (`folha.ts`, não `folha-service.ts`)
- Estrutura flat: evite aninhamento desnecessário

### TypeScript & Zod

- Validação de entrada em API routes com Zod, schema local ao arquivo (ver `createSchema` em `src/app/api/justificativas/route.ts`) — não é obrigatório expor tipo com mesmo nome no barrel, já que não há barrel files neste projeto
- Enums de domínio vivem no Prisma schema (`enum` nativo do Prisma), não como `as const`/`z.enum` no TypeScript — ao validar um desses campos em um schema Zod, use `z.nativeEnum` ou `z.enum([...])` com os mesmos valores do Prisma
- `interface` para objetos/estruturas de dados; `type` para unions e props de componente React (`type Props = {...}`, ou `type NomeDoComponenteProps` se houver mais de um componente no arquivo)
- Campos opcionais: `prop?: T` em vez de `prop: T | null`, exceto quando o schema do Prisma usa coluna `NULL` explícita

### Importações

- Sempre `@/` para arquivos internos (`@/lib/prisma`, `@/lib/auth`, `@/components/ui/button`), nunca caminho relativo entre `src/app` e `src/lib`/`src/components`
- Dentro do mesmo diretório, imports relativos são aceitáveis

### API Routes (Route Handlers)

- Retorno padronizado de erro: `NextResponse.json({ error: '<mensagem>' }, { status: <code> })`; sucesso retorna o dado diretamente (sem envelope `{ success, data }`) — siga o padrão já usado nas rotas existentes em `src/app/api/**/route.ts`
- Toda rota autenticada começa checando a sessão (`getSession()`/`requireAdmin()`/`requireNivelAdmin()` de `@/lib/auth.ts`) e retornando 401/403 cedo
- Regras de negócio específicas de um domínio (folha, RHiD, storage de anexos) ficam em `src/lib/<dominio>.ts`, não espalhadas nas rotas

### Comentários

- Em **português**. Termos técnicos em inglês são aceitáveis
- Só o "porquê" (motivação, workaround, regra de negócio não óbvia) — nunca o "o quê". O código existente já segue isso bem (ver `src/middleware.ts`, `src/lib/rhid.ts`) — mantenha o padrão
- Sem blocos JSDoc extensos, sem comentários numerados de passos, sem comentários redundantes com o nome da variável/função

### Logging

- Preferir `console.error`/`console.warn` com contexto (mensagem + dados relevantes) para erros de integração (RHiD, Zoho) — não há logger estruturado (`pino` ou similar) configurado neste projeto. Se introduzir um, centralize em `src/lib` e documente aqui

### Testes

- Playwright, specs em `tests/ux-audit/*.spec.ts` — cobrem fluxos de UI e acessibilidade (admin e colaborador), não é uma suíte de testes unitários
- Não há Vitest/Jest configurado. Se uma tarefa exigir testes unitários (lógica pura em `src/lib`), pergunte ao usuário antes de introduzir um novo framework de teste no projeto
- Banco de dados real para os specs Playwright (`tests/ux-audit/auth.setup.ts` prepara sessão de admin)

### UI e design system

- Dark mode: verificar se `next-themes` está em uso antes de assumir — o tema atual do projeto é definido via Tailwind (`tailwind.config.ts`), confirme o padrão atual antes de adicionar toggle de tema
- Micro-interações discretas (`active:scale-95`, `hover:shadow-md`) sem exagerar em cores vibrantes — prioridade é clareza e feedback visual
- Sempre verifique `src/components/ui` antes de criar um novo componente shadcn/ui
- Use `cn()` (de `@/lib/utils`) para merge condicional de classes Tailwind
- Acessibilidade: contraste mínimo WCAG AA, navegação por teclado, `aria-label`/`aria-current` quando aplicável — reforçado pelos testes Playwright com `@axe-core/playwright`

### Git & commits

- Mensagens em português, foco no "porquê", frase direta (ex.: `Corrige data da justificativa aparecendo um dia antes`) — o histórico deste projeto **não** usa prefixo de Conventional Commits (`feat:`/`fix:`); siga o padrão observado no `git log` em vez de introduzir prefixos novos
- Sem gitmoji

## 6. Filosofia

- Fluxo principal (happy path) óbvio e linear; esconda complexidade em auxiliares (`src/lib/<dominio>.ts`)
- Funções cabem em ~60-80 linhas; extraia blocos lógicos maiores
- Prefira a solução mais simples e legível — evite over-engineering. Este projeto é deliberadamente simples (sem camada de repositório/serviço, sem ORM abstraído atrás de outra camada) — não introduza essas camadas sem necessidade concreta
- **Bibliotecas prontas antes de reimplementar**: só escreva na mão o que for realmente específico do domínio (regras de ponto/folha, integração RHiD/Zoho)

## 7. Instruções para agentes

1. Leia `AGENTS.md` (este arquivo) e `docs/ARQUITETURA.md` ao iniciar uma sessão
2. Use `npm` conforme instruído — nunca `pnpm`/`yarn`, nunca um task runner que não exista no projeto
3. Mantenha consistência com o estilo existente; corrija inconsistências ao encontrá-las, mas não migre padrões de arquitetura (ex.: introduzir camada de repositório) sem alinhar com o usuário antes
4. Não commite segredos. `.env` não é versionado
5. Rode `npm run lint` ao final de cada tarefa relevante

## 8. Skills e configuração por assistente

| Arquivo                   | Papel                                 |
| ------------------------- | ------------------------------------- |
| `AGENTS.md`               | Fonte única da verdade                |
| `CLAUDE.md`               | Referencia `AGENTS.md`                |
| `.agents/skills/`         | Skills compartilhados                 |
| `.agents/rules/`          | Rules automáticas                     |
| `.agents/mcp_config.json` | MCP servers                           |
| `.agents/mcp/github.sh`   | Wrapper do MCP github (token via env) |

Skills disponíveis em `.agents/skills/<skill>/SKILL.md`: `prep`, `devx`, `check`, `fix`, `new-test`, `db-migrate`, `deps-upgrade`, `pre-pr`, `shadcn`, `new-task`. Todos foram herdados de outro projeto (Saúde Turbo) e adaptados ao stack real do Aponta (npm em vez de pnpm/mise, Prisma em vez de Drizzle) — se encontrar uma instrução de skill que não bate com o projeto, corrija o arquivo em vez de seguir a instrução desatualizada.
