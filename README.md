# Aponta

App interno da Evora Farma para funcionários justificarem faltas/atrasos, pedirem
ajustes de ponto em qualquer data, abrirem chamados com o RH — e para o RH
revisar, aprovar/reprovar e responder tudo isso num painel (tabela ou kanban),
com um dashboard de indicadores como porta de entrada.

▶️ [Página de demonstração](https://yamatopotter.github.io/Aponta/) — visão geral
do produto e das telas, sem dados reais (ver `docs/index.html`).

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

### Detalhes da API do RHiD que não são óbvios

A doc oficial (`docs/integrations/rhid-swagger.json`, salva no repo) tem duas
pegadinhas que já causaram bug aqui:

- O `basePath` da API é `/v2/api.svc`, não só `/v2` — a base URL salva em
  `RhidConfig` (aba RHiD de `/admin/configuracoes`) precisa terminar em
  `/api.svc`.
- `GET /apuracao_ponto` (e `POST /justifications`) retornam o corpo como uma
  **string JSON dentro da resposta**, não como array direto — precisa de um
  segundo `JSON.parse` (já tratado em `src/lib/rhid.ts`).

## Empresas, departamentos e sincronização

Além de pessoas, o app sincroniza empresas (`GET /company`) e departamentos
(`GET /department`) do RHiD para as tabelas locais `Empresa` e `Departamento`
— é o cadastro real que alimenta o campo "unidade" de cada funcionário
(`Employee.unidade`, copiado do departamento no momento da sincronização) e
os filtros por unidade em Justificativas/Chamados/Funcionários.

A ordem importa: `syncEmpresasEDepartamentos()` precisa rodar antes de
`syncEmployeesFromRhid()`, pra existir o departamento a resolver. Use sempre
`syncTudoDoRhid()` (em `src/lib/rhid.ts`), que já faz isso na ordem certa —
é o que o botão "Sincronizar agora" e o worker chamam.

**Atualização periódica**: `worker/sync-worker.ts` é um processo separado
(fora do Next.js) que roda `syncTudoDoRhid()` em loop, dormindo
`SYNC_INTERVAL_MINUTES` (padrão 6h) entre uma rodada e outra. Suba com:

```bash
npm run worker:sync
```

Isso é um processo de longa duração — rode como um serviço à parte (systemd,
um dyno/worker separado, um container, um `screen`/`tmux` num servidor),
**não** dentro do processo do `next dev`/`next start`. Ele lê o mesmo `.env`
(`DATABASE_URL`, credencial do RHiD) e loga cada rodada no stdout.

⚠️ **`GET /company` e `GET /department` estão retornando 500 no RHiD desta
conta**, testado batendo a requisição exatamente como a doc oficial
descreve (mesmo header, mesmo formato) — o problema é do lado do RHiD, não
da nossa chamada. `syncTudoDoRhid()` já lida com isso: se
`syncEmpresasEDepartamentos()` falhar, a sincronização de funcionários
continua normalmente (só fica sem `unidade` preenchida até o RHiD resolver).
O resultado da sincronização mostra `estruturaErro` quando isso acontece. Se
precisar que `unidade` funcione, vale abrir chamado com o suporte
RHiD/Control iD perguntando por que esses dois endpoints erroram — o resto
da integração (login, `/person`, `/apuracao_ponto`) funciona normalmente com
a mesma credencial.

## Folha de ponto e assinatura do funcionário

Em "Meu Ponto" o funcionário tem duas abas: **Espelho da folha** (apuração
real do RHiD via `GET /apuracao_ponto` do período vigente, com botão para
confirmar com um clique que está tudo certo — `AssinaturaFolha`, um registro
por funcionário/período, não é assinatura criptográfica) e **Justificativas**
(pedidos avulsos, com uma lista de "divergências" — dias entre o início do
período e hoje que o RHiD sinalizou com pendência e que ainda não têm
justificativa, cada um com atalho direto pra abrir o formulário já com a data
preenchida). O RH acompanha quem já confirmou a folha em **Folha de Ponto**, e
configura o dia de fechamento do período na aba **Folha** de **Configurações**
(ex.: fechamento dia 20 → a folha de julho cobre 21/06 a 20/07 — ver
`src/lib/folha.ts`). O cadastro sincronizado do RHiD (nome, CPF, unidade)
fica listado em **Funcionários**, com busca e filtro por unidade.

## Dashboard de indicadores

`/admin` abre direto em **Dashboard** (`src/app/admin/dashboard/page.tsx`), a
tela padrão pro RH desde que loga — antes caía em Justificativas. Reúne, com
filtro de período (últimos 30/90 dias ou mês corrente):

- Justificativas por status e por tipo, e chamados por status.
- Tempo médio de resposta dos chamados (`Chamado.respondidoEm - createdAt`).
- Top departamentos por ocorrência de falta/atraso, e funcionários com
  pendência recorrente (≥3 ocorrências no período).
- Confirmações da folha do período vigente (reaproveita `src/lib/folha.ts`).

Tudo calculado em `GET /api/admin/dashboard` (agregações via Prisma
`groupBy`), acessível a qualquer ADMIN (RH ou nível ADMIN — mesmo nível de
Justificativas/Chamados/Folha/Funcionários). Os gráficos usam `recharts`; as
cores de status (pendente/aprovado/reprovado, aberto/andamento/concluído)
são as mesmas dos badges em `src/components/ui/badge.tsx`, pra não ter uma
paleta nova só pro dashboard.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma + PostgreSQL** — banco próprio do app (não é o banco do RHiD)
- **Tailwind CSS** + `recharts` (gráficos do Dashboard)
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
`Apuração de Ponto`. Base URL e e-mail já vêm com valor padrão desde a
primeira migration (`RhidConfig`) — só falta a senha, que é secreta e não
tem padrão. Duas formas de preenchê-la, a que for mais conveniente:

- Pela aba **RHiD** em **RH → Configurações** (`/admin/configuracoes?tab=rhid`)
  — fica salva criptografada no banco (`RhidConfig`), com botões para testar
  a conexão e disparar `syncEmployeesFromRhid()` manualmente. O resultado da
  sincronização é o que aparece em **Funcionários**.
- Ou no `.env`, como fallback se a tela acima não tiver sido preenchida:

```
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

## Deploy em produção

A imagem publicada é `matheuspbarreto/aponta` ([Docker Hub](https://hub.docker.com/r/matheuspbarreto/aponta))
— uma única imagem serve dois papéis, escolhidos pelo comando passado ao
container (ver `docker-entrypoint.sh`):

- `web` — aplica migrations pendentes (`prisma migrate deploy`) e sobe o
  Next.js.
- `worker` — roda o worker de sincronização com o RHiD (loop contínuo, ver
  `worker/sync-worker.ts`).

`docker-compose.prod.yml` já orquestra os três serviços (banco, app, worker).

### Itens necessários antes de subir

1. **Docker + Docker Compose** no servidor.
2. **`docker-compose.prod.yml`** e **`.env.production.example`** (copie os
   dois deste repo pro servidor — não precisa clonar o repo inteiro, só
   esses dois arquivos).
3. **`.env.production`** preenchido a partir do `.example` — em especial:
   - `POSTGRES_PASSWORD` — senha nova, não a de dev (`openssl rand -base64 24`).
   - `AUTH_SECRET` — `openssl rand -base64 32`. **Trocar isso em produção
     invalida todas as sessões ativas** (funcionários/RH são deslogados).
   - `APP_ENCRYPTION_KEY` — `openssl rand -hex 32`. Criptografa em repouso
     as credenciais do RHiD e os tokens do Zoho salvos no banco. **Trocar
     isso depois de já ter configurado RHiD/Zoho pela tela quebra a
     configuração salva** (fica impossível descriptografar) — precisa
     reconfigurar as duas abas em `/admin/configuracoes`.
   - RHiD/Zoho (client ID/secret, credencial de integração) podem ficar em
     branco aqui e ser configurados depois pela UI (`/admin/configuracoes`).
     O login via Zoho OAuth não usa nenhuma variável de ambiente — o
     redirect_uri é calculado a partir da própria requisição (respeitando
     `X-Forwarded-Host`/`X-Forwarded-Proto` atrás de um reverse proxy); o app
     Zoho no console deles precisa ter `{seu-domínio}/api/auth/zoho/callback`
     cadastrado como Redirect URI — ver aba Zoho de `/admin/configuracoes`.
4. **Reverse proxy na frente** (nginx, Caddy, Traefik, etc.) — o container só
   escuta HTTP puro na porta 3000. TLS é fortemente recomendado antes de ir
   pra produção de verdade (senha e sessão trafegam em texto claro sem ele),
   mas não é estritamente exigido pelo app: o cookie de sessão só fica
   `secure` quando a requisição realmente chega em HTTPS (via
   `X-Forwarded-Proto`), então funciona em HTTP puro pra teste inicial.
5. **Volume persistente para `uploads/`** — já vem configurado no
   `docker-compose.prod.yml` (`aponta_uploads`), mas se for rodar sem esse
   compose (ex.: outro orquestrador), não esquecer: sem isso, todo anexo de
   mensagem de chamado some no próximo deploy/restart do container.
6. **Backup do volume do Postgres** (`aponta_pgdata`) — é o único dado que
   realmente importa preservar; o app inteiro é reconstruível a partir da
   imagem + banco.
7. **Usuário de integração do RHiD** dedicado (mesma orientação da seção
   acima, item 2) — sem isso a sincronização de funcionários/empresas não
   funciona (nem a tela de Ponto do funcionário).

### Subindo

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Isso já aplica as migrations e roda o seed automaticamente (parte do
entrypoint do serviço `web`, a cada start — é idempotente, não duplica nem
sobrescreve o que já existe). Já sobe com `admin`/`admin` (nível Admin, com
troca de senha obrigatória no 1º login) e as categorias de chamado padrão.

### Atualizando para uma versão nova

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Migrations novas são aplicadas automaticamente no restart do serviço `web`
(mesmo entrypoint). O worker não precisa restart manual — o compose já
recria os três serviços que tiverem imagem nova.

## Login

Existem dois perfis, na mesma tela (`/login`), em abas:

- **Funcionário** — só CPF, sem senha. Se o CPF não existir ainda no cache
  local, o backend confirma direto no RHiD (`GET /person`) antes de recusar.
- **RH / Administrador** — dois jeitos de entrar (ver "Login via Zoho OAuth"
  abaixo): usuário e senha (login padrão criado pela seed: **usuário `admin`,
  senha `admin`**, com troca de senha obrigatória no primeiro acesso), ou
  clicando em "Entrar com Zoho" se a conta foi cadastrada só com e-mail. Esse
  perfil tem dois **níveis** (ver seção abaixo).

### Dois níveis de admin: RH e Admin

`AdminUser.nivel` (`RH` ou `ADMIN`) controla o que a pessoa vê, checado tanto
no `src/middleware.ts` quanto em cada rota de API sensível
(`requireNivelAdmin()` em `src/lib/auth.ts`):

| Nível | Acesso |
|---|---|
| `RH` (padrão pra quem é criado) | Justificativas, Chamados, Folha de Ponto, Funcionários — só atendimento |
| `ADMIN` | Tudo do RH **+** Configurações (RHiD/Folha/Zoho) **+** Administradores |

O admin da seed (`admin`/`admin`) já nasce com nível `ADMIN`, pra sempre
existir alguém capaz de configurar o sistema e criar os próximos usuários.
Gerencie outros administradores em **RH → Administradores** (nível Admin
apenas): criar, trocar nível, desativar (nunca é excluído de verdade — tem
histórico de justificativas/chamados amarrado à conta) e resetar senha (gera
uma senha temporária mostrada **uma única vez** na tela, pra repassar por um
canal seguro). O sistema recusa remover o último admin de nível `ADMIN`
ativo, pra não trancar a configuração do sistema pra sempre.

### Login via Zoho OAuth (além de usuário/senha)

Em **RH → Administradores**, ao criar um admin dá pra escolher entre dois
caminhos — **usuário e senha** (como sempre) ou **só um e-mail**, sem senha
nenhuma: essa pessoa entra clicando em **"Entrar com Zoho"** na tela de
login, que abre o consentimento do Zoho e volta autenticada. O e-mail que o
Zoho devolve é conferido contra `AdminUser.email`; **se não bater com
nenhuma conta cadastrada (ou a conta estiver desativada), o acesso é
recusado** — a pessoa volta pro `/login` com um aviso, nenhuma sessão é
criada.

Usa o Client ID/Secret configurados na aba Zoho de **RH → Configurações**
(esse é o único uso do Zoho no app hoje — não envia e-mail). **No Zoho API
Console, cadastre a URL de redirect no app**:

```
http://localhost:3000/api/auth/zoho/callback
```

(troque `localhost:3000` pelo domínio/IP real de produção — a própria aba
Zoho de Configurações mostra a URL exata a cadastrar).

⚠️ **Isso não foi testado contra uma conta Zoho de verdade** — diferente da
integração com o RHiD (onde bati a implementação contra a doc oficial e uma
conta real), o endpoint de identidade do Zoho (`/oauth/v2/userinfo`) e os
nomes dos campos (`Email`, `Display_Name`) em `exchangeZohoLoginCode()`
(`src/lib/zoho.ts`) vieram do conhecimento geral da API do Zoho. Teste o
fluxo completo com uma conta Zoho real antes de contar com isso em produção
— se os campos vierem com nomes diferentes, o ajuste é só nessa função.

⚠️ **Nota de segurança sobre o login por CPF**: CPF não é um segredo (várias
pessoas na empresa podem conhecer o CPF de um colega) — decisão consciente de
priorizar simplicidade de acesso do funcionário sobre esse risco, já que o
app só expõe as próprias justificativas/chamados de quem loga, nada de
terceiros. Se o app passar a expor dados mais sensíveis, vale revisitar isso
(voltar a exigir uma senha, ou adicionar um segundo fator por SMS/e-mail).

## Configurando o Zoho (login de admin)

1. Crie um app em [api-console.zoho.com](https://api-console.zoho.com) do
   tipo **Server-based Applications**.
2. Defina o Redirect URI exatamente como a aba **Zoho** de **RH →
   Configurações** mostra (`{seu-domínio}/api/auth/zoho/callback`).
3. Ainda nessa aba, preencha Client ID/Secret e salve.
4. Cadastre o e-mail de cada admin que vai usar esse login em **RH →
   Administradores** (modo "Zoho", sem senha) — o e-mail que o Zoho devolver
   precisa bater com um `AdminUser.email` ativo.

Notificação por e-mail (aprovação/reprovação de justificativa, resposta de
chamado) ainda não existe — quando for implementada, a ideia é usar SMTP, não
o Zoho (o Zoho aqui serve só pra login).

## Estrutura

```
prisma/schema.prisma        modelo de dados (não é o schema do RHiD)
src/lib/rhid.ts              cliente do RHiD (login de integração, person, apuração)
src/lib/folha.ts             cálculo do período da folha a partir do dia de fechamento
src/lib/zoho.ts              OAuth do Zoho pro login de admin (identidade, sem envio de e-mail)
src/lib/auth.ts              sessão (cookie JWT) para os dois perfis
src/lib/crypto.ts            criptografia dos segredos do RHiD/Zoho em repouso
src/middleware.ts            protege /admin e /ponto|/chamados por perfil
docs/integrations/rhid-swagger.json   doc oficial da API do RHiD

src/app/login                    tela de login (funcionário/admin)
src/app/(employee)/ponto         funcionário: aba Espelho da folha + aba Justificativas
src/app/(employee)/chamados      funcionário: chamados com o RH
src/app/admin/dashboard          RH: indicadores (tela padrão de /admin)
src/app/admin/justificativas     RH: aprovar/reprovar (tabela ou kanban)
src/app/admin/chamados           RH: responder chamados (tabela ou kanban)
src/app/admin/folha              RH: quem já confirmou a folha do período
src/app/admin/funcionarios       RH: lista do cache local sincronizado do RHiD
src/app/admin/configuracoes      nível ADMIN: RHiD, Folha e Zoho, em abas
  (?tab=rhid|folha|zoho)         (ver src/components/admin/configuracoes/*)
src/app/admin/administradores    nível ADMIN: criar/gerenciar outros admins
src/components/admin/dashboard/  StatCard, BreakdownBarChart (recharts), RankingTable

worker/sync-worker.ts        processo separado, sincroniza com o RHiD em loop

src/app/api/auth/zoho/           login via Zoho OAuth (authorize/callback)
src/app/api/admin/dashboard/     agregações (groupBy) que alimentam o Dashboard

src/app/api/...              todas as rotas de API (auth, justificativas,
                              chamados, categorias, folha, funcionários,
                              departamentos, administradores, RHiD, Zoho)

docs/index.html               página de demonstração (GitHub Pages), sem dados reais
```

## Documentação técnica

Para arquitetura, modelo de dados (ER), fluxos (login, justificativa) e
referência completa dos endpoints de API, veja
[docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Página de demonstração (GitHub Pages)

`docs/index.html` é uma landing page estática (HTML/CSS puro, sem build,
sem dependência externa) que segue a mesma identidade visual do app —
paleta "Botânico Farmacêutico" (`tailwind.config.ts`/`globals.css`), o
mesmo `LogoMark` e o mesmo tom das telas reais — pra apresentar o produto
sem expor tela real nem dado de funcionário/RH de verdade (os números e
nomes ali são fictícios, de propósito).

Pra publicar: **Settings → Pages → Source: Deploy from a branch → Branch:
`main` / `docs`** no repositório do GitHub. Depois disso o GitHub Pages
publica em `https://<usuário>.github.io/<repo>/` a cada push que tocar
`docs/index.html`.

## O que ainda falta (próximos passos sugeridos)

- **Anexos em mensagens de chamado ficam em disco local (`uploads/`, fora de
  `public/`), não em S3/blob storage** — funciona bem pra um único servidor,
  mas não escala pra múltiplas instâncias sem disco compartilhado. Se isso
  virar um problema, `src/lib/storage.ts` é o único arquivo a trocar (só ele
  sabe onde/como salvar — o resto do app só conhece `Anexo.url`, um caminho
  relativo). Abertura de chamado e justificativas ainda não têm upload
  (só as mensagens da conversa de chamado).
- **`cargo` do funcionário ainda não é preenchido pela sincronização** —
  diferente de `unidade` (agora resolvida via `Departamento`, ver seção
  acima), o `PersonDTO` do RHiD não traz o cargo diretamente; teria que vir
  de `GET /personroles` e ser cruzado por pessoa. Não mexi nisso agora, só na
  unidade — que era o que foi pedido.
- **Notificação por e-mail automática** ao aprovar/reprovar ou responder —
  ainda não existe; a ideia é implementar via SMTP (o Zoho no app hoje serve
  só pro login de admin, ver seção acima).
- **Login via Zoho OAuth não testado contra uma conta real** — ver aviso na
  seção "Login via Zoho OAuth" acima. Funcionalmente implementado e
  compilando, mas o formato exato da resposta de identidade do Zoho precisa
  de validação com uma conta de verdade.
- **Exportação para lançamento manual no RHiD** — um botão em
  "Justificativas aprovadas" que gera um CSV/lista pronta para colar na tela
  de Atribuições em massa do RHiD, reduzindo o trabalho manual descrito no
  topo deste README.
- **Fidelidade visual total aos mockups HTML** — as telas aqui priorizaram
  estar funcionalmente corretas (dados reais do banco, decisões que
  persistem); refinar pixel a pixel para bater 100% com os protótipos
  visuais é um ajuste incremental de CSS a partir daqui.
