import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-32-bytes-long!'; 

if (SECRET_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 bytes long');
}

export function encryptToken(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encryptedData: `${encrypted}:${authTag}`,
    iv: iv.toString('hex'),
  };
}

export function decryptToken(encryptedString: string, ivHex: string) {
  const [encryptedData, authTagHex] = encryptedString.split(':');
  
  if (!encryptedData || !authTagHex) {
    throw new Error('Invalid encrypted string format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
