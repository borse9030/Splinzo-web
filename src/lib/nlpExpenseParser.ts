export interface ParsedWebExpense {
  amount: number | null;
  title: string;
  payerId: string | null;
  payerName: string | null;
  splitMemberIds: string[];
  category: string;
  rawInput: string;
  isAiEnhanced?: boolean;
  isConversational?: boolean;
}

// Spoken verbal numbers dictionary (English & Hindi/Hinglish)
const VERBAL_NUMBERS: Record<string, number> = {
  // English words
  "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
  "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
  "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
  "hundred": 100, "thousand": 1000,
  // Hindi numbers
  "ek": 1, "do": 2, "teen": 3, "chaar": 4, "char": 4,
  "paanch": 5, "panch": 5, "chhe": 6, "che": 6, "saat": 7,
  "aath": 8, "ath": 8, "nau": 9, "das": 10, "gyarah": 11,
  "barah": 12, "terah": 13, "chaudah": 14, "pandrah": 15,
  "solah": 16, "satrah": 17, "atharah": 18, "unnis": 19,
  "bees": 20, "tees": 30, "chalis": 40, "pachas": 50,
  // Compound amounts
  "dedh sau": 150, "dhai sau": 250, "dedh hazaar": 1500, "dhai hazaar": 2500,
  "barah sau": 1200, "pandrah sau": 1500, "do hazaar": 2000, "teen hazaar": 3000,
  "paanch hazaar": 5000,
  // Units
  "sau": 100, "hazaar": 1000, "hazar": 1000, "lakh": 100000,
};

export function normalizeSpokenText(text: string): string {
  let normalized = text.toLowerCase();

  // 1. Currency terms to symbol
  normalized = normalized.replace(/\b(rupees|rupee|inr|rs\.?|bucks|dollars?|euro)\b/gi, "₹");
  normalized = normalized.replace(/\b([0-9]+)\s*(?:ka|ki|ke)\b/gi, "$1");

  // 2. Multipliers: "1.5k" -> "1500", "2k" -> "2000"
  normalized = normalized.replace(/\b([0-9]+(?:\.[0-9]+)?)\s*k\b/gi, (_, num) => {
    return String(Math.round(parseFloat(num) * 1000));
  });

  // 3. Multi-word phrases: "dedh sau" -> 150, "barah sau" -> 1200
  const multiWords = ["dedh hazaar", "dhai hazaar", "dedh sau", "dhai sau", "barah sau", "pandrah sau", "do hazaar", "teen hazaar", "paanch hazaar"];
  for (const mw of multiWords) {
    if (normalized.includes(mw)) {
      normalized = normalized.replaceAll(mw, String(VERBAL_NUMBERS[mw]));
    }
  }

  // 4. Single-word numbers: "teen sau" -> 300, "paanch sau" -> 500
  normalized = normalized.replace(/\b(ek|do|teen|chaar|paanch|chhe|saat|aath|nau|das|barah|pandrah|bees)\s+sau\b/gi, (_, unit) => {
    const mult = VERBAL_NUMBERS[unit.toLowerCase()] || 1;
    return String(mult * 100);
  });

  normalized = normalized.replace(/\b(ek|do|teen|chaar|paanch|chhe|saat|aath|nau|das)\s+hazaar\b/gi, (_, unit) => {
    const mult = VERBAL_NUMBERS[unit.toLowerCase()] || 1;
    return String(mult * 1000);
  });

  // 4.5. Protect imperative Hindi verbs "do / de" (e.g. "kar do", "split kar do", "adjust kar do")
  // so that "kar do" does NOT turn into "kar 2"
  normalized = normalized.replace(/\b(kar|split|adjust|de|bhej|daal|dal|mat)\s+(do|de)\b/gi, "$1__VERB_DO__");
  normalized = normalized.replace(/\b(kardo|karde|dedo|bhejdo)\b/gi, "$1__VERB_DO__");

  // 5. Individual number words
  for (const [word, val] of Object.entries(VERBAL_NUMBERS)) {
    if (!word.includes(" ")) {
      const reg = new RegExp(`\\b${word}\\b`, "gi");
      normalized = normalized.replace(reg, String(val));
    }
  }

  // Restore protected verbs
  normalized = normalized.replace(/__VERB_DO__/g, " do");

  return normalized;
}

export function inferCategory(title: string): string {
  const t = title.toLowerCase();

  // Food & Dining
  if (
    t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") ||
    t.includes("food") || t.includes("coffee") || t.includes("cafe") ||
    t.includes("drink") || t.includes("beer") || t.includes("pizza") ||
    t.includes("burger") || t.includes("tea") || t.includes("snack") ||
    t.includes("restaurant") || t.includes("swiggy") || t.includes("zomato") ||
    t.includes("chai") || t.includes("nashta") || t.includes("khana") || t.includes("daru") ||
    t.includes("puri") || t.includes("pani puri") || t.includes("panipuri")
  ) {
    return "Food";
  }

  // Travel & Transport
  if (
    t.includes("uber") || t.includes("ola") || t.includes("flight") ||
    t.includes("cab") || t.includes("taxi") || t.includes("fuel") ||
    t.includes("petrol") || t.includes("diesel") || t.includes("metro") ||
    t.includes("train") || t.includes("toll") || t.includes("auto") ||
    t.includes("bus") || t.includes("cng")
  ) {
    return "Travel";
  }

  // Stay / Accommodation
  if (
    t.includes("hotel") || t.includes("airbnb") || t.includes("stay") ||
    t.includes("room") || t.includes("rent") || t.includes("resort") ||
    t.includes("hostel") || t.includes("kiraya")
  ) {
    return "Stay";
  }

  // Entertainment / Fun
  if (
    t.includes("movie") || t.includes("cinema") || t.includes("party") ||
    t.includes("club") || t.includes("game") || t.includes("ticket") ||
    t.includes("bowling") || t.includes("concert") || t.includes("match")
  ) {
    return "Fun";
  }

  // Bills & Utilities
  if (
    t.includes("wifi") || t.includes("wi-fi") || t.includes("internet") ||
    t.includes("electric") || t.includes("water") || t.includes("bill") ||
    t.includes("recharge") || t.includes("maid") || t.includes("cook") ||
    t.includes("netflix") || t.includes("spotify") || t.includes("broadband")
  ) {
    return "Bills";
  }

  // Groceries & Shopping
  if (
    t.includes("grocer") || t.includes("supermarket") || t.includes("amazon") ||
    t.includes("clothes") || t.includes("shopping") || t.includes("mart") ||
    t.includes("sabzi") || t.includes("blinkit") || t.includes("zepto") ||
    t.includes("instamart")
  ) {
    return "Shopping";
  }

  return "General";
}

function stripHonorifics(name: string): string {
  return name.replace(/\b(bhai|ji|bro|dost|sir)\b/gi, "").trim();
}

export function parseExpenseText(
  text: string,
  group: any,
  currentUserId?: string
): ParsedWebExpense {
  const normalizedRaw = normalizeSpokenText(text);
  let working = normalizedRaw;
  const members: any[] = group?.members || [];
  const currentMember = members.find((m: any) => m.id === currentUserId) || members[0];

  // Helper for matching member name
  const findMemberByName = (query: string) => {
    const q = stripHonorifics(query.trim().toLowerCase());
    if (!q) return null;
    if (q === "me" || q === "myself" || q === "i" || q === "you" || q === "maine" || q === "mene" || q === "mere") {
      return currentMember;
    }
    for (const m of members) {
      const full = (m.name || m.displayName || "").toLowerCase();
      const first = full.split(" ")[0];
      if (full === q || first === q || full.includes(q) || q.includes(first)) {
        return m;
      }
    }
    return null;
  };

  // 1. Amount Extraction (Score-based prioritization to pick real amounts over spurious numbers)
  const amountPattern = /(?:₹|\$|€|£)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;
  const matches = Array.from(working.matchAll(amountPattern));
  let amount: number | null = null;
  let bestMatch: RegExpMatchArray | null = null;

  if (matches.length > 0) {
    let bestScore = -1;
    for (const m of matches) {
      const numStr = m[1].replace(/,/g, "");
      const val = parseFloat(numStr);
      if (isNaN(val) || val <= 0) continue;

      let score = val; // Baseline: higher values prioritized (e.g. 1000 over 2)
      const fullMatch = m[0];
      const matchIndex = m.index ?? 0;
      const afterSlice = working.slice(matchIndex + fullMatch.length, matchIndex + fullMatch.length + 12).toLowerCase();
      const beforeSlice = working.slice(Math.max(0, matchIndex - 12), matchIndex).toLowerCase();

      if (fullMatch.includes("₹") || fullMatch.includes("$") || fullMatch.includes("€") || fullMatch.includes("£")) {
        score += 1000000;
      }
      if (/\b(?:ka|ki|ke|rs|inr|rupaye)\b/i.test(afterSlice) || /\b(?:ka|ki|ke)\b/i.test(beforeSlice)) {
        score += 500000;
      }
      if (/\b(?:for|amount|total)\b/i.test(beforeSlice)) {
        score += 200000;
      }

      if (score > bestScore) {
        bestScore = score;
        amount = val;
        bestMatch = m;
      }
    }

    if (bestMatch && bestMatch.index !== undefined) {
      working = (working.slice(0, bestMatch.index) + " " + working.slice(bestMatch.index + bestMatch[0].length)).trim();
    }
  }

  // 2. Payer Extraction
  let matchedPayerId: string | null = null;
  let matchedPayerName: string | null = null;

  // A. English Payer: "paid by [name]", "done by [name]", "that is done by [name]", "by [name]"
  const payerPrefixRegex = /\b(?:paid\s+by|done\s+by|that\s+is\s+done\s+by|payer|by)\s+([a-zA-Z0-9_\s]+?)(?=\s+(?:for|split|between|with|ke\s+saath|ke\s+liye)|\s*$)/i;
  const payerPrefixMatch = working.match(payerPrefixRegex);

  if (payerPrefixMatch && payerPrefixMatch[1]) {
    const candidate = payerPrefixMatch[1].trim();
    const matched = findMemberByName(candidate);
    if (matched) {
      matchedPayerId = matched.id;
      matchedPayerName = matched.id === currentUserId ? "You" : (matched.name || matched.displayName);
      working = (working.slice(0, payerPrefixMatch.index!) + " " + working.slice(payerPrefixMatch.index! + payerPrefixMatch[0].length)).trim();
    }
  }

  // B. Hindi Postposition Payer: "[name] ne diya", "[name] ne pay kiya", "maine diya"
  if (!matchedPayerId) {
    const hindiPayerRegex = /\b([a-zA-Z0-9_\s]+?)\s+(?:ne\s+diya|ne\s+pay\s+kiya|ne\s+diye|ne\s+bharatha)\b/i;
    const hindiPayerMatch = working.match(hindiPayerRegex);
    if (hindiPayerMatch && hindiPayerMatch[1]) {
      const candidate = hindiPayerMatch[1].trim();
      const matched = findMemberByName(candidate);
      if (matched) {
        matchedPayerId = matched.id;
        matchedPayerName = matched.id === currentUserId ? "You" : (matched.name || matched.displayName);
        working = (working.slice(0, hindiPayerMatch.index!) + " " + working.slice(hindiPayerMatch.index! + hindiPayerMatch[0].length)).trim();
      }
    }
  }

  // C. Someone paid: "[name] paid"
  if (!matchedPayerId) {
    const namePaidRegex = /\b([a-zA-Z0-9_]+)\s+paid\b/i;
    const namePaidMatch = working.match(namePaidRegex);
    if (namePaidMatch && namePaidMatch[1]) {
      const candidate = namePaidMatch[1].trim();
      const matched = findMemberByName(candidate);
      if (matched) {
        matchedPayerId = matched.id;
        matchedPayerName = matched.id === currentUserId ? "You" : (matched.name || matched.displayName);
        working = (working.slice(0, namePaidMatch.index!) + " " + working.slice(namePaidMatch.index! + namePaidMatch[0].length)).trim();
      }
    }
  }

  // Default payer to current user
  if (!matchedPayerId) {
    matchedPayerId = currentUserId || currentMember?.id || null;
    matchedPayerName = currentMember?.name || "You";
  }

  // 3. Split Member Extraction (Specific Member Splits!)
  const splitMemberIds: string[] = [];
  const effectivePayerId = matchedPayerId || currentUserId || currentMember?.id;

  // A. Explicit "for all", "sabke liye", "equally", "sab me"
  const isForAll = /\b(?:for\s+all|split\s+with\s+all|all|everyone|equally|sabke\s+liye|sab\s+me)\b/i.test(working);
  if (isForAll) {
    splitMemberIds.push(...members.map((m: any) => m.id));
    working = working.replace(/\b(?:for\s+all|split\s+with\s+all|all|everyone|equally|sabke\s+liye|sab\s+me)\b/gi, "").trim();
  }

  // B. Individual Claim: "only for [name]" / "sirf [name] ke liye" (1 person only)
  if (splitMemberIds.length === 0) {
    const individualRegex = /\b(?:only\s+for|sirf)\s+([a-zA-Z0-9_\s]+?)(?:\s+ke\s+liye)?$/i;
    const individualMatch = working.match(individualRegex);
    if (individualMatch && individualMatch[1]) {
      const candidate = individualMatch[1].trim();
      const matched = findMemberByName(candidate);
      if (matched) {
        splitMemberIds.push(matched.id);
        working = (working.slice(0, individualMatch.index!) + " " + working.slice(individualMatch.index! + individualMatch[0].length)).trim();
      }
    }
  }

  // C. Split Between Two or more Members: "between [name1] and [name2]" / "[name1] aur [name2] ke beech"
  if (splitMemberIds.length === 0) {
    const betweenRegex = /\b(?:between|split\s+between)\s+([a-zA-Z0-9_\s&,]+?)(?:\s+(?:ke\s+beech|ke\s+bich))?$/i;
    const betweenMatch = working.match(betweenRegex);
    if (betweenMatch && betweenMatch[1]) {
      const candidates = betweenMatch[1]
        .replace(/&/g, ",")
        .replace(/\b(and|aur)\b/gi, ",")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      for (const cand of candidates) {
        const matched = findMemberByName(cand);
        if (matched && !splitMemberIds.includes(matched.id)) {
          splitMemberIds.push(matched.id);
        }
      }
      if (splitMemberIds.length > 0) {
        working = (working.slice(0, betweenMatch.index!) + " " + working.slice(betweenMatch.index! + betweenMatch[0].length)).trim();
      }
    }
  }

  // D. "split with [name]" / "with [name]" / "[name] ke saath"
  if (splitMemberIds.length === 0) {
    const hindiWithRegex = /\b([a-zA-Z0-9_\s]+?)\s+(?:ke\s+saath|ke\s+sath)(?:\s+split)?$/i;
    const hindiWithMatch = working.match(hindiWithRegex);
    if (hindiWithMatch && hindiWithMatch[1]) {
      const candidate = hindiWithMatch[1].trim();
      const matched = findMemberByName(candidate);
      if (matched) {
        if (effectivePayerId && !splitMemberIds.includes(effectivePayerId)) {
          splitMemberIds.push(effectivePayerId);
        }
        if (!splitMemberIds.includes(matched.id)) {
          splitMemberIds.push(matched.id);
        }
        working = (working.slice(0, hindiWithMatch.index!) + " " + working.slice(hindiWithMatch.index! + hindiWithMatch[0].length)).trim();
      }
    }
  }

  if (splitMemberIds.length === 0) {
    const splitWithRegex = /\b(?:split\s+with|with|for)\s+([a-zA-Z0-9_\s&,]+)$/i;
    const splitWithMatch = working.match(splitWithRegex);
    if (splitWithMatch && splitWithMatch[1]) {
      const candidateStr = splitWithMatch[1].trim();
      const candidates = candidateStr
        .replace(/&/g, ",")
        .replace(/\b(and|aur)\b/gi, ",")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      for (const cand of candidates) {
        const matched = findMemberByName(cand);
        if (matched && !splitMemberIds.includes(matched.id)) {
          splitMemberIds.push(matched.id);
        }
      }

      if (splitMemberIds.length > 0) {
        if (effectivePayerId && !splitMemberIds.includes(effectivePayerId)) {
          splitMemberIds.unshift(effectivePayerId);
        }
        working = (working.slice(0, splitWithMatch.index!) + " " + working.slice(splitWithMatch.index! + splitWithMatch[0].length)).trim();
      }
    }
  }

  // E. Mention of members anywhere in sentence: check all members
  if (splitMemberIds.length === 0 && members.length > 0) {
    for (const m of members) {
      const firstName = (m.name || m.displayName || "").split(" ")[0].toLowerCase();
      if (firstName.length >= 3 && new RegExp(`\\b${firstName}\\b`, "i").test(working)) {
        if (effectivePayerId && !splitMemberIds.includes(effectivePayerId)) {
          splitMemberIds.push(effectivePayerId);
        }
        if (!splitMemberIds.includes(m.id)) {
          splitMemberIds.push(m.id);
        }
      }
    }
  }

  // Default fallback: if no specific split mentioned, split with ALL members
  if (splitMemberIds.length === 0) {
    splitMemberIds.push(...members.map((m: any) => m.id));
  }

  // 4. Clean Title
  let cleanedTitle = working
    .replace(/\b(paid|done|by|for|split|between|equally|with|at|that|is|me|mere|diya|diye|ne|bharatha|sirf|ke|saath|sath|liye|beech|bich|aur|and|kar|do|kardo|adjust|barabar|properly|properli|sab|kuchh|kuch|nahin|nahi|vishay|phool|mein|bhejo|daal)\b/gi, "")
    .replace(/₹|\$|€|£/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Remove any member names from title
  for (const m of members) {
    const fn = (m.name || m.displayName || "").split(" ")[0].toLowerCase();
    if (fn.length >= 3) {
      cleanedTitle = cleanedTitle.replace(new RegExp(`\\b${fn}\\b`, "gi"), "").trim();
    }
  }

  cleanedTitle = cleanedTitle.replace(/\s+/g, " ").trim();

  const isConversational =
    text.trim().split(/\s+/).length >= 5 ||
    cleanedTitle.split(/\s+/).length >= 4 ||
    cleanedTitle.length > 25;

  if (!cleanedTitle) {
    cleanedTitle = "Quick Expense";
  } else {
    cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  }

  const category = inferCategory(cleanedTitle);

  return {
    amount,
    title: cleanedTitle,
    payerId: matchedPayerId,
    payerName: matchedPayerName,
    splitMemberIds,
    category,
    rawInput: text,
    isConversational,
  };
}
