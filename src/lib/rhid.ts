import { prisma } from './prisma';
import { decryptSecret } from './crypto';

/**
 * Cliente da API do RHiD.
 *
 * IMPORTANTE: a API do RHiD não tem um "login por pessoa" — o /login retorna
 * um token para um USUÁRIO DE INTEGRAÇÃO (o mesmo tipo de login que um
 * administrador usaria no painel do RHiD). É esse token que autentica todas
 * as chamadas server-to-server abaixo. O login por CPF do funcionário, dentro
 * do NOSSO app, é resolvido comparando o CPF com o cadastro sincronizado de
 * /person — não existe (e não deveria existir) um login de funcionário
 * direto contra o RHiD aqui.
 *
 * Peça ao suporte RHiD/ControliD um usuário de integração dedicado, com o
 * mínimo de permissão necessária (leitura de Person e de Apuração de Ponto).
 *
 * A credencial é configurável em /admin/configuracoes (aba RHiD) (guardada
 * criptografada em RhidConfig); se não estiver configurada por lá, cai para
 * as variáveis de ambiente RHID_* no .env.
 *
 * Endpoints e formatos conferidos contra swagger-rhid.json (doc oficial):
 * basePath da API é `/v2/api.svc` — não só `/v2`.
 */

const DEFAULT_BASE_URL = 'https://www.rhid.com.br/v2/api.svc';

interface RhidCredentials {
  baseUrl: string;
  email: string;
  password: string;
}

export async function getRhidCredentials(): Promise<RhidCredentials | null> {
  const config = await prisma.rhidConfig.findUnique({ where: { id: 1 } });

  const baseUrl = config?.apiBaseUrl || process.env.RHID_API_BASE_URL || DEFAULT_BASE_URL;
  const email = config?.integrationEmail || process.env.RHID_INTEGRATION_EMAIL;
  const password = config?.integrationPasswordEnc
    ? decryptSecret(config.integrationPasswordEnc)
    : process.env.RHID_INTEGRATION_PASSWORD;

  if (!email || !password) return null;
  return { baseUrl, email, password };
}

interface LoginResult {
  accessToken: string;
  expiredPassword: boolean;
}

async function loginIntegracao(): Promise<string> {
  const creds = await getRhidCredentials();
  if (!creds) {
    throw new Error(
      'Credencial de integração do RHiD não configurada. Preencha em /admin/configuracoes (aba RHiD) (ou RHID_INTEGRATION_EMAIL/RHID_INTEGRATION_PASSWORD no .env).'
    );
  }

  const res = await fetch(`${creds.baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password, system: 'rhid' }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao autenticar no RHiD (${res.status}): ${body}`);
  }

  const data = (await res.json()) as LoginResult;

  // O token JWT não tem exp exposto no schema público; damos uma folga
  // conservadora de 45 minutos e deixamos o próximo request renovar antes disso.
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000);
  await prisma.rhidIntegrationToken.upsert({
    where: { id: 1 },
    update: { accessToken: data.accessToken, expiresAt },
    create: { id: 1, accessToken: data.accessToken, expiresAt },
  });

  return data.accessToken;
}

async function getToken(): Promise<string> {
  const cached = await prisma.rhidIntegrationToken.findUnique({ where: { id: 1 } });
  if (cached?.accessToken && cached.expiresAt && cached.expiresAt > new Date()) {
    return cached.accessToken;
  }
  return loginIntegracao();
}

async function rhidFetch(path: string, init?: RequestInit, retrying = false): Promise<Response> {
  const [token, creds] = await Promise.all([getToken(), getRhidCredentials()]);
  const baseUrl = creds?.baseUrl ?? DEFAULT_BASE_URL;
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  // Token expirado/inválido — renova uma vez e tenta de novo.
  if (res.status === 401 && !retrying) {
    await loginIntegracao();
    return rhidFetch(path, init, true);
  }

  return res;
}

/**
 * Testa a credencial configurada: força um login novo (ignora token em
 * cache) e confirma que dá pra listar pessoas. Usado pelo botão "Testar
 * conexão" em /admin/configuracoes (aba RHiD).
 */
export async function testRhidConnection(): Promise<{ totalPessoas: number }> {
  await loginIntegracao();
  const pessoas = await listRhidPersons();
  return { totalPessoas: pessoas.length };
}

export interface RhidPerson {
  id: number;
  cpf: number; // vem sem zeros à esquerda / sem pontuação
  name: string;
  registration?: string;
  idDepartment?: number;
  idCompany?: number;
  status: number;
}

/**
 * Lista todas as pessoas do cliente autenticado no RHiD.
 * Atenção: conforme a própria documentação, `start`/`length` NÃO paginam de
 * fato — a resposta vem completa. Cacheie localmente (ver syncEmployees) em
 * vez de chamar isso a cada login.
 */
export async function listRhidPersons(): Promise<RhidPerson[]> {
  const res = await rhidFetch('/person');
  if (!res.ok) throw new Error(`Erro ao listar pessoas no RHiD (${res.status})`);
  const data = await res.json();
  return data.records ?? [];
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export async function findRhidPersonByCpf(cpf: string): Promise<RhidPerson | null> {
  const alvo = normalizeCpf(cpf);
  const pessoas = await listRhidPersons();
  return pessoas.find((p) => String(p.cpf).padStart(11, '0') === alvo.padStart(11, '0')) ?? null;
}

export interface RhidCompany {
  id: number;
  name: string;
  cnpj?: string;
}

export async function listRhidCompanies(): Promise<RhidCompany[]> {
  const res = await rhidFetch('/company');
  if (!res.ok) throw new Error(`Erro ao listar empresas no RHiD (${res.status})`);
  const data = await res.json();
  return data.records ?? [];
}

export interface RhidDepartment {
  id: number;
  name: string;
  idCompany?: number;
}

export async function listRhidDepartments(): Promise<RhidDepartment[]> {
  const res = await rhidFetch('/department');
  if (!res.ok) throw new Error(`Erro ao listar departamentos no RHiD (${res.status})`);
  const data = await res.json();
  return data.records ?? [];
}

/**
 * Sincroniza o cadastro local de empresas e departamentos (tabelas Empresa e
 * Departamento) a partir do RHiD. Precisa rodar ANTES de
 * syncEmployeesFromRhid() pra que o departamento de cada funcionário resolva
 * corretamente — ver syncTudoDoRhid().
 */
export async function syncEmpresasEDepartamentos() {
  const [empresasRhid, departamentosRhid] = await Promise.all([listRhidCompanies(), listRhidDepartments()]);

  let empresasCriadas = 0;
  let empresasAtualizadas = 0;
  for (const e of empresasRhid) {
    const existing = await prisma.empresa.findUnique({ where: { rhidCompanyId: e.id } });
    if (existing) {
      await prisma.empresa.update({ where: { id: existing.id }, data: { nome: e.name, cnpj: e.cnpj ?? null } });
      empresasAtualizadas++;
    } else {
      await prisma.empresa.create({ data: { rhidCompanyId: e.id, nome: e.name, cnpj: e.cnpj ?? null } });
      empresasCriadas++;
    }
  }

  let departamentosCriados = 0;
  let departamentosAtualizados = 0;
  for (const d of departamentosRhid) {
    const empresa = d.idCompany ? await prisma.empresa.findUnique({ where: { rhidCompanyId: d.idCompany } }) : null;
    const existing = await prisma.departamento.findUnique({ where: { rhidDepartmentId: d.id } });
    if (existing) {
      await prisma.departamento.update({
        where: { id: existing.id },
        data: { nome: d.name, empresaId: empresa?.id },
      });
      departamentosAtualizados++;
    } else {
      await prisma.departamento.create({
        data: { rhidDepartmentId: d.id, nome: d.name, empresaId: empresa?.id },
      });
      departamentosCriados++;
    }
  }

  return {
    empresas: { total: empresasRhid.length, criadas: empresasCriadas, atualizadas: empresasAtualizadas },
    departamentos: { total: departamentosRhid.length, criados: departamentosCriados, atualizados: departamentosAtualizados },
  };
}

// Uma marcação de ponto (batida) individual dentro do dia.
export interface ApuracaoMarcacao {
  dateTime: string; // ISO, ex. "2026-07-01T08:36:00"
  _typeEntradaSaida: 'E' | 'S';
  [key: string]: unknown;
}

// Campos confirmados contra uma resposta real do /apuracao_ponto (ver
// docs/integrations/rhid-swagger.json — a doc só documenta um subconjunto
// ilustrativo; o motor ACJEF retorna ~100 campos por dia). Os usados na tela
// de folha estão tipados abaixo; o resto fica disponível via index signature.
export interface ApuracaoDia {
  date: string; // ISO, meia-noite do dia, ex. "2026-07-01T00:00:00"
  idPerson: number;
  name?: string;
  pis?: number;
  totalHorasTrabalhadas?: number; // minutos
  saldoBancoFinalDia?: number; // minutos, saldo do banco de horas ao fim do dia
  horasExtrasCalculadas?: number; // minutos
  faltaDiaInteiro?: boolean;
  folga?: boolean;
  holiday?: string | null;
  compensado?: boolean;
  possuiPendencias?: boolean; // RHiD já sinaliza dias com pendência de apuração
  toolTipAlert?: string | null; // explicação legível do alerta do dia, se houver
  colorAlert?: string | null; // ex.: "warning" — cor sugerida pelo próprio RHiD
  strHorarioContratualSimples?: string; // ex.: "09:00-12:00\r\n13:00-18:48"
  listAfdtManutencao?: ApuracaoMarcacao[]; // marcações reais (entrada/saída) do dia
  [key: string]: unknown;
}

export async function getApuracaoPonto(params: {
  idPerson: number;
  dataIni: string; // yyyy-MM-dd
  dataFinal: string; // yyyy-MM-dd — intervalo entre dataIni/dataFinal não pode passar de 90 dias
}): Promise<ApuracaoDia[]> {
  const qs = new URLSearchParams({
    idPerson: String(params.idPerson),
    dataIni: params.dataIni,
    dataFinal: params.dataFinal,
  });
  const res = await rhidFetch(`/apuracao_ponto?${qs.toString()}`);
  if (!res.ok) throw new Error(`Erro ao consultar apuração de ponto no RHiD (${res.status})`);

  // IMPORTANTE: o schema desse endpoint é `{ type: "string" }` — a API
  // retorna a lista de registros como uma STRING JSON dentro do corpo, não
  // como array direto. Precisa de um segundo JSON.parse.
  const raw = await res.json();
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : (parsed?.records ?? []);
}

/**
 * Sincroniza o cache local de funcionários (tabela Employee) a partir do
 * RHiD. Rode isso periodicamente (ex.: worker/sync-worker.ts) e também sob
 * demanda na tela de login por CPF, caso a pessoa não seja encontrada
 * localmente. Resolve o departamento pelo idDepartment — rode
 * syncEmpresasEDepartamentos() antes (ou use syncTudoDoRhid()) pra isso
 * funcionar direito.
 */
export async function syncEmployeesFromRhid() {
  const pessoas = await listRhidPersons();
  let criados = 0;
  let atualizados = 0;

  for (const p of pessoas) {
    const cpf = String(p.cpf).padStart(11, '0');
    const departamento = p.idDepartment
      ? await prisma.departamento.findUnique({ where: { rhidDepartmentId: p.idDepartment } })
      : null;
    const dados = {
      cpf,
      nome: p.name,
      ativo: p.status === 1,
      unidade: departamento?.nome ?? null,
      departamentoId: departamento?.id ?? null,
    };

    const existing = await prisma.employee.findUnique({ where: { rhidPersonId: p.id } });
    if (existing) {
      await prisma.employee.update({ where: { id: existing.id }, data: dados });
      atualizados++;
    } else {
      await prisma.employee.create({ data: { rhidPersonId: p.id, ...dados } });
      criados++;
    }
  }

  return { total: pessoas.length, criados, atualizados };
}

/**
 * Sincronização completa: empresas/departamentos primeiro (pra existirem
 * quando os funcionários forem resolvidos), depois funcionários. Usado pelo
 * botão "Sincronizar agora" e pelo worker (worker/sync-worker.ts).
 *
 * A etapa de empresas/departamentos é isolada num try/catch — se o RHiD
 * falhar nela (já aconteceu: `/company` e `/department` retornando 500 do
 * lado deles, aparentemente um problema no ambiente do cliente, não da
 * nossa chamada — confirmado batendo a requisição contra o swagger oficial),
 * ainda assim sincroniza os funcionários, que é o que já sabemos que
 * funciona. Sem isso, uma instabilidade pontual nesses dois endpoints
 * travaria a sincronização inteira, inclusive de pessoas.
 */
export async function syncTudoDoRhid() {
  let estrutura: Awaited<ReturnType<typeof syncEmpresasEDepartamentos>> | null = null;
  let estruturaErro: string | null = null;
  try {
    estrutura = await syncEmpresasEDepartamentos();
  } catch (e) {
    estruturaErro = e instanceof Error ? e.message : 'Falha ao sincronizar empresas/departamentos.';
  }

  const funcionarios = await syncEmployeesFromRhid();

  return {
    empresas: estrutura?.empresas ?? { total: 0, criadas: 0, atualizadas: 0 },
    departamentos: estrutura?.departamentos ?? { total: 0, criados: 0, atualizados: 0 },
    estruturaErro,
    funcionarios,
  };
}
