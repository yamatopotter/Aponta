# Evora Ponto

App interno da Evora Farma para funcionários justificarem faltas/atrasos, pedirem
ajustes de ponto em qualquer data, abrirem chamados com o RH — e para o RH
revisar, aprovar/reprovar e responder tudo isso num painel (tabela ou kanban).

## Como isso se encaixa com o RHiD

O RHiD continua sendo **a fonte da verdade** para marcações de ponto e para o
cálculo de horas (apuração). Este app:

- **Lê** a apuração já processada (`GET /apuracao_ponto`) e o cadastro de
  pessoas (`GET /person`) do RHiD.
- **Não escreve** de volta no RHiD. A API pública de integração do RHiD não
  tem endpoint para criar/editar marcação de ponto nem para criar uma
  justificativa vinculada a um funcionário — só para consultar
  (`POST /justifications` é uma consulta com filtros, não uma criação) e para
  gerenciar os *tipos* de justificativa.

Por isso, quando o RH aprova algo aqui, isso fica registrado **só no banco
deste app**. O lançamento final no RHiD continua manual, na tela de
"Atribuições em massa" do próprio RHiD. Se algum dia a Control iD liberar um
endpoint de escrita, é só trocar a implementação em `src/lib/rhid.ts` — o
resto do sistema não precisa mudar.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma + PostgreSQL** — banco próprio do app (não é o banco do RHiD)
- **Tailwind CSS**
- Autenticação própria via cookie assinado (JWT com `jose`), sem depender de
  provedor externo

## Configurando o ambiente

### 1. Banco de dados

```bash
docker compose up -d          # sobe um Postgres local em :5432
cp .env.example .env
```

Edite o `.env` e gere os segredos:

```bash
openssl rand -base64 32   # -> AUTH_SECRET
openssl rand -hex 32      # -> APP_ENCRYPTION_KEY
```

### 2. Credencial de integração do RHiD

Peça ao suporte RHiD/Control iD **um usuário de integração dedicado**
(não o login pessoal de um admin) com permissão de leitura sobre `Person` e
`Apuração de Ponto`. Preencha no `.env`:

```
RHID_INTEGRATION_EMAIL=...
RHID_INTEGRATION_PASSWORD=...
```

### 3. Instalar dependências e preparar o banco

```bash
npm install
npx prisma migrate dev --name init   # cria as tabelas
npm run prisma:seed                  # cria admin/admin + categorias de chamado padrão
```

### 4. Rodar

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Login

Existem dois perfis, na mesma tela (`/login`), em abas:

- **Funcionário** — CPF + senha. No **primeiro acesso**, a senha provisória é
  o próprio CPF (só números); o sistema força a troca de senha antes de
  liberar o resto do app. Se o CPF não existir ainda no cache local, o
  backend confirma direto no RHiD (`GET /person`) antes de recusar.
- **RH / Administrador** — usuário e senha. Login padrão criado pela seed:
  **usuário `admin`, senha `admin`** — também com troca de senha obrigatória
  no primeiro acesso.

⚠️ **Nota de segurança sobre o login por CPF**: CPF não é um segredo (várias
pessoas na empresa podem conhecer o CPF de um colega), por isso ele funciona
como *identificador*, nunca como senha sozinho — sempre em conjunto com uma
senha local que o próprio funcionário define no primeiro acesso. Vale avaliar
mais à frente adicionar um segundo fator (SMS/e-mail) se o app passar a expor
dados mais sensíveis.

## Configurando o Zoho (envio de e-mail)

1. Crie um app em [api-console.zoho.com](https://api-console.zoho.com) do
   tipo **Server-based Applications**.
2. Defina o Redirect URI como `http://localhost:3000/api/integrations/zoho/callback`
   (ou o domínio de produção equivalente).
3. No app, vá em **RH → Configurações → Zoho**, preencha Client ID/Secret e
   salve.
4. Clique em **Conectar com Zoho** — isso abre a tela de consentimento; ao
   aceitar, o app volta com a conta conectada (tokens ficam criptografados no
   banco, nunca em texto puro).

O envio de e-mail em si (`src/lib/zoho.ts` → `sendZohoEmail`) já está pronto
para uso, mas ainda **não está disparado automaticamente** em nenhum evento —
o próximo passo natural é chamá-lo dentro das rotas de aprovação/reprovação
de justificativa e de resposta de chamado (`src/app/api/justificativas/[id]/route.ts`
e `src/app/api/chamados/[id]/route.ts`), assim que a conta Zoho Mail e o
`accountId` de envio forem confirmados.

## Estrutura

```
prisma/schema.prisma       modelo de dados (não é o schema do RHiD)
src/lib/rhid.ts             cliente do RHiD (login de integração, person, apuração)
src/lib/zoho.ts             OAuth + envio de e-mail via Zoho Mail
src/lib/auth.ts             sessão (cookie JWT) para os dois perfis
src/lib/crypto.ts           criptografia dos segredos do Zoho em repouso
src/middleware.ts           protege /admin e /ponto|/chamados por perfil

src/app/login                    tela de login (funcionário/admin)
src/app/(employee)/ponto         funcionário: minhas justificativas + pedir ajuste
src/app/(employee)/chamados      funcionário: chamados com o RH
src/app/admin/justificativas     RH: aprovar/reprovar (tabela ou kanban)
src/app/admin/chamados           RH: responder chamados (tabela ou kanban)
src/app/admin/configuracoes/zoho RH: configurar OAuth do Zoho

src/app/api/...              todas as rotas de API (auth, justificativas,
                              chamados, categorias, RHiD, Zoho)
```

## O que ainda falta (próximos passos sugeridos)

- **Upload real de anexo** — hoje o modelo `Anexo` já existe, mas as telas
  ainda não têm um input de arquivo funcional (precisa decidir onde
  armazenar: S3, disco local, etc.).
- **Sincronização periódica de funcionários** — `syncEmployeesFromRhid()`
  existe em `src/lib/rhid.ts`, mas ainda não está agendada (dá pra rodar via
  cron, GitHub Action agendada, ou um botão manual em
  `/admin/configuracoes`).
- **Notificação por e-mail automática** ao aprovar/reprovar ou responder
  (ver seção do Zoho acima).
- **Exportação para lançamento manual no RHiD** — um botão em
  "Justificativas aprovadas" que gera um CSV/lista pronta para colar na tela
  de Atribuições em massa do RHiD, reduzindo o trabalho manual descrito no
  topo deste README.
- **Fidelidade visual total aos mockups HTML** — as telas aqui priorizaram
  estar funcionalmente corretas (dados reais do banco, decisões que
  persistem); refinar pixel a pixel para bater 100% com os protótipos
  visuais é um ajuste incremental de CSS a partir daqui.
