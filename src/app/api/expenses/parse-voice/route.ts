import { NextResponse } from "next/server";

const DEFAULT_API_KEY = "AIzaSyDXnaLcDUnBzYEjk7wsHCgvLqfKysg4GVE";
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, groupMembers = [], currentUserId, currentUserName, groupName = "Group" } = body;

    const trimmedText = (text || "").trim();
    if (!trimmedText) {
      return NextResponse.json({ success: false, error: "Empty text prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || DEFAULT_API_KEY;

    // Prepare clean member representation for the prompt
    const memberList = groupMembers.map((m: any) => ({
      id: m.id,
      name: m.id === currentUserId ? "You" : (m.name || m.displayName || "Member"),
      actualName: m.name || m.displayName || "Member",
    }));

    if (memberList.length === 0 && currentUserId) {
      memberList.push({
        id: currentUserId,
        name: "You",
        actualName: currentUserName || "You",
      });
    }

    const prompt = `
You are an intelligent expense parser for an expense sharing application (Splinzo).
Extract structured expense information from this spoken voice input:
"${trimmedText}"

Context:
- Current user: "You" (${currentUserName || "You"})
- Group name: ${groupName}
- Available group members: ${JSON.stringify(memberList.map((m: any) => m.name))}

Return a strict JSON object with these exact keys:
1. "title": string (clean, concise name of the item or activity, e.g. "Dinner", "Petrol", "Movie Tickets", "Groceries")
2. "amount": number (total amount in digits, e.g. 500, 1200.50. If unmentioned, 0)
3. "payer": string (member name who paid, or "You" if the current user paid or said "by me" / "maine diya")
4. "splitMembers": array of strings (names of members who share this expense. If user says "split with Rahul", return ["You", "Rahul"]. If user says "between Rahul and Sneha", return ["Rahul", "Sneha"]. If user says "only for Rahul", return ["Rahul"]. If split between all or unspecified, return all available group members).
5. "category": string (one of: "Food", "Travel", "Stay", "Fun", "Bills", "Shopping", "General")
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.warn("[Gemini API] Request failed with status:", geminiRes.status, errText);
      return NextResponse.json({ success: false, error: `Gemini error ${geminiRes.status}` }, { status: 502 });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({ success: false, error: "Empty Gemini response" }, { status: 502 });
    }

    // Clean JSON if needed
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    const parsedData = JSON.parse(cleanJson);

    const title = (parsedData.title || "Expense").trim();
    const amountNum = typeof parsedData.amount === "number" ? parsedData.amount : parseFloat(parsedData.amount) || null;
    const category = parsedData.category || "General";

    // Match Payer
    const payerQuery = (parsedData.payer || "You").toLowerCase().trim();
    let matchedPayerId = currentUserId || null;
    let matchedPayerName = "You";

    for (const m of memberList) {
      const n = m.name.toLowerCase();
      const a = m.actualName.toLowerCase();
      if (payerQuery === "you" || payerQuery === "me" || payerQuery === "i") {
        matchedPayerId = currentUserId;
        matchedPayerName = "You";
        break;
      } else if (n === payerQuery || a === payerQuery || a.includes(payerQuery) || payerQuery.includes(a)) {
        matchedPayerId = m.id;
        matchedPayerName = m.actualName;
        break;
      }
    }

    // Match Split Members
    const rawSplit = Array.isArray(parsedData.splitMembers) ? parsedData.splitMembers : [];
    const resolvedMemberIds: string[] = [];

    for (const item of rawSplit) {
      const q = String(item).toLowerCase().trim();
      if (q === "you" || q === "me" || q === "i") {
        if (currentUserId && !resolvedMemberIds.includes(currentUserId)) {
          resolvedMemberIds.push(currentUserId);
        }
      } else {
        for (const m of memberList) {
          const n = m.name.toLowerCase();
          const a = m.actualName.toLowerCase();
          if (n === q || a === q || a.includes(q) || q.includes(a)) {
            if (!resolvedMemberIds.includes(m.id)) {
              resolvedMemberIds.push(m.id);
            }
            break;
          }
        }
      }
    }

    // Fallback if no members resolved
    if (resolvedMemberIds.length === 0) {
      if (memberList.length > 0) {
        resolvedMemberIds.push(...memberList.map((m: any) => m.id));
      } else if (currentUserId) {
        resolvedMemberIds.push(currentUserId);
      }
    }

    return NextResponse.json({
      success: true,
      parsed: {
        amount: amountNum && amountNum > 0 ? amountNum : null,
        title,
        payerId: matchedPayerId,
        payerName: matchedPayerName,
        splitMemberIds: resolvedMemberIds,
        category,
        rawInput: trimmedText,
        isAiEnhanced: true,
      }
    });
  } catch (err: any) {
    console.error("[parse-voice route] Exception:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to parse expense" }, { status: 500 });
  }
}
