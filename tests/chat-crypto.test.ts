import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptTaskMessage, decryptTaskMessage } from "../src/lib/server/chat-crypto";

test("encryptTaskMessage scrambles text into enc:v1 format", () => {
  const plain = "Hello neighbour! I am on my way with your groceries.";
  const encrypted = encryptTaskMessage(plain);

  assert.notEqual(encrypted, plain);
  assert.ok(encrypted.startsWith("enc:v1:"));
  assert.ok(!encrypted.includes("neighbour"));
  assert.ok(!encrypted.includes("groceries"));
});

test("decryptTaskMessage correctly restores the original plaintext", () => {
  const original = "I have arrived at lobby 2, wearing a blue shirt!";
  const encrypted = encryptTaskMessage(original);
  const decrypted = decryptTaskMessage(encrypted);

  assert.equal(decrypted, original);
});

test("encryption generates a fresh random IV per message (semantic security)", () => {
  const msg = "Same message sent twice";
  const enc1 = encryptTaskMessage(msg);
  const enc2 = encryptTaskMessage(msg);

  // Ciphertexts must be different even for the exact same message to prevent frequency analysis
  assert.notEqual(enc1, enc2);
  assert.equal(decryptTaskMessage(enc1), msg);
  assert.equal(decryptTaskMessage(enc2), msg);
});

test("decryptTaskMessage provides backward compatibility for unencrypted legacy messages", () => {
  const legacyPlain = "This message was written before encryption was enabled";
  const result = decryptTaskMessage(legacyPlain);

  assert.equal(result, legacyPlain);
});

test("handles Malaysian multilingual text and emojis seamlessly", () => {
  const malay = "Saya dah sampai kat pondok pengawal 📍 Tolong bawa RM 0 (percuma 50 mata)!";
  const chinese = "我已经在楼下大堂等候了 🚗 谢谢您的帮助！";
  const manglish = "Bro, I help you tap the card already, coming up now lah 👍";

  assert.equal(decryptTaskMessage(encryptTaskMessage(malay)), malay);
  assert.equal(decryptTaskMessage(encryptTaskMessage(chinese)), chinese);
  assert.equal(decryptTaskMessage(encryptTaskMessage(manglish)), manglish);
});
