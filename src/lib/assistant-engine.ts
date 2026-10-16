import {
  areas,
  categories,
  type Category,
  type Area,
  type ListingType,
  type ListingInput,
} from "./types";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantProposal = ListingInput;

export type AssistantResponse = {
  reply: string;
  proposal?: AssistantProposal;
  guardrailWarning?: string;
  language: "ms" | "en";
};

// Prescription guardrail pattern (from marketplace-service.ts)
const PRESCRIPTION_REGEX =
  /\b(prescription|prescribed|preskripsi|ubat terkawal|antibiotic\w*|antibiotik\w*|insulin|amoxicillin|amoxicilin|amoksisilin|warfarin|tramadol|diazepam)\b/i;

// Emergency keywords
const EMERGENCY_REGEX =
  /\b(emergency|kecemasan|pencuri|kebakaran|terbakar|sesak nafas|sakit dada|ambulance|ambulans|police|polis|kemalangan teruk)\b/i;

// Sales / Money keywords
const SALES_REGEX =
  /\b(?:rm\s*\d|myr\s*\d|for sale|jual|harga|beli dari saya|bayaran tunai|cash payment|sewa)\b|\$\s*\d/i;

// Contact info keywords
const CONTACT_REGEX =
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]*){8,}|\b(?:unit|apartment|flat)\s*(?:no\.?\s*)?#?\s*\d/i;

// Language detection
export function detectLanguage(text: string): "ms" | "en" {
  const malayPatterns =
    /\b(saya|nak|tolong|boleh|beli|makanan|ubat|kedai|terima kasih|jiran|bantuan|pinjam|tukar|baiki|rumah|petang|pagi|malam|hari|apa|macam mana|siapa|kat|di|dan|ada|tak|bukan|perlu|jom|makcik|pakcik|abang|kakak|tolongkan)\b/i;
  return malayPatterns.test(text) ? "ms" : "en";
}

// Built-in rule-based conversational processor (guaranteed offline fallback)
export function parseLocalIntent(
  userText: string,
  history: AssistantMessage[] = [],
): AssistantResponse {
  const lang = detectLanguage(userText);
  const text = userText.trim();

  // 1. Guardrail: Prescription Drugs
  if (PRESCRIPTION_REGEX.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Maaf ya, demi keselamatan komuniti, Tolong tidak membenarkan permintaan ubat preskripsi atau ubat terkawal. Sila rujuk klinik kesihatan atau hospital berdekatan untuk bantuan perubatan. Kami sedia bantu jika anda perlukan barangan am atau barangan dapur!"
          : "I apologize, but for township safety, Tolong cannot support requests for prescription medications or controlled drugs. Please consult a registered clinic or hospital. We are happy to help you with groceries, general errands, or over-the-counter essentials!",
      guardrailWarning: "Prescription medication is restricted.",
    };
  }

  // 2. Guardrail: Emergencies
  if (EMERGENCY_REGEX.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Ini kelihatan seperti kecemasan! Sila hubungi talian kecemasan 999 atau pihak keselamatan komuniti dengan segera. Tolong adalah aplikasi bantuan harian sesama jiran dan bukan pengganti perkhidmatan kecemasan."
          : "This sounds like an urgent emergency! Please call 999 or township security immediately. Tolong is a neighbourhood mutual-aid community and cannot respond to emergency crises.",
      guardrailWarning: "Emergency service redirection.",
    };
  }

  // 3. Guardrail: Selling / Cash
  if (SALES_REGEX.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Tolong adalah platform tolong-menolong sesama jiran secara sukarela tanpa urus niaga wang atau jualan. Sebaliknya, jiran yang membantu akan menerima 50 mata ganjaran komuniti yang boleh ditebus untuk minuman kafe atau pas rekreasi!"
          : "Tolong is exclusively for neighbourly mutual aid and lending — sales and cash payments are not supported. Instead, helpers earn 50 community points per completed task, which can be redeemed for café treats or activity passes!",
      guardrailWarning: "Commercial sales/cash are not allowed.",
    };
  }

  // 4. Guardrail: Privacy / Contact Info
  if (CONTACT_REGEX.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Sila pastikan nombor telefon, emel, dan nombor unit rumah tidak disertakan dalam siaran awam. Maklumat hubungan peribadi hanya akan dikongsi secara selamat antara anda dan jiran selepas bantuan dipersetujui."
          : "Please keep phone numbers, emails, and unit numbers out of public requests. Your private contact details will be shared securely with your neighbour only after the task is accepted.",
      guardrailWarning: "Personal contact information must remain private.",
    };
  }

  // 5. FAQ: Points & Rewards
  if (/\b(point|points|mata|ganjaran|reward|rewards|tebus|redeem)\b/i.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Setiap kali anda membantu jiran dan mengesahkan penyerahan menggunakan kod QR, anda akan menerima 50 mata secara automatik! Anda boleh melihat baki mata dan menebus ganjaran seperti minuman kafe komuniti atau pas sukan di tab 'Rewards'."
          : "Every time you help a neighbour and complete the in-person QR confirmation, you automatically earn 50 community points! You can check your balance and redeem rewards (such as café drinks or sports court passes) in the 'Rewards' tab.",
    };
  }

  // 6. FAQ: How QR Code Works
  if (/\b(qr|handover|scan|imbas|penyerahan|kod)\b/i.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Pengesahan kod QR memastikan keselamatan kedua-dua pihak. Apabila tugasan selesai secara bersemuka, pembantu akan menjana kod QR (sah selama 15 minit). Pemohon hanya perlu mengimbas kod tersebut untuk melengkapkan tugas dan memberi 50 mata ganjaran serta merta!"
          : "The QR code confirms in-person task completion safely. When meeting up, the helper shows a single-use 15-minute QR code. The requester scans it with their phone to confirm completion, instantly awarding 50 points to the helper!",
    };
  }

  // 7. FAQ: General Platform Overview
  if (/\b(how it works|apa itu tolong|how does tolong work|tentang tolong|about tolong)\b/i.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Tolong ialah platform kejiranan untuk penduduk township Sime Darby Property. Anda boleh meminta bantuan harian, menawarkan bantuan kepada jiran, atau meminjamkan peralatan rumah. Semuanya selamat, peribadi, dan disokong oleh mata ganjaran komuniti!"
          : "Tolong is a hyper-local township mutual aid app for Sime Darby Property residents. You can post requests for help, offer your skills, or lend everyday items. It's completely cashless, verified, and rewarded through township points!",
    };
  }

  // 8. Intent: Create a Listing (Request / Offer / Lend)
  // Check for keywords indicating a task request, offer, or lending
  const isLending = /\b(pinjam|pinjamkan|borrow|lend|lending|sewa|equipment|alatan)\b/i.test(text);
  const isOffer = /\b(saya boleh tolong|offering help|sedia membantu|willing to help|can help with|i can help)\b/i.test(text);
  const isRequest =
    isLending ||
    isOffer ||
    /\b(tolong|bantu|help|need|perlu|nak|minta|belikan|baiki|hantar|angkut|cari|tukar|teman)\b/i.test(text);

  if (isRequest) {
    let type: ListingType = "request";
    if (isOffer) type = "offer";
    else if (isLending && /\b(saya ada|siapa nak pinjam|boleh pinjamkan|offering to lend)\b/i.test(text)) type = "lend";

    // Determine category
    let category: Category = "Food & groceries";
    if (/\b(lampu|mentol|paip|rumput|taman|cat|baiki|repair|fix|lightbulb|leak|garden|lawn|plumbing|singki)\b/i.test(text)) {
      category = "Home & garden";
    } else if (/\b(pinjam|tangga|gerudi|drill|mesin|cangkul|borrow|lend|ladder|tools|alatan)\b/i.test(text)) {
      category = "Borrow & lend";
    } else if (/\b(parcel|pos|bungkusan|surat|suratkhabar|errand|courier|ambilkan)\b/i.test(text)) {
      category = "Errands";
    } else if (/\b(panadol|minyak angin|plaster|koyok|cough drop|otc|demam|selsema)\b/i.test(text)) {
      category = "Medicine (OTC)";
    } else if (/\b(telefon|fon|laptop|komputer|wifi|internet|phone|tv|app|tech|setting)\b/i.test(text)) {
      category = "Skills & tech";
    } else if (/\b(angkat|kotak|berat|pindah|sofa|meja|carry|heavy|lift|move|kotak)\b/i.test(text)) {
      category = "Carrying";
    } else if (/\b(teman|borak|jalan|sembang|sunyi|walk|chat|company|elderly|berbual)\b/i.test(text)) {
      category = "Company";
    } else if (/\b(makan|roti|telur|susu|kedai|pasar|groceries|food|bread|eggs|shop|kedai runcit)\b/i.test(text)) {
      category = "Food & groceries";
    }

    // Determine timing
    let timing = "Today around 5 pm";
    if (/\besok\b|\btomorrow\b/i.test(text)) timing = "Tomorrow morning";
    else if (/\bmalam\b|\btonight\b/i.test(text)) timing = "Tonight after 8 pm";
    else if (/\bsegera\b|\basap\b|\bnow\b|\bsekarang\b/i.test(text)) timing = "Today, as soon as possible";
    else if (/\bpagi\b|\bmorning\b/i.test(text)) timing = "Tomorrow at 10 am";
    else if (/\bpetang\b|\bafternoon\b/i.test(text)) timing = "Today before 6 pm";

    // Build title and description
    let title = "";
    let description = "";

    if (category === "Food & groceries") {
      title = lang === "ms" ? "Tolong belikan barangan dapur" : "Help pick up groceries";
      description =
        lang === "ms"
          ? `Perlukan bantuan jiran untuk mengambil beberapa barangan dapur (contoh: ${text.slice(0, 80)}) dari kedai berdekatan.`
          : `Seeking a neighbour's help to pick up a few grocery essentials (${text.slice(0, 80)}) from the local shop.`;
    } else if (category === "Borrow & lend") {
      title = lang === "ms" ? "Pinjam alatan rumah dari jiran" : "Borrow household tool";
      description =
        lang === "ms"
          ? `Mencari jiran yang sudi meminjamkan peralatan (${text.slice(0, 80)}). Akan dipulangkan dalam keadaan baik dan bersih.`
          : `Looking to borrow household equipment (${text.slice(0, 80)}). Will return promptly in clean condition.`;
    } else if (category === "Home & garden") {
      title = lang === "ms" ? "Bantuan baiki rumah atau taman" : "Help with home or garden fix";
      description =
        lang === "ms"
          ? `Perlukan pertolongan jiran untuk kerja kecil di rumah (${text.slice(0, 80)}). Sangat menghargai bantuan jiran.`
          : `Looking for neighbourly assistance with a minor home or garden task (${text.slice(0, 80)}). Greatly appreciated.`;
    } else if (category === "Skills & tech") {
      title = lang === "ms" ? "Bantuan tetapan teknologi atau telefon" : "Help with phone or tech setup";
      description =
        lang === "ms"
          ? `Perlukan bantuan seorang jiran untuk membantu tetapan digital (${text.slice(0, 80)}).`
          : `Need a hand with digital settings or tech devices (${text.slice(0, 80)}).`;
    } else if (category === "Medicine (OTC)") {
      title = lang === "ms" ? "Bantuan belikan keperluan asas am (OTC)" : "Help pick up over-the-counter essentials";
      description =
        lang === "ms"
          ? `Minta tolong belikan ubat am tanpa preskripsi dari farmasi (${text.slice(0, 80)}).`
          : `Seeking assistance to purchase over-the-counter wellness supplies from the pharmacy (${text.slice(0, 80)}).`;
    } else {
      title = lang === "ms" ? "Permintaan bantuan kejiranan" : "Neighbourhood assistance request";
      description =
        lang === "ms"
          ? `Mencari jiran yang sudi membantu dengan tugasan (${text.slice(0, 100)}). Terima kasih daun keladi!`
          : `Looking for a friendly neighbour to help out with (${text.slice(0, 100)}). Thank you!`;
    }

    // Ensure title and description fit boundary constraints
    if (title.length < 6) title = "Help with neighbourhood request";
    if (title.length > 80) title = title.slice(0, 77) + "...";
    if (description.length < 20) description = description.padEnd(25, ".");
    if (description.length > 500) description = description.slice(0, 497) + "...";

    const proposal: AssistantProposal = {
      type,
      category,
      title,
      description,
      area: "Community hub",
      timing,
    };

    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Saya faham! Saya telah siapkan draf permintaan untuk anda di bawah. Sila semak butiran ini. Jika bersetuju, tekan 'Sahkan & Siarkan' untuk maklumkan kepada jiran anda."
          : "I understand! I have drafted this request for you below. Please review the details. When you're ready, tap 'Confirm & Post' to share it with your neighbours.",
      proposal,
    };
  }

  // 9. Friendly greeting / general assistance
  return {
    language: lang,
    reply:
      lang === "ms"
        ? "Hai! Saya Pembantu Maya Tolong. Saya sedia membantu anda menyiarkan permintaan bantuan, menjawab soalan tentang mata ganjaran, atau menerangkan cara Tolong berfungsi. Apa yang boleh saya bantu hari ini?"
        : "Hello! I am your Tolong Assistant. I can help you draft a request for your neighbours, answer questions about community points, or explain how Tolong works. How can I help you today?",
  };
}

// Optional LLM API caller (Google Gemini or OpenAI if configured)
export async function callExternalLLM(
  messages: AssistantMessage[],
): Promise<AssistantResponse | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const userPrompt = messages[messages.length - 1]?.content ?? "";
      const systemPrompt = `You are "Tolong Assistant", a warm, empathetic, bilingual (English and Bahasa Melayu) AI assistant for a township community mutual-aid app developed for Sime Darby Property residents.
Your role:
1. Help residents (especially seniors and non-tech users) create requests, offers, or lending listings easily.
2. Answer questions about Tolong (community points = 50 per task, 15-minute QR handover, safety, rewards).
3. Strictly enforce guardrails:
   - NO prescription medicine (antibiotics, insulin, controlled drugs). Only OTC or groceries allowed.
   - NO emergencies (tell them to call 999).
   - NO cash/sales/pricing (Tolong is cashless mutual-aid; helpers earn points).
   - NO personal contact info in public listings.
4. Output MUST be a valid JSON object matching:
{
  "reply": "string (polite response in user's language)",
  "language": "ms" | "en",
  "proposal": {
    "type": "request" | "offer" | "lend",
    "category": "Food & groceries" | "Errands" | "Medicine (OTC)" | "Skills & tech" | "Carrying" | "Home & garden" | "Borrow & lend" | "Company",
    "title": "string (6-80 chars)",
    "description": "string (20-500 chars)",
    "area": "Community hub",
    "timing": "string"
  } | null,
  "guardrailWarning": "string" | null
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Message: "${userPrompt}"\n\nReturn JSON only.` }],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed && typeof parsed.reply === "string") {
            return {
              reply: parsed.reply,
              language: parsed.language === "ms" ? "ms" : "en",
              proposal: parsed.proposal ?? undefined,
              guardrailWarning: parsed.guardrailWarning ?? undefined,
            };
          }
        }
      }
    } catch {
      // Fall through to local parser
    }
  }

  if (openaiKey) {
    try {
      const userPrompt = messages[messages.length - 1]?.content ?? "";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You are "Tolong Assistant" for Sime Darby Property mutual-aid app. Understand English, Bahasa Melayu, and Manglish. Return JSON with { reply: string, language: "ms"|"en", proposal?: { type, category, title, description, area, timing }, guardrailWarning?: string }',
            },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed.reply === "string") {
            return {
              reply: parsed.reply,
              language: parsed.language === "ms" ? "ms" : "en",
              proposal: parsed.proposal ?? undefined,
              guardrailWarning: parsed.guardrailWarning ?? undefined,
            };
          }
        }
      }
    } catch {
      // Fall through to local parser
    }
  }

  return null;
}

// Master assistant function
export async function processAssistantRequest(
  messages: AssistantMessage[],
): Promise<AssistantResponse> {
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || !latestMessage.content.trim()) {
    return {
      reply: "Hello! How can I assist you with Tolong today? / Hai! Ada apa-apa yang boleh saya bantu hari ini?",
      language: "en",
    };
  }

  // 1. Try external LLM if API key is configured
  const llmResult = await callExternalLLM(messages);
  if (llmResult) return llmResult;

  // 2. Otherwise use the reliable rule-based conversational engine
  return parseLocalIntent(latestMessage.content, messages);
}
