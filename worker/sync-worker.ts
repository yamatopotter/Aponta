// Worker separado, só pra manter empresas/departamentos/funcionários em dia
// com o RHiD — sem depender de alguém clicar em "Sincronizar agora".
//
// Roda em loop simples (sync → dorme → sync de novo), num processo à parte
// do Next.js. Não tem fila, não tem framework de agendamento — de propósito,
// pra ficar simples de rodar em qualquer lugar (um dyno/serviço separado, um
// screen/tmux num servidor, um container). Ver README para como subir isso.
//
// Uso: npm run worker:sync
// Intervalo configurável via SYNC_INTERVAL_MINUTES no .env (padrão: 360 = 6h).

import { syncTudoDoRhid } from '../src/lib/rhid';

const INTERVALO_MINUTOS = Number(process.env.SYNC_INTERVAL_MINUTES ?? 360);

function agora() {
  return new Date().toISOString();
}

async function rodarSync() {
  try {
    const resultado = await syncTudoDoRhid();
    console.log(
      `[sync-worker] ${agora()} ok — empresas: ${resultado.empresas.total}, ` +
        `departamentos: ${resultado.departamentos.total}, ` +
        `funcionários: ${resultado.funcionarios.total} ` +
        `(${resultado.funcionarios.criados} novo(s), ${resultado.funcionarios.atualizados} atualizado(s))`
    );
    if (resultado.estruturaErro) {
      console.warn(`[sync-worker] ${agora()} empresas/departamentos falharam nesta rodada: ${resultado.estruturaErro}`);
    }
  } catch (err) {
    console.error(`[sync-worker] ${agora()} falhou:`, err instanceof Error ? err.message : err);
  }
}

async function dormir(minutos: number) {
  await new Promise((resolve) => setTimeout(resolve, minutos * 60 * 1000));
}

async function loop() {
  console.log(`[sync-worker] iniciado — sincronizando a cada ${INTERVALO_MINUTOS} minuto(s)`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await rodarSync();
    await dormir(INTERVALO_MINUTOS);
  }
}

loop();
