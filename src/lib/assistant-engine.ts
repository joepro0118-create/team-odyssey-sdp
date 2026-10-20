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

export type LanguageChoice = "ms" | "en" | "zh" | "auto";

export type AssistantProposal = ListingInput;

export type AssistantResponse = {
  reply: string;
  proposal?: AssistantProposal;
  guardrailWarning?: string;
  language: "ms" | "en" | "zh";
};

// Prescription guardrail pattern (from marketplace-service.ts)
const PRESCRIPTION_REGEX =
  /\b(prescription|prescribed|preskripsi|ubat terkawal|antibiotic\w*|antibiotik\w*|insulin|amoxicillin|amoxicilin|amoksisilin|warfarin|tramadol|diazepam)\b|[\u4e00-\u9fff]*(处方|抗生素|胰岛素)/i;

// Emergency keywords
const EMERGENCY_REGEX =
  /\b(emergency|kecemasan|pencuri|kebakaran|terbakar|sesak nafas|sakit dada|ambulance|ambulans|police|polis|kemalangan teruk)\b|[\u4e00-\u9fff]*(紧急|救护车|着火|火灾|警察|救命)/i;

// Sales / Money keywords
const SALES_REGEX =
  /\b(?:rm\s*\d|myr\s*\d|for sale|jual|harga|beli dari saya|bayaran tunai|cash payment|sewa)\b|\$\s*\d|[\u4e00-\u9fff]*(买卖|现金|出售|售价)/i;

// Contact info keywords
const CONTACT_REGEX =
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().-]*){8,}|\b(?:unit|apartment|flat)\s*(?:no\.?\s*)?#?\s*\d/i;

// Language detection
export function detectLanguage(text: string): "ms" | "en" | "zh" {
  if (/[\u4e00-\u9fff]/.test(text)) {
    return "zh";
  }
  const malayPatterns =
    /\b(saya|nak|tolong|boleh|beli|makanan|ubat|kedai|terima kasih|jiran|bantuan|pinjam|tukar|baiki|rumah|petang|pagi|malam|hari|apa|macam mana|siapa|kat|di|dan|ada|tak|bukan|perlu|jom|makcik|pakcik|abang|kakak|tolongkan)\b/i;
  return malayPatterns.test(text) ? "ms" : "en";
}

// Built-in rule-based conversational processor (guaranteed offline fallback)
export function parseLocalIntent(
  userText: string,
  history: AssistantMessage[] = [],
  preferredLanguage?: LanguageChoice,
): AssistantResponse {
  const detected = detectLanguage(userText);
  const lang: "ms" | "en" | "zh" =
    preferredLanguage === "ms" || preferredLanguage === "en" || preferredLanguage === "zh"
      ? preferredLanguage
      : detected;
  const text = userText.trim();

  // 1. Guardrail: Prescription Drugs
  if (PRESCRIPTION_REGEX.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Maaf ya, demi keselamatan komuniti, Tolong tidak membenarkan permintaan ubat preskripsi atau ubat terkawal. Sila rujuk klinik kesihatan atau hospital berdekatan untuk bantuan perubatan. Kami sedia bantu jika anda perlukan barangan am atau barangan dapur!"
          : lang === "zh"
          ? "抱歉，为了社区居民安全，Tolong 平台不支援处方药或管制药物代取。请咨询注册诊所或医院。日常杂货或生活用品我们很乐意为您协助！"
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
          : lang === "zh"
          ? "这似乎涉及紧急状况！请立即拨打 999 或联系社区安保。Tolong 仅供日常邻里互助，无法处理突发紧急救援。"
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
          : lang === "zh"
          ? "Tolong 是专为邻里互助设立的无现金互助平台，不支援现金买卖。每次完成互助将获得 50 社区积分，可用于在“奖赏”页面兑换社区咖啡或休闲礼品！"
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
          : lang === "zh"
          ? "为了您的隐私安全，请勿在公开请求中透露电话号码、电邮或门牌号。当邻居接单后，联络资讯将以加密方式安全共享。"
          : "Please keep phone numbers, emails, and unit numbers out of public requests. Your private contact details will be shared securely with your neighbour only after the task is accepted.",
      guardrailWarning: "Personal contact information must remain private.",
    };
  }

  // 5. FAQ: Points & Rewards
  if (/\b(point|points|mata|ganjaran|reward|rewards|tebus|redeem)\b|积分|奖励|兑换/i.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Setiap kali anda membantu jiran dan mengesahkan penyerahan menggunakan kod QR, anda akan menerima 50 mata secara automatik! Anda boleh melihat baki mata dan menebus ganjaran seperti minuman kafe komuniti atau pas sukan di tab 'Rewards'."
          : lang === "zh"
          ? "每次协助邻居并通过动态二维码确认交接，您将自动获得 50 社区积分！您可以在“奖赏 (Rewards)”页面查看余额并兑换社区饮品或休闲通行证。"
          : "Every time you help a neighbour and complete the in-person QR confirmation, you automatically earn 50 community points! You can check your balance and redeem rewards (such as café drinks or sports court passes) in the 'Rewards' tab.",
    };
  }

  // 6. FAQ: How QR Code Works
  if (/\b(qr|handover|scan|imbas|penyerahan|kod)\b|二维码|扫码/i.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Pengesahan kod QR memastikan keselamatan kedua-dua pihak. Apabila tugasan selesai secara bersemuka, pemohon akan memaparkan kod QR (sah selama 15 minit). Pembantu hanya perlu mengimbas kod tersebut untuk melengkapkan tugas dan menerima 50 mata ganjaran serta merta!"
          : lang === "zh"
          ? "二维码交接保障双方安全。当互助当面完成时，协助者展示 15 分钟单次有效二维码，求助者使用手机扫描即确认完成，50 积分立刻发放！"
          : "The QR code confirms in-person task completion safely. When meeting up, the requester shows a single-use 15-minute QR code. The helper scans it with their phone to confirm completion, instantly earning 50 points!",
    };
  }

  // 7. FAQ: General Platform Overview
  if (/\b(how it works|apa itu tolong|how does tolong work|tentang tolong|about tolong)\b|怎么运作|关于tolong/i.test(text)) {
    return {
      language: lang,
      reply:
        lang === "ms"
          ? "Tolong ialah platform kejiranan untuk penduduk township Sime Darby Property. Anda boleh meminta bantuan harian, menawarkan bantuan kepada jiran, atau meminjamkan peralatan rumah. Semuanya selamat, peribadi, dan disokong oleh mata ganjaran komuniti!"
          : lang === "zh"
          ? "Tolong 是专为森那美地产 (Sime Darby Property) 社区居民打造的邻里互助平台。您可以发布互助请求、借用日常工具，或参与社区协助赚取积分！"
          : "Tolong is a hyper-local township mutual aid app for Sime Darby Property residents. You can post requests for help, offer your skills, or lend everyday items. It's completely cashless, verified, and rewarded through township points!",
    };
  }

  // 8. Intent: Create a Listing (Request / Offer / Lend)
  // Check for keywords indicating a task request, offer, or lending
  const isLending = /\b(pinjam|pinjamkan|borrow|lend|lending|sewa|equipment|alatan)\b|借用|出借|借梯子/i.test(text);
  const isOffer = /\b(saya boleh tolong|offering help|sedia membantu|willing to help|can help with|i can help)\b|我可以帮忙|可以帮/i.test(text);
  const isRequest =
    isLending ||
    isOffer ||
    /\b(tolong|bantu|help|need|perlu|nak|minta|belikan|baiki|hantar|angkut|cari|tukar|teman)\b|帮忙|需要|求助|代买|买|修理|换/i.test(text);

  if (isRequest) {
    let type: ListingType = "request";
    if (isOffer) type = "offer";
    else if (isLending && /\b(saya ada|siapa nak pinjam|boleh pinjamkan|offering to lend)\b|我可以借出|借给/i.test(text)) type = "lend";

    // Determine category
    let category: Category = "Food & groceries";
    if (/\b(lampu|mentol|paip|rumput|taman|cat|baiki|repair|fix|lightbulb|leak|garden|lawn|plumbing|singki)\b|灯泡|修缮|花园|漏水|水喉/i.test(text)) {
      category = "Home & garden";
    } else if (/\b(pinjam|tangga|gerudi|drill|mesin|cangkul|borrow|lend|ladder|tools|alatan)\b|借|梯子|工具|电钻/i.test(text)) {
      category = "Borrow & lend";
    } else if (/\b(parcel|pos|bungkusan|surat|suratkhabar|errand|courier|ambilkan)\b|快递|包裹|信件|跑腿/i.test(text)) {
      category = "Errands";
    } else if (/\b(panadol|minyak angin|plaster|koyok|cough drop|otc|demam|selsema)\b|感冒药|风油|膏药|退烧/i.test(text)) {
      category = "Medicine (OTC)";
    } else if (/\b(telefon|fon|laptop|komputer|wifi|internet|phone|tv|app|tech|setting)\b|手机|电脑|网络|设置/i.test(text)) {
      category = "Skills & tech";
    } else if (/\b(angkat|kotak|berat|pindah|sofa|meja|carry|heavy|lift|move)\b|搬|重物|箱子|家具/i.test(text)) {
      category = "Carrying";
    } else if (/\b(teman|borak|jalan|sembang|sunyi|walk|chat|company|elderly|berbual)\b|散步|聊天|陪伴|老人/i.test(text)) {
      category = "Company";
    } else if (/\b(makan|roti|telur|susu|kedai|pasar|groceries|food|bread|eggs|shop|kedai runcit)\b|面包|鸡蛋|牛奶|杂货|买菜|食物/i.test(text)) {
      category = "Food & groceries";
    }

    // Determine timing
    let timing = "Today around 5 pm";
    if (/\besok\b|\btomorrow\b|明天/i.test(text)) timing = "Tomorrow morning";
    else if (/\bmalam\b|\btonight\b|今晚/i.test(text)) timing = "Tonight after 8 pm";
    else if (/\bsegera\b|\basap\b|\bnow\b|\bsekarang\b|立刻|马上/i.test(text)) timing = "Today, as soon as possible";
    else if (/\bpagi\b|\bmorning\b|早上/i.test(text)) timing = "Tomorrow at 10 am";
    else if (/\bpetang\b|\bafternoon\b|下午/i.test(text)) timing = "Today before 6 pm";

    // Build title and description
    let title = "";
    let description = "";

    if (category === "Food & groceries") {
      title = lang === "ms" ? "Tolong belikan barangan dapur" : lang === "zh" ? "代买日常杂货与食材" : "Help pick up groceries";
      description =
        lang === "ms"
          ? `Perlukan bantuan jiran untuk mengambil beberapa barangan dapur (contoh: ${text.slice(0, 80)}) dari kedai berdekatan.`
          : lang === "zh"
          ? `寻求热心邻居协助代买日常杂货或生活必需品 (${text.slice(0, 80)})。`
          : `Seeking a neighbour's help to pick up a few grocery essentials (${text.slice(0, 80)}) from the local shop.`;
    } else if (category === "Borrow & lend") {
      title = lang === "ms" ? "Pinjam alatan rumah dari jiran" : lang === "zh" ? "借用居家工具或折叠梯" : "Borrow household tool";
      description =
        lang === "ms"
          ? `Mencari jiran yang sudi meminjamkan peralatan (${text.slice(0, 80)}). Akan dipulangkan dalam keadaan baik dan bersih.`
          : lang === "zh"
          ? `希望向邻居借用居家生活或维修工具 (${text.slice(0, 80)})，用毕立刻清洁归还。`
          : `Looking to borrow household equipment (${text.slice(0, 80)}). Will return promptly in clean condition.`;
    } else if (category === "Home & garden") {
      title = lang === "ms" ? "Bantuan baiki rumah atau taman" : lang === "zh" ? "协助居家简易维修或更换" : "Help with home or garden fix";
      description =
        lang === "ms"
          ? `Perlukan pertolongan jiran untuk kerja kecil di rumah (${text.slice(0, 80)}). Sangat menghargai bantuan jiran.`
          : lang === "zh"
          ? `需要热心邻居协助处理家中简易修缮或灯泡更换 (${text.slice(0, 80)})，非常感谢！`
          : `Looking for neighbourly assistance with a minor home or garden task (${text.slice(0, 80)}). Greatly appreciated.`;
    } else if (category === "Skills & tech") {
      title = lang === "ms" ? "Bantuan tetapan teknologi atau telefon" : lang === "zh" ? "协助手机或数码设备设置" : "Help with phone or tech setup";
      description =
        lang === "ms"
          ? `Perlukan bantuan seorang jiran untuk membantu tetapan digital (${text.slice(0, 80)}).`
          : lang === "zh"
          ? `寻求懂数码设备的邻居协助设置手机或网络 (${text.slice(0, 80)})。`
          : `Need a hand with digital settings or tech devices (${text.slice(0, 80)}).`;
    } else if (category === "Medicine (OTC)") {
      title = lang === "ms" ? "Bantuan belikan keperluan asas am (OTC)" : lang === "zh" ? "代买非处方常备医药用品" : "Help pick up over-the-counter essentials";
      description =
        lang === "ms"
          ? `Minta tolong belikan ubat am tanpa preskripsi dari farmasi (${text.slice(0, 80)}).`
          : lang === "zh"
          ? `请邻居协助到药剂行代买非处方日常护理或常备健康用品 (${text.slice(0, 80)})。`
          : `Seeking assistance to purchase over-the-counter wellness supplies from the pharmacy (${text.slice(0, 80)}).`;
    } else {
      title = lang === "ms" ? "Permintaan bantuan kejiranan" : lang === "zh" ? "邻里日常互助求助" : "Neighbourhood assistance request";
      description =
        lang === "ms"
          ? `Mencari jiran yang sudi membantu dengan tugasan (${text.slice(0, 100)}). Terima kasih daun keladi!`
          : lang === "zh"
          ? `寻找热心邻居协助日常琐事 (${text.slice(0, 100)})，感谢您的守望相助！`
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
          : lang === "zh"
          ? "我已为您起草好请求！请在下方核对详情，确认无误后点击“确认并发布”。"
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
        : lang === "zh"
        ? "您好！我是 Tolong 智能邻里小助手 👋 我可以协助您起草邻里请求、解答积分奖励疑问，或协助您发布互助。请问今天有什么我可以帮忙的吗？"
        : "Hello! I am your Tolong Assistant. I can help you draft a request for your neighbours, answer questions about community points, or explain how Tolong works. How can I help you today?",
  };
}

// Optional LLM API caller (Google Gemini or OpenAI if configured)
export async function callExternalLLM(
  messages: AssistantMessage[],
  preferredLanguage?: LanguageChoice,
): Promise<AssistantResponse | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const langPrompt =
    preferredLanguage === "ms"
      ? "\nPreferred Language: Bahasa Melayu (Malay). You MUST reply and create proposals in Bahasa Melayu."
      : preferredLanguage === "zh"
      ? "\nPreferred Language: Chinese (Mandarin / 中文). You MUST reply and create proposals in Simplified Chinese."
      : preferredLanguage === "en"
      ? "\nPreferred Language: English. You MUST reply and create proposals in English."
      : "";

  if (geminiKey) {
    try {
      const userPrompt = messages[messages.length - 1]?.content ?? "";
      const systemPrompt = `You are "Tolong Assistant", a warm, empathetic, multilingual (English, Bahasa Melayu, and Chinese / 中文) AI assistant for a township community mutual-aid app developed for Sime Darby Property residents.${langPrompt}
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
  "language": "ms" | "en" | "zh",
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
              language: parsed.language === "ms" ? "ms" : parsed.language === "zh" ? "zh" : "en",
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
                'You are "Tolong Assistant" for Sime Darby Property mutual-aid app. Understand English, Bahasa Melayu, and Chinese (中文). Return JSON with { reply: string, language: "ms"|"en"|"zh", proposal?: { type, category, title, description, area, timing }, guardrailWarning?: string }',
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
              language: parsed.language === "ms" ? "ms" : parsed.language === "zh" ? "zh" : "en",
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
  optionsOrLang?: LanguageChoice | { preferredLanguage?: LanguageChoice },
): Promise<AssistantResponse> {
  const preferredLanguage =
    typeof optionsOrLang === "string" ? optionsOrLang : optionsOrLang?.preferredLanguage;
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || !latestMessage.content.trim()) {
    const lang = preferredLanguage === "ms" ? "ms" : preferredLanguage === "zh" ? "zh" : "en";
    return {
      reply:
        lang === "ms"
          ? "Hai! Ada apa-apa yang boleh saya bantu hari ini?"
          : lang === "zh"
          ? "您好！请问有什么我可以协助您的吗？"
          : "Hello! How can I assist you with Tolong today?",
      language: lang,
    };
  }

  // 1. Try external LLM if API key is configured
  const llmResult = await callExternalLLM(messages, preferredLanguage);
  if (llmResult) return llmResult;

  // 2. Otherwise use the reliable rule-based conversational engine
  return parseLocalIntent(latestMessage.content, messages, preferredLanguage);
}
