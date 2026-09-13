export interface ParsedWebExpense {
  amount: number | null;
  title: string;
  payerId: string | null;
  payerName: string | null;
  splitMemberIds: string[];
  category: string;
  rawInput: string;
}

export function inferCategory(title: string): string {
  const t = title.toLowerCase();

  // Food
  if (
    t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") ||
    t.includes("food") || t.includes("coffee") || t.includes("cafe") ||
    t.includes("drink") || t.includes("beer") || t.includes("pizza") ||
    t.includes("burger") || t.includes("tea") || t.includes("snack") ||
    t.includes("restaurant") || t.includes("swiggy") || t.includes("zomato")
  ) {
    return "Food";
  }

  // Travel
  if (
    t.includes("uber") || t.includes("ola") || t.includes("flight") ||
    t.includes("cab") || t.includes("taxi") || t.includes("fuel") ||
    t.includes("petrol") || t.includes("metro") || t.includes("train") ||
    t.includes("toll") || t.includes("auto") || t.includes("bus")
  ) {
    return "Travel";
  }

  // Stay
  if (
    t.includes("hotel") || t.includes("airbnb") || t.includes("stay") ||
    t.includes("room") || t.includes("rent") || t.includes("resort") ||
    t.includes("hostel")
  ) {
    return "Stay";
  }

  // Fun
  if (
    t.includes("movie") || t.includes("cinema") || t.includes("party") ||
    t.includes("club") || t.includes("game") || t.includes("ticket") ||
    t.includes("bowling") || t.includes("concert")
  ) {
    return "Fun";
  }

  // Bills
  if (
    t.includes("wifi") || t.includes("internet") || t.includes("electric") ||
    t.includes("water") || t.includes("bill") || t.includes("recharge") ||
    t.includes("maid") || t.includes("cook") || t.includes("netflix") ||
    t.includes("spotify") || t.includes("broadband")
  ) {
    return "Bills";
  }

  // Shopping
  if (
    t.includes("grocer") || t.includes("supermarket") || t.includes("amazon") ||
    t.includes("clothes") || t.includes("shopping") || t.includes("mart")
  ) {
    return "Shopping";
  }

  return "General";
}

export function parseExpenseText(
  text: string,
  group: any,
  currentUserId?: string
): ParsedWebExpense {
  let working = text.trim();
  const members = group?.members || [];
  const currentMember = members.find((m: any) => m.id === currentUserId) || members[0];

  // 1. Amount
  const amountRegex = /(?:₹|\$|€|£|INR|USD|EUR)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const amountMatch = working.match(amountRegex);
  let amount: number | null = null;

  if (amountMatch && amountMatch[1]) {
    const rawVal = amountMatch[1].replace(/,/g, "");
    const parsedNum = parseFloat(rawVal);
    if (!isNaN(parsedNum)) {
      amount = parsedNum;
    }
    working = (working.slice(0, amountMatch.index!) + " " + working.slice(amountMatch.index! + amountMatch[0].length)).trim();
  }

  // 2. Payer
  let matchedPayerId: string | null = null;
  let matchedPayerName: string | null = null;

  const paidByRegex = /\b(?:paid\s+by|payer|by)\s+([a-zA-Z0-9_\s]+?)(?=\s+(?:for|split|between|with)|\s*$)/i;
  const paidByMatch = working.match(paidByRegex);

  if (paidByMatch && paidByMatch[1]) {
    const candidate = paidByMatch[1].trim().toLowerCase();
    if (candidate === "me" || candidate === "myself" || candidate === "i") {
      matchedPayerId = currentUserId || currentMember?.id || null;
      matchedPayerName = currentMember?.name || "You";
    } else {
      for (const m of members) {
        const name = (m.name || m.displayName || "").toLowerCase();
        const firstName = name.split(" ")[0];
        if (name === candidate || firstName === candidate || candidate.includes(firstName)) {
          matchedPayerId = m.id;
          matchedPayerName = m.name || m.displayName;
          break;
        }
      }
    }
    working = (working.slice(0, paidByMatch.index!) + " " + working.slice(paidByMatch.index! + paidByMatch[0].length)).trim();
  }

  if (!matchedPayerId) {
    matchedPayerId = currentUserId || currentMember?.id || null;
    matchedPayerName = currentMember?.name || "You";
  }

  // 3. Split with
  let splitMemberIds: string[] = [];
  const splitRegex = /\b(?:for|split\s+between|split\s+with|with)\s+([a-zA-Z0-9_,\s&]+)$/i;
  const splitMatch = working.match(splitRegex);

  if (splitMatch && splitMatch[1]) {
    const splitCand = splitMatch[1].trim().toLowerCase();
    if (splitCand.includes("all") || splitCand.includes("everyone") || splitCand.includes("equally")) {
      splitMemberIds = members.map((m: any) => m.id);
    } else {
      const tokens = splitCand
        .replace(/&/g, ",")
        .replace(/\sand\s/g, ",")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      for (const tok of tokens) {
        if (tok === "me" || tok === "myself") {
          if (currentUserId && !splitMemberIds.includes(currentUserId)) {
            splitMemberIds.push(currentUserId);
          }
          continue;
        }
        for (const m of members) {
          const name = (m.name || m.displayName || "").toLowerCase();
          const firstName = name.split(" ")[0];
          if (name === tok || firstName === tok || tok.includes(firstName)) {
            if (!splitMemberIds.includes(m.id)) {
              splitMemberIds.push(m.id);
            }
            break;
          }
        }
      }
    }
    working = (working.slice(0, splitMatch.index!) + " " + working.slice(splitMatch.index! + splitMatch[0].length)).trim();
  }

  if (splitMemberIds.length === 0) {
    splitMemberIds = members.map((m: any) => m.id);
  }

  // 4. Clean Title
  let cleanedTitle = working
    .replace(/\b(paid|for|split|between|by|equally|with|at)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

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
  };
}
