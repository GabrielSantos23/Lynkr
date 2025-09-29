import crypto from "crypto";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export class EncryptionService {
  private key: Buffer;

  constructor() {
    this.key = this.initKey();
  }

  private initKey(): Buffer {
    const base64Key = process.env.ENCRYPTION_KEY;
    if (!base64Key) {
      throw new Error("ENCRYPTION_KEY environment variable is missing");
    }

    // Decode base64 key to bytes
    return Buffer.from(base64Key, "base64");
  }

  private looksLikePlaintext(text: string): boolean {
    // Check if text looks like plaintext (printable ASCII characters)
    const printablePattern = /^[\x20-\x7E\s]+$/;
    return printablePattern.test(text) && text.length > 0;
  }

  private tryExtractPlaintext(data: string): string {
    // Try to extract plaintext from potentially encoded data
    if (this.looksLikePlaintext(data)) {
      return data;
    }

    try {
      const decoded = Buffer.from(data, "base64").toString("utf-8");
      if (this.looksLikePlaintext(decoded)) {
        return decoded;
      }
    } catch {
      // Ignore decode errors
    }

    return data;
  }

  /**
   * Encrypt plaintext using AES-256-CBC
   */
  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new Error("Encryption key not initialized");
    }

    // Generate random IV (16 bytes for CBC)
    const iv = crypto.randomBytes(16);

    // Create AES-256-CBC cipher using createCipheriv
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Combine IV and ciphertext
    const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);

    // Add version byte (0x01) at the beginning
    const versionedCombined = Buffer.concat([Buffer.from([0x01]), combined]);

    // Encode to base64
    return versionedCombined.toString("base64");
  }

  /**
   * Decrypt ciphertext using AES-256-CBC
   */
  decrypt(ciphertextBase64: string): string {
    if (!this.key) {
      throw new Error("Encryption key not initialized");
    }

    try {
      // Decode base64
      let combined: Buffer;
      try {
        combined = Buffer.from(ciphertextBase64, "base64");
      } catch {
        return ciphertextBase64;
      }

      // Check version byte
      if (combined.length > 0 && combined[0] === 0x01) {
        // Remove version byte
        const dataWithoutVersion = combined.slice(1);

        // Extract IV and ciphertext
        const iv = dataWithoutVersion.slice(0, 16);
        const ciphertext = dataWithoutVersion.slice(16);

        // Create AES-256-CBC decipher and decrypt
        const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, iv);

        let decrypted = decipher.update(ciphertext, undefined, "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
      } else {
        return this.tryExtractPlaintext(ciphertextBase64);
      }
    } catch (error) {
      console.error("Decryption failed:", error);
      return this.tryExtractPlaintext(ciphertextBase64);
    }
  }
}

// Global encryption service instance
export const encryptionService = new EncryptionService();
