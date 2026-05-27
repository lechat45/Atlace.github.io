import CryptoJS from 'crypto-js'

export function encryptKey(plaintext, userId) {
  return CryptoJS.AES.encrypt(plaintext, userId).toString()
}

export function decryptKey(ciphertext, userId) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, userId)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}
