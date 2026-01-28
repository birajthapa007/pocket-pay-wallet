// =========================================
// ENCRYPTION UTILITIES FOR SENSITIVE DATA
// Uses AES-256-GCM for authenticated encryption
// =========================================

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param plaintext The data to encrypt
 * @returns Encrypted string in format: iv:ciphertext (all hex encoded)
 */
export async function encryptData(plaintext: string): Promise<string> {
  const keyHex = Deno.env.get('CARD_ENCRYPTION_KEY')
  
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('CARD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  
  // Convert hex key to Uint8Array
  const keyBytes = hexToBytes(keyHex)
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  // Encrypt the data
  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    encoder.encode(plaintext)
  )
  
  // Convert to hex and format as iv:ciphertext
  const ivHex = bytesToHex(iv)
  const ciphertextHex = bytesToHex(new Uint8Array(encrypted))
  
  return `${ivHex}:${ciphertextHex}`
}

/**
 * Decrypts data that was encrypted with encryptData
 * @param encryptedString The encrypted string in format: iv:ciphertext
 * @returns The decrypted plaintext
 */
export async function decryptData(encryptedString: string): Promise<string> {
  const keyHex = Deno.env.get('CARD_ENCRYPTION_KEY')
  
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('CARD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  
  const parts = encryptedString.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format')
  }
  
  const [ivHex, ciphertextHex] = parts
  
  // Convert hex to bytes
  const keyBytes = hexToBytes(keyHex)
  const iv = hexToBytes(ivHex)
  const ciphertext = hexToBytes(ciphertextHex)
  
  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    ciphertext.buffer as ArrayBuffer
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Converts a hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Converts Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generates a random 32-byte encryption key as hex
 * Use this to generate a key for CARD_ENCRYPTION_KEY secret
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return bytesToHex(key)
}
