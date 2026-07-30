import crypto from 'crypto';

// APP_ENCRYPTION_KEY deve ser um hex de 64 caracteres (32 bytes) — gere com:
// openssl rand -hex 32
function getKey(): Buffer {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'APP_ENCRYPTION_KEY ausente ou com tamanho inválido. Gere uma com `openssl rand -hex 32` e defina no .env'
    );
  }
  return Buffer.from(hex, 'hex');
}

// Formato do texto cifrado: iv:authTag:cipherText (tudo em hex), usando AES-256-GCM.
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Payload cifrado em formato inválido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
