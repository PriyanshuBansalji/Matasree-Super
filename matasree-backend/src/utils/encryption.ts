import crypto from 'crypto';
import logger from '../config/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

/**
 * Derives a cryptographically strong 32-byte key from ENCRYPTION_KEY environment variable.
 */
const getSecretKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || 'matasree_default_super_secret_encryption_key_for_bank_info';
  return crypto.scryptSync(secret, 'matasree-salt', KEY_LENGTH);
};

/**
 * Encrypts cleartext using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export const encrypt = (text: string): string => {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getSecretKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error: any) {
    logger.error('Encryption failed:', error.message);
    throw new Error('Data encryption failed');
  }
};

/**
 * Decrypts ciphertext format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Returns raw if it wasn't encrypted (e.g. legacy data)
      return encryptedText;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = getSecretKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    logger.error('Decryption failed:', error.message);
    // Return original string if decryption fails (e.g. invalid key or unencrypted legacy data)
    return encryptedText;
  }
};
