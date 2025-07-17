import dotenv from 'dotenv';
dotenv.config();
const crypto = require('crypto');
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';

//New encryption and decryption
const BE_SECRET_KEY = process.env.Enc_S_Key_BE || 'learnvibenet123';
const BE_SALT = process.env.Enc_S_Key_BE || 'learnvibenet123';

// BackEnd
export const EncryptBE = (text: string): string => {
  const derivedKey = crypto.scryptSync(BE_SECRET_KEY, BE_SALT, 24);
  const iv = Buffer.alloc(16, 0); // Fixed IV
  const cipher = crypto.createCipheriv('aes-192-cbc', derivedKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const DecryptBE = (encryptedText: string): string => {
  const derivedKey = crypto.scryptSync(BE_SECRET_KEY, BE_SALT, 24);
  const iv = Buffer.alloc(16, 0); // Must match the encryption IV
  const decipher = crypto.createDecipheriv('aes-192-cbc', derivedKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// FrontEnd
const key = process.env.Enc_S_Key_FE || 'LefjQ2pEXmiy/nNZvEJ43i8hJuaAnzbA1Cbn1hOuAgA=';
const FE_SECRET_KEY = Buffer.from(key, 'base64');
const iv = Buffer.from('1020304050607080', 'utf8');

export const EncryptFE = (text: string): string => {
  const cipher = crypto.createCipheriv('aes-256-cbc', FE_SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('base64');
};

export const DecryptFE = (encryptedText: string): string => {
  const encryptedBuffer = Buffer.from(encryptedText, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', FE_SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
};

//Hash Password Bcrypt
const PEPPER = process.env.PASSWORD_PEPPER || 'learnvibenet123';
//Use any Controller
// const hashed = await createPasswordHash('123');
// const isValid = await checkPasswordHash('123', '$2b$10$TqWJZoljp1Nq1nzgurOFVuvBcscpM2WXOAVQKLsWwU0Uors8h9fc6');
// return res.json({ hashedPassword: isValid });

export const createPasswordHash = async (plainPassword: string): Promise<string> => {
  const saltedPassword = plainPassword + PEPPER;
  const hashedPassword = await bcrypt.hash(saltedPassword, 10);
  return hashedPassword;
};

export const checkPasswordHash = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  const saltedPassword = plainPassword + PEPPER;
  const isMatch = await bcrypt.compare(saltedPassword, hashedPassword);
  return isMatch;
};
