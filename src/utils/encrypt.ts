import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.Encrypted_S_Key || 'learnvibenet123';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (text: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return '';
  }
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
