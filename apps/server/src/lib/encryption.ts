// We'll use Web Crypto API which is available in both Node.js and Cloudflare Workers
// This is a simplified implementation that uses AES-GCM for encryption

// Cached key for reuse
let cryptoKey: CryptoKey | null = null;

/**
 * Initialize the crypto key from the environment variable
 */
async function init() {
  if (cryptoKey) return; // already initialized

  const base64Key = process.env.ENCRYPTION_KEY;
  if (!base64Key) {
    throw new Error("ENCRYPTION_KEY env variable is missing");
  }

  // Convert base64 key to Uint8Array
  const keyData = base64ToUint8Array(base64Key);

  // Import the key for AES-GCM
  cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Encrypt plaintext into Base64 string using AES-GCM
 */
export async function encrypt(plaintext: string): Promise<string> {
  await init();

  if (!cryptoKey) {
    throw new Error("Encryption key not initialized");
  }

  // Generate a random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert plaintext to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    data
  );

  // Combine IV and ciphertext
  const combined = new Uint8Array(
    iv.length + new Uint8Array(ciphertext).length
  );
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return uint8ArrayToBase64(combined);
}

/**
 * Decrypt Base64 ciphertext produced by {@link encrypt} back to UTF-8 string
 */
export async function decrypt(ciphertextBase64: string): Promise<string> {
  await init();

  if (!cryptoKey) {
    throw new Error("Encryption key not initialized");
  }

  // Convert base64 to Uint8Array
  const combined = base64ToUint8Array(ciphertextBase64);

  // Extract IV and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    ciphertext
  );

  // Convert decrypted data to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
