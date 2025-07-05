import sodiumLib from "libsodium-wrappers";

// Lazy-initialize libsodium and the symmetric key only once per process
let sodium: typeof import("libsodium-wrappers");
let key: Uint8Array;

async function init() {
  if (sodium) return; // already initialised

  sodium = (await sodiumLib.ready.then(
    () => sodiumLib
  )) as typeof import("libsodium-wrappers");

  const base64Key = process.env.ENCRYPTION_KEY;
  if (!base64Key) {
    throw new Error("ENCRYPTION_KEY env variable is missing");
  }

  key = sodium.from_base64(base64Key, sodium.base64_variants.ORIGINAL);
  if (key.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error(
      `ENCRYPTION_KEY must decode to ${sodium.crypto_secretbox_KEYBYTES} bytes`
    );
  }
}

/**
 * Encrypt plaintext into Base64 string using libsodium secretbox (XSalsa20-Poly1305).
 */
export async function encrypt(plaintext: string): Promise<string> {
  await init();

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const messageBytes = sodium.from_string(plaintext);
  const cipher = sodium.crypto_secretbox_easy(messageBytes, nonce, key);

  // Prepend nonce to ciphertext so it can be used during decryption
  const combined = new Uint8Array(nonce.length + cipher.length);
  combined.set(nonce);
  combined.set(cipher, nonce.length);

  return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
}

/**
 * Decrypt Base64 ciphertext produced by {@link encrypt} back to UTF-8 string.
 */
export async function decrypt(ciphertextBase64: string): Promise<string> {
  await init();

  const combined = sodium.from_base64(
    ciphertextBase64,
    sodium.base64_variants.ORIGINAL
  );

  const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const cipher = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

  const decrypted = sodium.crypto_secretbox_open_easy(cipher, nonce, key);
  if (!decrypted) {
    throw new Error("Decryption failed or data corrupted");
  }

  return sodium.to_string(decrypted);
}
