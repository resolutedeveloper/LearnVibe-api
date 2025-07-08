import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.Encrypted_S_Key || 'learnvibenet123'; // fallback for safety

export const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

export const comparePassword = (password: string, encryptedPassword: string): boolean => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedPassword === password;
  } catch (error) {
    return false;
  }
};
