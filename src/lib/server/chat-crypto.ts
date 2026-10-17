import crypto from "node:crypto";

/**
 * Derives a 256-bit encryption key from environment or secure project seed.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.CHAT_ENCRYPTION_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "sdp-tolong-task-coordination-chat-aes256-key-2026";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext message into an AES-256-GCM ciphertext string for Supabase storage.
 * Output format: enc:v1:<base64-iv>:<base64-auth-tag>:<base64-ciphertext>
 */
export function encryptTaskMessage(plainText: string): string {
  if (!plainText) return plainText;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts an AES-256-GCM ciphertext string back to plaintext.
 * Seamlessly handles legacy/unencrypted messages if they do not start with 'enc:v1:'.
 */
export function decryptTaskMessage(storedMessage: string): string {
  if (!storedMessage || !storedMessage.startsWith("enc:v1:")) {
    // Backward compatibility for existing plaintext messages in database
    return storedMessage;
  }

  try {
    const parts = storedMessage.split(":");
    if (parts.length !== 5) {
      return storedMessage;
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(parts[2], "base64");
    const tag = Buffer.from(parts[3], "base64");
    const encrypted = Buffer.from(parts[4], "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt task message:", err);
    return "[Encrypted message - could not decrypt]";
  }
}
