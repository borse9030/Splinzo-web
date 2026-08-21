import { NextResponse } from "next/server";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function GET() {
  try {
    const q = query(collection(db, "groups", "soCVIhdkua21rRhdPd9g", "expenses"), limit(50));
    const snapshot = await getDocs(q);
    const expenses: any[] = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json({ expenses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
