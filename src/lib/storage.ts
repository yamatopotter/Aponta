import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

// Armazenamento local em disco, fora de `public/` (não é servido direto pelo
// Next — só via GET /api/anexos/[id], que checa permissão antes). Se um dia
// precisar de S3/blob storage, essa é a única peça a trocar (ver
// `Anexo.url` no schema: guarda um caminho relativo, não uma URL pública).
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const MAX_TAMANHO_BYTES = 10 * 1024 * 1024; // 10MB por arquivo
const TIPOS_PERMITIDOS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export class ArquivoInvalidoError extends Error {}

export async function salvarAnexo(file: File, subpasta: string) {
  if (file.size > MAX_TAMANHO_BYTES) {
    throw new ArquivoInvalidoError(`"${file.name}" passa de 10MB.`);
  }
  if (file.type && !TIPOS_PERMITIDOS.has(file.type)) {
    throw new ArquivoInvalidoError(`Tipo de arquivo não permitido: ${file.name}.`);
  }

  const dir = path.join(UPLOADS_DIR, subpasta);
  await mkdir(dir, { recursive: true });

  // Nome no disco é sempre gerado (não o nome original) — evita path
  // traversal e colisão; o nome original só fica salvo como metadado
  // (Anexo.nomeArquivo) pra exibição/download.
  const extensao = path.extname(file.name).slice(0, 10);
  const nomeNoDisco = `${randomUUID()}${extensao}`;
  const caminhoAbsoluto = path.join(dir, nomeNoDisco);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(caminhoAbsoluto, buffer);

  return {
    url: path.posix.join(subpasta, nomeNoDisco),
    nomeArquivo: file.name,
    mimeType: file.type || 'application/octet-stream',
    tamanhoBytes: file.size,
  };
}

export async function lerAnexo(url: string) {
  const resolved = path.join(UPLOADS_DIR, url);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new ArquivoInvalidoError('Caminho de arquivo inválido.');
  }
  return readFile(resolved);
}
