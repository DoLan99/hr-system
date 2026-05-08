import CryptoJS from "crypto-js";

const VAULT_KEY = process.env.VAULT_SECRET_KEY ?? "hr-vault-default-key-2024";

export function encryptVault(text: string) {
  return CryptoJS.AES.encrypt(text, VAULT_KEY).toString();
}

export function decryptVault(cipher: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, VAULT_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}
