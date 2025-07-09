let cryptoKey: CryptoKey | null = null;

async function init() {
  if (cryptoKey) return;

  const base64Key = process.env.ENCRYPTION_KEY;
  if (!base64Key) {
    throw new Error("ENCRYPTION_KEY env variable is missing");
  }

  const keyData = base64ToUint8Array(base64Key);

  cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
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
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 */
function looksLikePlaintext(str: string): boolean {
  const printableChars = /^[\x20-\x7E\s]+$/;
  return printableChars.test(str) && str.length > 0;
}

/**
 */
function tryExtractPlaintext(data: string): string {
  if (looksLikePlaintext(data)) {
    return data;
  }

  try {
    const decoded = atob(data);
    if (looksLikePlaintext(decoded)) {
      return decoded;
    }
  } catch {}

  return data;
}

/**
 */
export async function encrypt(plaintext: string): Promise<string> {
  await init();

  if (!cryptoKey) {
    throw new Error("Encryption key not initialized");
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    data
  );

  const combined = new Uint8Array(
    iv.length + new Uint8Array(ciphertext).length
  );
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  const versionedCombined = new Uint8Array(combined.length + 1);
  versionedCombined[0] = 0x01;
  versionedCombined.set(combined, 1);

  return uint8ArrayToBase64(versionedCombined);
}

/**
 */
export async function decrypt(ciphertextBase64: string): Promise<string> {
  await init();

  if (!cryptoKey) {
    throw new Error("Encryption key not initialized");
  }

  try {
    let combined: Uint8Array;
    try {
      combined = base64ToUint8Array(ciphertextBase64);
    } catch {
      return ciphertextBase64;
    }

    if (combined.length > 0 && combined[0] === 0x01) {
      const dataWithoutVersion = combined.slice(1);

      const iv = dataWithoutVersion.slice(0, 12);
      const ciphertext = dataWithoutVersion.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        cryptoKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } else {
      return tryExtractPlaintext(ciphertextBase64);
    }
  } catch (error) {
    console.error("Decryption failed:", error);

    return tryExtractPlaintext(ciphertextBase64);
  }
}
