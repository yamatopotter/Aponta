// Gera CSV simples (separador ";", padrão do Excel PT-BR) a partir de linhas
// de string — sem depender de nenhuma lib externa.
function escaparCampo(valor: string): string {
  if (/[;"\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function paraCsv(linhas: string[][]): string {
  return linhas.map((linha) => linha.map(escaparCampo).join(';')).join('\r\n');
}
