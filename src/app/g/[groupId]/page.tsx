"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Group } from "@/types/group";
import { Expense } from "@/types/expense";
import { Payment } from "@/types/payment";
import { balanceService } from "@/services/balanceService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  Zap, 
  Receipt, 
  Share2, 
  Download, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function PublicGroupSettlementPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const rawId = resolvedParams.groupId;
  const { appUser } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payeeMap, setPayeeMap] = useState<{ [userId: string]: { upiId?: string; name: string } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedQr, setExpandedQr] = useState<{ [debtKey: string]: boolean }>({});

  useEffect(() => {
    async function loadPublicData() {
      if (!rawId) return;
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch group (try direct ID first, then try inviteCode)
        let resolvedGroupId = rawId;
        const groupRef = doc(db, "groups", rawId);
        const groupSnap = await getDoc(groupRef);

        let groupData: Group | null = null;
        if (groupSnap.exists()) {
          groupData = { id: groupSnap.id, ...groupSnap.data() } as Group;
        } else {
          // Search by inviteCode
          const q = query(collection(db, "groups"), where("inviteCode", "==", rawId.toUpperCase()));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const first = qSnap.docs[0];
            resolvedGroupId = first.id;
            groupData = { id: first.id, ...first.data() } as Group;
          }
        }

        if (!groupData) {
          setError("Group not found or the settlement link has expired.");
          setLoading(false);
          return;
        }

        setGroup(groupData);

        // 2. Fetch expenses
        const expQuery = query(
          collection(db, `groups/${resolvedGroupId}/expenses`),
          orderBy("createdAt", "desc"),
          limit(30)
        );
        const expSnap = await getDocs(expQuery);
        const fetchedExpenses = expSnap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
        setExpenses(fetchedExpenses);

        // 3. Fetch payments
        const payQuery = query(collection(db, `groups/${resolvedGroupId}/payments`));
        const paySnap = await getDocs(payQuery);
        const fetchedPayments = paySnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
        setPayments(fetchedPayments);

        // 4. Calculate settlements to identify creditors
        const balances = balanceService.calculateBalances(groupData.members || [], fetchedExpenses, fetchedPayments);
        const settlements = balanceService.suggestSettlements(balances, groupData.members || []);

        // 5. Fetch creditor profiles for direct UPI IDs
        const creditorIds = Array.from(new Set(settlements.map(s => s.toUserId)));
        const map: { [userId: string]: { upiId?: string; name: string } } = {};
        
        await Promise.all(
          creditorIds.map(async (uid) => {
            const memberObj = (groupData?.members || []).find(m => m.id === uid);
            const userProfile = await userService.getUser(uid);
            map[uid] = {
              upiId: userProfile?.upiId || "",
              name: userProfile?.displayName || userProfile?.name || memberObj?.displayName || memberObj?.name || "Friend",
            };
          })
        );
        setPayeeMap(map);

      } catch (err: any) {
        console.error("Error loading settlement page:", err);
        setError("Unable to load settlement details. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadPublicData();
  }, [rawId]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleQr = (key: string) => {
    setExpandedQr(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl rounded-3xl p-6 text-center space-y-4">
          <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Settlement Not Available</h2>
          <p className="text-sm text-gray-500">{error || "Group could not be found."}</p>
          <Button asChild className="rounded-xl w-full">
            <Link href="/">Go to Splinzo Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const balances = balanceService.calculateBalances(group.members || [], expenses, payments);
  const settlements = balanceService.suggestSettlements(balances, group.members || []);
  const totalGroupSpend = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const currencySymbol = group.currency === "INR" ? "₹" : group.currency;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-slate-50 to-white text-slate-900 pb-20">
      {/* Top Splinzo App CTA Banner */}
      <div className="bg-slate-900 text-white px-4 py-3 text-xs sm:text-sm font-medium">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase">
              Splinzo
            </span>
            <span>Split bills, track vacations & pay via 1-tap UPI</span>
          </div>
          <Button asChild size="sm" variant="secondary" className="rounded-full text-xs font-bold shrink-0 bg-white text-slate-900 hover:bg-slate-100">
            <Link href={group.inviteCode ? `/join/${group.inviteCode}` : "/"}>
              Join on App
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Header Summary Card */}
        <div className="rounded-3xl p-6 bg-white border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Public Settlement Breakdown
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {group.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {group.members?.length || 0} Members • Total Group Spend: <strong>{currencySymbol}{totalGroupSpend.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
              </p>
            </div>
            {group.imageUrl ? (
              <img 
                src={group.imageUrl} 
                alt={group.name} 
                className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs" 
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-xs">
                {group.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Quick link button to share */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Transparent, automated ledger
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Splinzo Settlement - ${group.name}`,
                    text: `View our group settlement breakdown and settle up:`,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  handleCopy(window.location.href, "share-link");
                }
              }}
              className="rounded-xl text-xs font-bold text-slate-700 border-slate-200"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              {copiedKey === "share-link" ? "Link Copied!" : "Share Settlement"}
            </Button>
          </div>
        </div>

        {/* Pending Settlements Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              Who Owes Whom
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {settlements.length} Pending
            </span>
          </div>

          {settlements.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center space-y-3">
              <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">All Settled Up!</h3>
              <p className="text-xs text-slate-500">
                Everyone is square in this group. No outstanding balances.
              </p>
            </div>
          ) : (
            settlements.map((s, idx) => {
              const debtKey = `debt-${idx}`;
              const creditorData = payeeMap[s.toUserId] || { name: s.toUserName, upiId: "" };
              const creditorUpi = creditorData.upiId?.trim() || "";
              const formattedAmt = s.amount.toFixed(2);
              
              // Direct UPI deep link
              const upiPayUrl = creditorUpi 
                ? `upi://pay?pa=${creditorUpi}&pn=${encodeURIComponent(creditorData.name)}&am=${formattedAmt}&cu=INR&tn=${encodeURIComponent(`Splinzo ${group.name}`)}`
                : "";

              return (
                <Card key={idx} className="border-none shadow-xs rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {/* Top debtor -> creditor display */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                          <AvatarFallback className="font-bold">{s.fromUserName.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-xs text-slate-400 font-semibold">pays</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </div>

                        <Avatar className="h-11 w-11 border border-emerald-200">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
                          <AvatarFallback className="font-bold text-emerald-700 bg-emerald-50">{s.toUserName.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="ml-1">
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {s.fromUserName} &rarr; {s.toUserName}
                          </p>
                          {creditorUpi ? (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              UPI: {creditorUpi}
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                              Offline payment
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900">
                          {currencySymbol}{formattedAmt}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Simplified
                        </span>
                      </div>
                    </div>

                    {/* Action Row: 1-Tap UPI Deep-link + QR toggle */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                      {creditorUpi ? (
                        <>
                          <Button
                            asChild
                            className="flex-1 rounded-2xl h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-sm"
                          >
                            <a href={upiPayUrl}>
                              <Smartphone className="h-4 w-4 mr-2" />
                              Pay {currencySymbol}{formattedAmt} via UPI App
                            </a>
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => toggleQr(debtKey)}
                            className="rounded-2xl h-12 px-4 font-bold text-slate-700 border-slate-200 hover:bg-slate-50"
                          >
                            <QrCode className="h-4 w-4 mr-1.5 text-slate-500" />
                            {expandedQr[debtKey] ? "Hide QR" : "Show QR"}
                          </Button>
                        </>
                      ) : (
                        <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                          <span>Pay {s.toUserName} directly via cash or external bank transfer</span>
                          <span className="font-bold text-slate-700">{currencySymbol}{formattedAmt}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable UPI QR Code Card */}
                    {expandedQr[debtKey] && creditorUpi && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-3 animate-in fade-in duration-200">
                        <div className="p-3 bg-white rounded-2xl border shadow-xs">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayUrl)}`} 
                            alt={`UPI QR for ${s.toUserName}`}
                            className="h-44 w-44 object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            Scan with Google Pay, PhonePe, Paytm, or any UPI App
                          </p>
                          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-mono">
                            <span>{creditorUpi}</span>
                            <button
                              onClick={() => handleCopy(creditorUpi, `copy-${debtKey}`)}
                              className="p-1 hover:text-slate-800"
                            >
                              {copiedKey === `copy-${debtKey}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Transparent Ledger: Recent Expenses */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-500" />
              Recent Shared Expenses
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {expenses.length} Records
            </span>
          </div>

          <div className="space-y-2.5">
            {expenses.slice(0, 8).map((exp) => {
              const payer = group.members?.find(m => m.id === exp.payerId);
              const payerName = payer?.displayName || payer?.name || "Member";
              const expDate = exp.createdAt?.toDate ? exp.createdAt.toDate().toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "";

              return (
                <div 
                  key={exp.id} 
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {exp.category ? exp.category.charAt(0).toUpperCase() : "₹"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {exp.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Paid by {payerName} {expDate ? `• ${expDate}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      {currencySymbol}{exp.amount.toFixed(2)}
                    </span>
                    {exp.originalAmount && exp.originalCurrency && exp.originalCurrency !== group.currency && (
                      <p className="text-[10px] text-slate-400">
                        {exp.originalCurrency} {exp.originalAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Download & Join Splinzo Banner */}
        <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Zero-Friction Financial Settlements
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Experience Splinzo on your Phone</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Create unlimited trip ledgers, auto-scan receipts with AI, track shared packing lists, and settle with 1 tap.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild className="rounded-xl font-bold bg-amber-400 hover:bg-amber-500 text-slate-950">
              <Link href={group.inviteCode ? `/join/${group.inviteCode}` : "/"}>
                Join this Group
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl font-bold border-slate-700 text-white hover:bg-slate-800">
              <Link href="/">
                Learn More
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
