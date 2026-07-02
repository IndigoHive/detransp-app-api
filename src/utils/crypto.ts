import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const AUTH_TAG_HEX_LENGTH = 32

export function encrypt(value: string, keyHex: string): { encryptedValue: string; iv: string } {
  const key = Buffer.from(keyHex, 'hex')
  const ivBytes = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, ivBytes)

  const encrypted = Buffer.concat([cipher.update(Buffer.from(value)), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encryptedValue: encrypted.toString('hex') + authTag.toString('hex'),
    iv: ivBytes.toString('hex'),
  }
}

export function decrypt(encryptedValue: string, iv: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex')
  const ivBytes = Buffer.from(iv, 'hex')

  const authTag = Buffer.from(encryptedValue.slice(-AUTH_TAG_HEX_LENGTH), 'hex')
  const ciphertext = Buffer.from(encryptedValue.slice(0, -AUTH_TAG_HEX_LENGTH), 'hex')

  const decipher = createDecipheriv('aes-256-gcm', key, ivBytes)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString()
}
