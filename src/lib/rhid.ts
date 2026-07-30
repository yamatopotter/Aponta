import { prisma } from './prisma';

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
 */

const BASE_URL = process.env.RHID_API_BASE_URL ?? 'https://www.rhid.com.br/v2';

interface LoginResult {
  accessToken: string;
  expiredPassword: boolean;
}

async function loginIntegracao(): Promise<string> {
  const email = process.env.RHID_INTEGRATION_EMAIL;
  const password = process.env.RHID_INTEGRATION_PASSWORD;
  if (!email || !password) {
    throw new Error('RHID_INTEGRATION_EMAIL / RHID_INTEGRATION_PASSWORD ausentes no .env');
  }

  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, system: 'rhid' }),
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
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
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

export interface ApuracaoDia {
  data: string;
  entrada?: string;
  saida?: string;
  intervaloInicio?: string;
  intervaloFim?: string;
  horasTrabalhadas?: string;
  saldoBancoHoras?: string;
  // A apuração do RHiD tem dezenas de campos adicionais (adicional noturno,
  // horas extras por faixa, etc.) — expor sob demanda conforme a tela precisar.
  [key: string]: unknown;
}

export async function getApuracaoPonto(params: {
  idPerson: number;
  dataIni: string; // yyyy-MM-dd
  dataFinal: string; // yyyy-MM-dd
}): Promise<ApuracaoDia[]> {
  const qs = new URLSearchParams({
    idPerson: String(params.idPerson),
    dataIni: params.dataIni,
    dataFinal: params.dataFinal,
  });
  const res = await rhidFetch(`/apuracao_ponto?${qs.toString()}`);
  if (!res.ok) throw new Error(`Erro ao consultar apuração de ponto no RHiD (${res.status})`);
  const data = await res.json();
  return data.records ?? data ?? [];
}

/**
 * Sincroniza o cache local de funcionários (tabela Employee) a partir do
 * RHiD. Rode isso periodicamente (ex.: cron/job noturno) e também sob demanda
 * na tela de login por CPF, caso a pessoa não seja encontrada localmente.
 */
export async function syncEmployeesFromRhid() {
  const pessoas = await listRhidPersons();
  let criados = 0;
  let atualizados = 0;

  for (const p of pessoas) {
    const cpf = String(p.cpf).padStart(11, '0');
    const existing = await prisma.employee.findUnique({ where: { rhidPersonId: p.id } });
    if (existing) {
      await prisma.employee.update({
        where: { id: existing.id },
        data: { cpf, nome: p.name, ativo: p.status === 1 },
      });
      atualizados++;
    } else {
      await prisma.employee.create({
        data: { rhidPersonId: p.id, cpf, nome: p.name, ativo: p.status === 1 },
      });
      criados++;
    }
  }

  return { total: pessoas.length, criados, atualizados };
}
