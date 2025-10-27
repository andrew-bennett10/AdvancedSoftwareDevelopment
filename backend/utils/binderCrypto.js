const crypto = require('crypto');

const RAW_SECRET = process.env.BINDER_SECRET_KEY;
const DEFAULT_FALLBACK = 'dev-placeholder-secret-key';

const KEY = crypto.createHash('sha256').update(RAW_SECRET || DEFAULT_FALLBACK).digest();
const IV_LENGTH = 12; // Recommended length for GCM
const AUTH_TAG_LENGTH = 16;

function encryptBinderPayload(payload) {
  if (!payload) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decryptBinderPayload(encoded) {
  if (!encoded) return null;
  const buffer = Buffer.from(encoded, 'base64');
  const iv = buffer.slice(0, IV_LENGTH);
  const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.slice(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  const text = decrypted.toString('utf8');
  try {
    return JSON.parse(text);
  } catch (err) {
    return text;
  }
}

module.exports = {
  encryptBinderPayload,
  decryptBinderPayload,
};
