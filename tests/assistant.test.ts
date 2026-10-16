import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectLanguage,
  parseLocalIntent,
  processAssistantRequest,
} from "../src/lib/assistant-engine";

test("detectLanguage distinguishes between Malay and English", () => {
  assert.equal(detectLanguage("Tolong belikan saya roti dan telur"), "ms");
  assert.equal(detectLanguage("Saya nak pinjam tangga esok pagi"), "ms");
  assert.equal(detectLanguage("Can someone help me carry heavy boxes?"), "en");
  assert.equal(detectLanguage("How do community points work?"), "en");
});

test("Assistant enforces prescription medicine guardrail in English and Malay", () => {
  const malayPrescription = parseLocalIntent("Saya nak minta tolong beli ubat antibiotik amoxicillin di farmasi");
  assert.equal(malayPrescription.language, "ms");
  assert.ok(malayPrescription.guardrailWarning);
  assert.ok(malayPrescription.reply.includes("keselamatan komuniti"));
  assert.equal(malayPrescription.proposal, undefined);

  const englishPrescription = parseLocalIntent("Need someone to pick up my prescription insulin from the hospital");
  assert.equal(englishPrescription.language, "en");
  assert.ok(englishPrescription.guardrailWarning);
  assert.ok(englishPrescription.reply.includes("prescription"));
  assert.equal(englishPrescription.proposal, undefined);
});

test("Assistant enforces emergency redirection guardrail", () => {
  const emergency = parseLocalIntent("Tolong ada kebakaran di rumah sebelah!");
  assert.ok(emergency.guardrailWarning);
  assert.ok(emergency.reply.includes("999"));
  assert.equal(emergency.proposal, undefined);
});

test("Assistant blocks cash sales and reminds user about community points", () => {
  const sale = parseLocalIntent("Saya nak jual basikal terpakai dengan harga RM 150 bayaran tunai");
  assert.ok(sale.guardrailWarning);
  assert.ok(sale.reply.includes("50 mata"));
  assert.equal(sale.proposal, undefined);
});

test("Assistant answers FAQ about points and QR code accurately", () => {
  const pointsFaq = parseLocalIntent("How do points and rewards work?");
  assert.ok(pointsFaq.reply.includes("50 community points"));
  assert.ok(pointsFaq.reply.includes("Rewards"));

  const qrFaq = parseLocalIntent("Macam mana nak guna kod QR bila serah barang?");
  assert.ok(qrFaq.reply.includes("15 minit"));
  assert.ok(qrFaq.reply.includes("50 mata"));
});

test("Assistant successfully drafts structured proposal for Malay grocery request", async () => {
  const res = await processAssistantRequest([
    { role: "user", content: "Tolong belikan roti dan telur di kedai bawah petang ni" },
  ]);

  assert.equal(res.language, "ms");
  assert.ok(res.proposal);
  assert.equal(res.proposal.type, "request");
  assert.equal(res.proposal.category, "Food & groceries");
  assert.ok(res.proposal.title.length >= 6 && res.proposal.title.length <= 80);
  assert.ok(res.proposal.description.length >= 20 && res.proposal.description.length <= 600);
  assert.equal(res.proposal.area, "Community hub");
  assert.ok(res.proposal.timing.includes("5 pm") || res.proposal.timing.includes("6 pm"));
});

test("Assistant successfully drafts structured proposal for English home repair request", async () => {
  const res = await processAssistantRequest([
    { role: "user", content: "Can someone help me change a high lightbulb in my kitchen tomorrow?" },
  ]);

  assert.equal(res.language, "en");
  assert.ok(res.proposal);
  assert.equal(res.proposal.type, "request");
  assert.equal(res.proposal.category, "Home & garden");
  assert.ok(res.proposal.title.length >= 6);
  assert.ok(res.proposal.description.length >= 20);
});

test("Assistant successfully drafts structured proposal for tool lending", async () => {
  const res = await processAssistantRequest([
    { role: "user", content: "Ada sesiapa boleh pinjamkan tangga lipat selama sejam?" },
  ]);

  assert.ok(res.proposal);
  assert.equal(res.proposal.category, "Borrow & lend");
  assert.ok(res.proposal.title.length >= 6);
});
