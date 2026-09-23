"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { useExpenses } from "@/hooks/useExpenses";
import { usePayments } from "@/hooks/usePayments";
import { balanceService } from "@/services/balanceService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  QrCode, 
  Loader2, 
  Zap, 
  Check, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  Download,
  FileText,
  Share2,
  Smile,
  Gift,
  Wallet,
  TrendingDown,
  TrendingUp,
  Layers,
  CheckSquare,
  Square,
  BadgePercent,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { userService } from "@/services/userService";
import { exportService } from "@/services/exportService";
import MemeNudgeModal from "@/components/groups/MemeNudgeModal";
import SponsorAdModal from "@/components/fintech/SponsorAdModal";

interface SetuData {
  paymentId: string;
  linkId: string;
  upiUrl: string;
  shortUrl: string;
  qrData?: string;
  baseAmount: number;
  platformFee: number;
  totalAmount: number;
  type?: "single" | "batch";
  batchItems?: any[];
  savingsAmount?: number;
  feeTier?: "instant" | "free_ad";
  adWatched?: boolean;
  isSimulated: boolean;
}

export default function SettleUpPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { appUser } = useAuth();
  
  const { group, loading: groupLoading } = useGroup(resolvedParams.groupId);
  const { expenses, loading: expensesLoading } = useExpenses(resolvedParams.groupId);
  const { payments, loading: paymentsLoading } = usePayments(resolvedParams.groupId);

  // Single Settlement States
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [receiverDetails, setReceiverDetails] = useState<any>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [setuData, setSetuData] = useState<SetuData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "awaiting" | "paid">("idle");
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(null);
  const [showMobileQr, setShowMobileQr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Batch Settlement States (Settle All at Once for ₹1 Fee)
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedBatchIndices, setSelectedBatchIndices] = useState<number[]>([]);
  const [batchDialogLoading, setBatchDialogLoading] = useState(false);
  const [batchSetuData, setBatchSetuData] = useState<SetuData | null>(null);
  const [batchPaymentStatus, setBatchPaymentStatus] = useState<"idle" | "awaiting" | "paid">("idle");
  const [batchVerifiedUtr, setBatchVerifiedUtr] = useState<string | null>(null);
  const [batchShowMobileQr, setBatchShowMobileQr] = useState(false);
  const [batchShowAdModal, setBatchShowAdModal] = useState(false);
  const [batchCopiedUpi, setBatchCopiedUpi] = useState(false);

  // Other UI States
  const [filterTab, setFilterTab] = useState<"all" | "toPay" | "toCollect">("all");
  const [nudgeModalData, setNudgeModalData] = useState<{
    targetUid: string;
    targetName: string;
    amount: number;
  } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const batchPollingRef = useRef<NodeJS.Timeout | null>(null);

  const loading = groupLoading || expensesLoading || paymentsLoading;

  // Poll for single payment status
  useEffect(() => {
    if (paymentStatus !== "awaiting" || !setuData?.paymentId) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/settle/status?paymentId=${setuData.paymentId}&linkId=${setuData.linkId}`);
        const data = await res.json();
        if (data.status === "PAID") {
          setPaymentStatus("paid");
          setVerifiedUtr(data.utr || "BANK_VERIFIED");
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        console.error("Status polling error:", err);
      }
    }, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [paymentStatus, setuData]);

  // Poll for batch payment status
  useEffect(() => {
    if (batchPaymentStatus !== "awaiting" || !batchSetuData?.paymentId) {
      if (batchPollingRef.current) clearInterval(batchPollingRef.current);
      return;
    }

    batchPollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/settle/status?paymentId=${batchSetuData.paymentId}&linkId=${batchSetuData.linkId}`);
        const data = await res.json();
        if (data.status === "PAID") {
          setBatchPaymentStatus("paid");
          setBatchVerifiedUtr(data.utr || "BANK_VERIFIED");
          if (batchPollingRef.current) clearInterval(batchPollingRef.current);
        }
      } catch (err) {
        console.error("Batch status polling error:", err);
      }
    }, 2500);

    return () => {
      if (batchPollingRef.current) clearInterval(batchPollingRef.current);
    };
  }, [batchPaymentStatus, batchSetuData]);

  if (loading || !group) {
    return (
      <div className="space-y-4 mt-2">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-11 rounded-2xl" />
          <Skeleton className="h-11 rounded-2xl" />
          <Skeleton className="h-11 rounded-2xl" />
        </div>
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
      </div>
    );
  }

  const balances = balanceService.calculateBalances(group.members, expenses, payments);
  const settlements = balanceService.suggestSettlements(balances, group.members);

  const mySettlements = settlements.filter(s => s.fromUserId === appUser?.id || s.toUserId === appUser?.id);
  const otherSettlements = settlements.filter(s => s.fromUserId !== appUser?.id && s.toUserId !== appUser?.id);

  const mySettlementsToPay = mySettlements.filter(s => s.fromUserId === appUser?.id);
  const mySettlementsToReceive = mySettlements.filter(s => s.toUserId === appUser?.id);
  const totalAmountToPay = mySettlementsToPay.reduce((sum, s) => sum + s.amount, 0);
  const totalAmountToReceive = mySettlementsToReceive.reduce((sum, s) => sum + s.amount, 0);
  const currencySymbol = group.currency === 'INR' ? '₹' : (group.currency || '₹');

  const filteredMySettlements = mySettlements.filter(s => {
    if (filterTab === "toPay") return s.fromUserId === appUser?.id;
    if (filterTab === "toCollect") return s.toUserId === appUser?.id;
    return true;
  });

  // Handle opening single settlement dialog
  const handleOpenDialog = async (settlement: any) => {
    setSelectedSettlement(settlement);
    setReceiverDetails(null);
    setSetuData(null);
    setPaymentStatus("idle");
    setVerifiedUtr(null);
    setShowMobileQr(false);
    setShowAdModal(false);
    setDialogLoading(true);

    try {
      const user = await userService.getUser(settlement.toUserId);
      setReceiverDetails(user);

      const res = await fetch("/api/settle/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          fromUserId: settlement.fromUserId,
          fromUserName: settlement.fromUserName,
          toUserId: settlement.toUserId,
          toUserName: settlement.toUserName,
          amount: settlement.amount,
          receiverUpiId: user?.upiId,
          waiveFee: false,
          settlementTier: "instant",
        }),
      });

      const linkResult = await res.json();
      if (linkResult.success) {
        setSetuData(linkResult);
        setPaymentStatus("awaiting");
      }
    } catch (err) {
      console.error("Failed to initialize payment session:", err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleCreatePayment = async (waiveFee: boolean) => {
    if (!selectedSettlement || !group) return;
    setDialogLoading(true);

    try {
      const res = await fetch("/api/settle/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          fromUserId: selectedSettlement.fromUserId,
          fromUserName: selectedSettlement.fromUserName,
          toUserId: selectedSettlement.toUserId,
          toUserName: selectedSettlement.toUserName,
          amount: selectedSettlement.amount,
          receiverUpiId: receiverDetails?.upiId,
          waiveFee,
          settlementTier: waiveFee ? "free_ad" : "instant",
        }),
      });

      const linkResult = await res.json();
      if (linkResult.success) {
        setSetuData(linkResult);
        setPaymentStatus("awaiting");
      } else {
        alert(linkResult.error || "Failed to generate payment session");
      }
    } catch (err) {
      console.error("Failed to initialize payment:", err);
      alert("Network error generating payment link. Please try again.");
    } finally {
      setDialogLoading(false);
    }
  };



  // Handle opening BATCH Multi-Settlement modal
  const handleOpenBatchModal = async () => {
    if (mySettlementsToPay.length === 0) return;

    const allIndices = mySettlementsToPay.map((_, i) => i);
    setSelectedBatchIndices(allIndices);
    setBatchSetuData(null);
    setBatchPaymentStatus("idle");
    setBatchVerifiedUtr(null);
    setBatchShowMobileQr(false);
    setBatchModalOpen(true);
    setBatchDialogLoading(true);

    try {
      const enrichedSettlements = await Promise.all(
        mySettlementsToPay.map(async (s) => {
          const user = await userService.getUser(s.toUserId);
          return {
            toUserId: s.toUserId,
            toUserName: s.toUserName,
            amount: s.amount,
            receiverUpiId: user?.upiId,
          };
        })
      );

      const res = await fetch("/api/settle/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          fromUserId: appUser?.id,
          fromUserName: appUser?.displayName || appUser?.name || "Member",
          type: "batch",
          settlements: enrichedSettlements,
          waiveFee: false,
          settlementTier: "instant",
        }),
      });

      const result = await res.json();
      if (result.success) {
        setBatchSetuData(result);
        setBatchPaymentStatus("awaiting");
      }
    } catch (e) {
      console.error("Failed to generate batch settlement link:", e);
    } finally {
      setBatchDialogLoading(false);
    }
  };

  // Regenerate batch payment when indices or free tier toggles
  const handleRegenerateBatchPayment = async (waiveFee: boolean, customIndices?: number[]) => {
    const indicesToUse = customIndices !== undefined ? customIndices : selectedBatchIndices;
    const activeDebts = indicesToUse.map(idx => mySettlementsToPay[idx]).filter(Boolean);
    if (activeDebts.length === 0) return;

    setBatchDialogLoading(true);
    try {
      const enrichedSettlements = await Promise.all(
        activeDebts.map(async (s) => {
          const user = await userService.getUser(s.toUserId);
          return {
            toUserId: s.toUserId,
            toUserName: s.toUserName,
            amount: s.amount,
            receiverUpiId: user?.upiId,
          };
        })
      );

      const res = await fetch("/api/settle/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          fromUserId: appUser?.id,
          fromUserName: appUser?.displayName || appUser?.name || "Member",
          type: "batch",
          settlements: enrichedSettlements,
          waiveFee,
          settlementTier: waiveFee ? "free_ad" : "instant",
        }),
      });

      const result = await res.json();
      if (result.success) {
        setBatchSetuData(result);
        setBatchPaymentStatus("awaiting");
      } else {
        alert(result.error || "Failed to generate batch payment");
      }
    } catch (e) {
      console.error("Error creating batch payment link:", e);
    } finally {
      setBatchDialogLoading(false);
    }
  };

  const handleToggleBatchIndex = (index: number) => {
    let updated: number[];
    if (selectedBatchIndices.includes(index)) {
      if (selectedBatchIndices.length === 1) return; // Keep at least one selected
      updated = selectedBatchIndices.filter(i => i !== index);
    } else {
      updated = [...selectedBatchIndices, index].sort((a, b) => a - b);
    }
    setSelectedBatchIndices(updated);
    handleRegenerateBatchPayment(batchSetuData?.feeTier === "free_ad", updated);
  };



  const handleCopyUpi = (text: string, isBatch = false) => {
    navigator.clipboard.writeText(text);
    if (isBatch) {
      setBatchCopiedUpi(true);
      setTimeout(() => setBatchCopiedUpi(false), 2000);
    } else {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Selected batch debts calculation
  const activeBatchDebts = selectedBatchIndices.map(idx => mySettlementsToPay[idx]).filter(Boolean);
  const activeBatchSum = activeBatchDebts.reduce((sum, s) => sum + s.amount, 0);
  const totalFeesSaved = Math.max(0, (activeBatchDebts.length - 1) * 1.0);

  if (settlements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <Link
            href={`/groups/${group.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
          <span className="text-xs font-bold text-slate-400">All Balances Squared</span>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">You're All Settled Up!</h3>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            There are no pending balances or debts in <strong className="text-slate-800">{group.name}</strong>. Everyone has squared up their shares.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" className="rounded-2xl text-xs font-bold border-slate-200">
              <Link href={`/groups/${group.id}`}>View Group Expenses</Link>
            </Button>
            <Button asChild className="rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950">
              <Link href={`/groups/${group.id}/expenses/new`}>+ Add New Expense</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7 pb-16">
      
      {/* 1. Header Bar with Back Navigation & Group Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={`/groups/${group.id}`}
            className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Back to Group"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Settle Up & Payments
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Verified UPI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Group: <strong className="text-slate-800">{group.name}</strong></span>
              <span>•</span>
              <span>{group.members?.length || 0} members</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl h-9 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Link href={`/groups/${group.id}`}>
              Expenses
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/g/${group.id}`;
              navigator.clipboard.writeText(url);
              alert("Public settlement link copied! Anyone can view balances or pay via UPI without logging in.");
            }}
            className="rounded-xl h-9 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Share Link
          </Button>
        </div>
      </div>

      {/* 2. Premier Financial Standing Hero Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-7 text-white shadow-xl border border-white/10">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 shadow-2xs">
                <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                Verified UPI Settlement
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-3 w-3" />
                100% Free Option (Zero Gateway Fee)
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Your Group Net Standing</p>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-0.5">
                {totalAmountToPay > 0.01 ? (
                  <span className="text-rose-300 flex items-baseline gap-2 flex-wrap">
                    <span>You owe</span>
                    <span className="text-white">{currencySymbol}{totalAmountToPay.toFixed(2)}</span>
                  </span>
                ) : totalAmountToReceive > 0.01 ? (
                  <span className="text-emerald-300 flex items-baseline gap-2 flex-wrap">
                    <span>You are owed</span>
                    <span className="text-white">{currencySymbol}{totalAmountToReceive.toFixed(2)}</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
                    All Settled Up!
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {totalAmountToPay > 0.01 
                  ? `${mySettlementsToPay.length} pending debt${mySettlementsToPay.length > 1 ? 's' : ''} to clear in this group`
                  : totalAmountToReceive > 0.01 
                    ? `${mySettlementsToReceive.length} payment${mySettlementsToReceive.length > 1 ? 's' : ''} waiting to be collected`
                    : "Zero pending dues. Balances are fully balanced."}
              </p>
            </div>

            {/* 🔥 GAME-CHANGER FEATURE: ONE-CLICK BATCH SETTLEMENT CTA */}
            {mySettlementsToPay.length > 1 && (
              <div className="pt-2">
                <Button
                  onClick={handleOpenBatchModal}
                  className="rounded-2xl h-12 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-[0.98] w-full sm:w-auto"
                >
                  <Layers className="h-4 w-4 text-slate-950" />
                  <span>Settle All {mySettlementsToPay.length} Dues at Once ({currencySymbol}{totalAmountToPay.toFixed(2)})</span>
                  <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full ml-1">
                    Costs ₹1 Only • Save ₹{(mySettlementsToPay.length - 1).toFixed(2)}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Quick Metric Cards */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <TrendingDown className="h-3 w-3 text-rose-400" />
                <span>To Pay</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-rose-300 mt-0.5">
                {currencySymbol}{totalAmountToPay.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {mySettlementsToPay.length} payment{mySettlementsToPay.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span>To Collect</span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-emerald-300 mt-0.5">
                {currencySymbol}{totalAmountToReceive.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {mySettlementsToReceive.length} payment{mySettlementsToReceive.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Responsive Quick Actions Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportService.exportToCsv(expenses, group.members, group.name)}
          className="rounded-2xl h-11 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4 text-blue-600 shrink-0" />
          <span>Export Group CSV</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => exportService.exportToPdf(expenses, group.members, group.name, group.currency)}
          className="rounded-2xl h-11 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4 text-red-500 shrink-0" />
          <span>Print-Ready PDF</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const url = `${window.location.origin}/g/${group.id}`;
            navigator.clipboard.writeText(url);
            alert("Public settlement link copied! Friends can view balances & scan UPI QR without logging in.");
          }}
          className="rounded-2xl h-11 text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 shadow-2xs cursor-pointer flex items-center justify-center gap-2"
        >
          <Share2 className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Copy Public Settle Link</span>
        </Button>
      </div>

      {/* 4. Your Settlements Section with Filter Tabs & Batch Settle Action */}
      {mySettlements.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-400" />
              <span>Your Settlements ({mySettlements.length})</span>
            </h3>

            {/* Filter Tabs & Optional Batch Button */}
            <div className="flex flex-wrap items-center gap-2">
              {mySettlementsToPay.length > 1 && (
                <Button
                  size="sm"
                  onClick={handleOpenBatchModal}
                  className="rounded-xl h-8 px-3 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Settle All ({mySettlementsToPay.length})</span>
                </Button>
              )}

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterTab === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({mySettlements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("toPay")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterTab === "toPay" ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  To Pay ({mySettlementsToPay.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("toCollect")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterTab === "toCollect" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  To Collect ({mySettlementsToReceive.length})
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredMySettlements.map((s, idx) => {
              const iAmPaying = s.fromUserId === appUser?.id;
              const fromMember = group.members.find(m => m.id === s.fromUserId);
              const toMember = group.members.find(m => m.id === s.toUserId);

              return (
                <Card key={idx} className="border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-all overflow-hidden bg-white">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    
                    {/* Status pill header */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[11px] ${
                        iAmPaying 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {iAmPaying ? "🔴 Action Needed: You Pay" : "🟢 Incoming to You"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 hidden sm:inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Automated Bank Verification
                      </span>
                    </div>

                    {/* Middle: Transfer Avatars & Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Payer */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-slate-100 shadow-2xs shrink-0">
                            <AvatarImage src={fromMember?.photoUrl || fromMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                            <AvatarFallback className="font-bold text-slate-700">{s.fromUserName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 leading-tight truncate">
                              {iAmPaying ? "You" : s.fromUserName}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium">Payer</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 mx-1">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>

                        {/* Payee */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-slate-100 shadow-2xs shrink-0">
                            <AvatarImage src={toMember?.photoUrl || toMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
                            <AvatarFallback className="font-bold text-slate-700">{s.toUserName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 leading-tight truncate">
                              {iAmPaying ? s.toUserName : "You"}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium">Receiver</span>
                          </div>
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div className="sm:text-right shrink-0">
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          {currencySymbol}{s.amount.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Exact Split Balance
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Zero fees with 1 short ad • Instant bank confirmation</span>
                      </div>

                      {iAmPaying ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button 
                            onClick={() => handleOpenDialog(s)} 
                            className="rounded-2xl h-12 flex-1 sm:flex-none sm:w-auto px-7 font-black text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
                          >
                            <Zap className="h-4 w-4 fill-slate-950 text-slate-950" />
                            <span>Settle {currencySymbol}{s.amount.toFixed(2)}</span>
                          </Button>

                          {mySettlementsToPay.length > 1 && (
                            <Button
                              variant="outline"
                              onClick={handleOpenBatchModal}
                              className="rounded-2xl h-12 px-4 border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-950 font-bold text-xs cursor-pointer shrink-0"
                              title="Settle all pending dues in 1 payment"
                            >
                              <Layers className="h-4 w-4 mr-1 text-amber-700" />
                              <span className="hidden sm:inline">Settle All</span>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNudgeModalData({
                              targetUid: s.fromUserId,
                              targetName: s.fromUserName,
                              amount: s.amount,
                            })}
                            className="rounded-xl h-10 px-4 font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-2xs cursor-pointer flex items-center justify-center"
                          >
                            <Smile className="h-4 w-4 mr-1.5 text-amber-600" />
                            Meme Nudge
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const amt = s.amount.toFixed(2);
                              const myName = appUser?.displayName || appUser?.name || "Your friend";
                              const myUpi = appUser?.upiId?.trim();
                              const breakdownLink = `${window.location.origin}/g/${group.id}`;
                              
                              let upiBlock = "";
                              if (myUpi) {
                                const upiUri = `upi://pay?pa=${myUpi}&pn=${encodeURIComponent(myName)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Splinzo ${group.name}`)}`;
                                upiBlock = `⚡ *Tap to pay instantly via UPI (GPay/PhonePe/Paytm):*\n${upiUri}\n\n`;
                              }

                              const text = encodeURIComponent(
                                `👋 Hey ${s.fromUserName}!\n\n` +
                                `Just a friendly reminder for your pending balance of *${currencySymbol}${amt}* in Splinzo for "*${group.name}*".\n\n` +
                                upiBlock +
                                `📊 *View group breakdown & settle:*\n${breakdownLink}\n\n` +
                                `Thanks! ✨`
                              );
                              window.open(`https://wa.me/?text=${text}`, "_blank");
                            }}
                            className="rounded-xl h-10 px-4 font-bold border-green-200 bg-green-50 text-green-700 hover:bg-green-100 shadow-2xs cursor-pointer flex items-center justify-center"
                          >
                            <MessageSquare className="h-4 w-4 mr-1.5 text-green-600" />
                            WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Other Group Settlements */}
      {otherSettlements.length > 0 && (
        <section className="space-y-3 pt-2">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">
            Other Member Settlements ({otherSettlements.length})
          </h3>
          <div className="space-y-2.5">
            {otherSettlements.map((s, idx) => {
              const fromMember = group.members.find(m => m.id === s.fromUserId);
              const toMember = group.members.find(m => m.id === s.toUserId);
              
              return (
                <Card key={idx} className="border border-slate-100 rounded-2xl shadow-2xs bg-slate-50/70 hover:bg-white transition-colors">
                  <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={fromMember?.photoUrl || fromMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                        <AvatarFallback className="text-xs font-bold">{s.fromUserName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={toMember?.photoUrl || toMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
                        <AvatarFallback className="text-xs font-bold">{s.toUserName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {s.fromUserName} pays {s.toUserName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-slate-900">
                        {currencySymbol}{s.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Pending</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. SINGLE SETTLEMENT DIALOG */}
      <Dialog open={!!selectedSettlement} onOpenChange={(open) => {
        if (!open) {
          setSelectedSettlement(null);
          setPaymentStatus("idle");
        }
      }}>
        <DialogContent className="w-[calc(100%-1.25rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92dvh] overflow-y-auto rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-2xl bg-white focus:outline-none">
          <DialogHeader className="text-left space-y-1 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                Verified UPI Settlement
              </div>
              <span className="text-xs font-bold text-emerald-600 hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                RBI & NPCI Compliant
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Settle with {selectedSettlement?.toUserName}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm">
              Direct peer-to-peer bank settlement via NPCI UPI Deeplinks & QR.
            </DialogDescription>
          </DialogHeader>

          {dialogLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-slate-800">Generating secure UPI payment session...</p>
              <p className="text-xs text-slate-400">Verifying bank routes & zero-fee options</p>
            </div>
          ) : paymentStatus === "paid" ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
              <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Payment Verified!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bank confirmation received. Your balance has been automatically squared and recorded.
                </p>
              </div>

              {verifiedUtr && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-600 w-full flex items-center justify-between">
                  <span className="font-semibold text-slate-400">BANK UTR:</span>
                  <span className="font-bold text-slate-800">{verifiedUtr}</span>
                </div>
              )}

              <Button 
                onClick={() => setSelectedSettlement(null)} 
                className="w-full rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md cursor-pointer"
              >
                Done & View Balances
              </Button>
            </div>
          ) : setuData ? (
            <div className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-start">
                
                {/* Left Column */}
                <div className="md:col-span-7 space-y-4">
                  {/* Settlement Mode Selection Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (setuData.feeTier !== "free_ad") {
                          setShowAdModal(true);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        setuData.feeTier === "free_ad"
                          ? "bg-white text-emerald-700 shadow-sm border border-emerald-300 ring-2 ring-emerald-500/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Free Settlement</span>
                      <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        ₹0 Fee
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setuData.feeTier !== "instant") {
                          handleCreatePayment(false);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        setuData.feeTier === "instant"
                          ? "bg-white text-amber-700 shadow-sm border border-amber-300 ring-2 ring-amber-500/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>Instant Fast-Track</span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        +₹1
                      </span>
                    </button>
                  </div>

                  {/* Price Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border border-slate-200/80 space-y-2.5 shadow-2xs">
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                      <span>Settlement Amount</span>
                      <span className="font-semibold text-slate-900">₹{setuData.baseAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600 items-center">
                      <span className="flex items-center gap-1">
                        Bank Verification Fee
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      </span>
                      {setuData.platformFee === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="h-3 w-3" />
                          ₹0.00 (Waived via Ad)
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-900">+₹{setuData.platformFee.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">Total Payable</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        ₹{setuData.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Free Settlement Option Banner */}
                  {setuData.platformFee > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-emerald-950">Pay for FREE (Save ₹1.00)</p>
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase">100% Free</span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                            Watch 1 short sponsor ad to waive the platform fee
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAdModal(true)}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shrink-0 px-4 h-9 shadow-md cursor-pointer w-full sm:w-auto"
                      >
                        Watch Ad & Waive Fee
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-extrabold">100% Free Settlement Active (₹1 fee waived)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleCreatePayment(false)}
                        className="text-[11px] text-emerald-700 underline font-semibold hover:text-emerald-950 ml-2 shrink-0 cursor-pointer"
                      >
                        Switch to Instant (+₹1)
                      </button>
                    </div>
                  )}

                  {/* Live Detection Radar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                      </span>
                      <span className="font-medium">Waiting for UPI bank confirmation...</span>
                    </div>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  </div>

                  {/* Receiver details preview */}
                  {receiverDetails?.upiId ? (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-500">Paying to UPI ID: <strong className="text-slate-800">{receiverDetails.upiId}</strong></span>
                      <button 
                        onClick={() => handleCopyUpi(receiverDetails.upiId)}
                        className="text-slate-400 hover:text-slate-700 font-semibold p-1 cursor-pointer flex items-center gap-1"
                      >
                        {copiedUpi ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span className="text-[11px] text-slate-500">{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900">
                          {selectedSettlement?.toUserName} has not added a UPI ID
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Direct deposit to their personal UPI is pending. You can still pay via the Setu link or settle offline.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Primary Mobile Action: Open in UPI App */}
                  <div className="space-y-2 pt-1">
                    <Button 
                      asChild
                      className={`w-full rounded-2xl h-14 text-white font-black text-base shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                        setuData.platformFee === 0
                          ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      }`}
                    >
                      <a href={setuData.upiUrl} target="_blank" rel="noopener noreferrer">
                        <Smartphone className="h-5 w-5 mr-2" />
                        Pay ₹{setuData.totalAmount.toFixed(2)} via UPI App
                        {setuData.platformFee === 0 && (
                          <span className="ml-2 text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
                            100% FREE
                          </span>
                        )}
                      </a>
                    </Button>
                    <p className="text-[11px] text-center text-slate-400 font-medium">
                      Opens Google Pay, PhonePe, Paytm, BHIM, or Cred on mobile
                    </p>
                  </div>

                  {/* Mobile-Only Collapsible QR Code Toggle */}
                  <div className="block md:hidden pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMobileQr(!showMobileQr)}
                      className="w-full rounded-xl text-xs font-bold border-slate-200 text-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-4 w-4 text-slate-500" />
                      <span>{showMobileQr ? "Hide QR Code" : "Show QR Code to Scan on Phone"}</span>
                      {showMobileQr ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                    </Button>

                    {showMobileQr && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-white rounded-2xl border shadow-sm">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setuData.upiUrl)}`} 
                            alt="Setu UPI QR"
                            className="h-44 w-44 object-contain"
                          />
                        </div>
                        <p className="text-xs text-slate-600 font-bold">
                          Scan with any UPI camera or banking app
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyUpi(setuData.upiUrl)}
                          className="rounded-xl text-xs font-bold border-slate-200"
                        >
                          {copiedUpi ? "✓ Link Copied" : "Copy UPI Payment URL"}
                        </Button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Desktop QR & Sandbox Tool */}
                <div className="hidden md:flex md:col-span-5 flex-col items-center justify-between p-5 bg-gradient-to-b from-slate-50 via-white to-slate-50 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="text-center space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <QrCode className="h-3.5 w-3.5 text-amber-700" />
                      Desktop Instant Pay
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      Scan with Phone
                    </h4>
                    <p className="text-xs text-slate-500 leading-tight">
                      Use Google Pay, PhonePe, Paytm, BHIM, or any banking app
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-200/80 shadow-md relative group">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setuData.upiUrl)}`} 
                      alt="Setu UPI QR Code"
                      className="h-44 w-44 object-contain"
                    />
                    <div className="absolute inset-0 bg-amber-500/5 rounded-2xl pointer-events-none" />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">GPay</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">PhonePe</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Paytm</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">BHIM</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Cred</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUpi(setuData.upiUrl)}
                    className="w-full rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {copiedUpi ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" /> : <Copy className="h-3.5 w-3.5 text-slate-400 mr-1.5" />}
                    {copiedUpi ? "UPI URL Copied!" : "Copy Payment Link"}
                  </Button>

                </div>

              </div>
            </div>
          ) : null}

        </DialogContent>
      </Dialog>

      {/* 7. 🔥 GAME-CHANGER: BATCH MULTI-SETTLEMENT DIALOG (SETTLE ALL DUES IN 1 PAYMENT) */}
      <Dialog open={batchModalOpen} onOpenChange={(open) => {
        if (!open) {
          setBatchModalOpen(false);
          setBatchPaymentStatus("idle");
        }
      }}>
        <DialogContent className="w-[calc(100%-1.25rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92dvh] overflow-y-auto rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-2xl bg-white focus:outline-none">
          <DialogHeader className="text-left space-y-1 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-900 border border-amber-300">
                <Layers className="h-3.5 w-3.5 text-amber-700" />
                One-Click Batch Settlement
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <BadgePercent className="h-3.5 w-3.5 text-emerald-600" />
                Costs Only ₹1.00 Fee for All Debts
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Settle All Group Dues in 1 Payment
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm">
              Bundle all your pending dues into a single UPI transfer. Pay the platform fee only once and clear all debts simultaneously!
            </DialogDescription>
          </DialogHeader>

          {batchDialogLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              <p className="text-sm font-bold text-slate-800">Generating unified batch payment session...</p>
              <p className="text-xs text-slate-400">Bundling {activeBatchDebts.length} dues into 1 master UPI transaction</p>
            </div>
          ) : batchPaymentStatus === "paid" ? (
            /* CELEBRATION / ALL SETTLED SCREEN */
            <div className="py-8 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
              <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">All Dues Cleared!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Master payment verified. All {activeBatchDebts.length} group debts have been atomically squared and updated on the ledger.
                </p>
              </div>

              {batchVerifiedUtr && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-600 w-full flex items-center justify-between">
                  <span className="font-semibold text-slate-400">MASTER UTR:</span>
                  <span className="font-bold text-slate-800">{batchVerifiedUtr}</span>
                </div>
              )}

              <Button 
                onClick={() => setBatchModalOpen(false)} 
                className="w-full rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md cursor-pointer"
              >
                Done & View Balances
              </Button>
            </div>
          ) : batchSetuData ? (
            /* BATCH PAYMENT CHECKOUT SCREEN */
            <div className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-start">
                
                {/* Left Column: Bundled Debt Checklist, Mode switch, Breakdown */}
                <div className="md:col-span-7 space-y-4">
                  
                  {/* Itemized Debts Checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Bundled Debts to Settle ({activeBatchDebts.length} of {mySettlementsToPay.length})
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">
                        Tap checkbox to toggle
                      </span>
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {mySettlementsToPay.map((s, idx) => {
                        const isChecked = selectedBatchIndices.includes(idx);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleBatchIndex(idx)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? "bg-amber-50/50 border-amber-300 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-amber-600 shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400 shrink-0" />
                              )}
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
                                <AvatarFallback className="text-xs font-bold">{s.toUserName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                  Pay {s.toUserName}
                                </p>
                                <span className="text-[10px] text-slate-400">Direct debt clearance</span>
                              </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 shrink-0">
                              {currencySymbol}{s.amount.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode Selector for Batch */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (batchSetuData.feeTier !== "free_ad") {
                          setBatchShowAdModal(true);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        batchSetuData.feeTier === "free_ad"
                          ? "bg-white text-emerald-700 shadow-sm border border-emerald-300 ring-2 ring-emerald-500/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Free Settlement</span>
                      <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        ₹0 Fee (1 Ad)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (batchSetuData.feeTier !== "instant") {
                          handleRegenerateBatchPayment(false);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        batchSetuData.feeTier === "instant"
                          ? "bg-white text-amber-700 shadow-sm border border-amber-300 ring-2 ring-amber-500/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>Instant Fast-Track</span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        +₹1 (1 Fee)
                      </span>
                    </button>
                  </div>

                  {/* Batch Cost & Savings Breakdown */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border border-slate-200/90 space-y-2.5 shadow-2xs">
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600">
                      <span>Combined Debts ({activeBatchDebts.length})</span>
                      <span className="font-semibold text-slate-900">₹{batchSetuData.baseAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm text-slate-600 items-center">
                      <span className="flex items-center gap-1">
                        Bundled Gateway Fee
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      </span>
                      {batchSetuData.platformFee === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="h-3 w-3" />
                          ₹0.00 (Waived via 1 Ad)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-slate-400 text-xs">
                            ₹{(activeBatchDebts.length * 1.0).toFixed(2)}
                          </span>
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            +₹{batchSetuData.platformFee.toFixed(2)} only
                          </span>
                        </div>
                      )}
                    </div>

                    {totalFeesSaved > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                        <span className="flex items-center gap-1.5 font-bold">
                          <BadgePercent className="h-4 w-4 text-emerald-600" />
                          Bundled Multi-Payment Savings:
                        </span>
                        <span className="font-black text-emerald-700">
                          You save ₹{totalFeesSaved.toFixed(2)}!
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">Total Payable</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        ₹{batchSetuData.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Free Ad Banner for Batch */}
                  {batchSetuData.platformFee > 0 ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-emerald-950">Pay for FREE (Save ₹1.00)</p>
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase">100% Free</span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                            Watch 1 short sponsor ad to waive fee for all {activeBatchDebts.length} dues
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setBatchShowAdModal(true)}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shrink-0 px-4 h-9 shadow-md cursor-pointer w-full sm:w-auto"
                      >
                        Watch Ad & Settle All Free
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-extrabold">100% Free Batch Active (₹1 fee waived via 1 ad)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRegenerateBatchPayment(false)}
                        className="text-[11px] text-emerald-700 underline font-semibold hover:text-emerald-950 ml-2 shrink-0 cursor-pointer"
                      >
                        Switch to Instant (+₹1)
                      </button>
                    </div>
                  )}

                  {/* Live Radar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                      </span>
                      <span className="font-medium">Waiting for master UPI confirmation...</span>
                    </div>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  </div>

                  {/* Primary Mobile Action: Open in UPI App */}
                  <div className="space-y-2 pt-1">
                    <Button 
                      asChild
                      className={`w-full rounded-2xl h-14 text-white font-black text-base shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                        batchSetuData.platformFee === 0
                          ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                          : "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950"
                      }`}
                    >
                      <a href={batchSetuData.upiUrl} target="_blank" rel="noopener noreferrer">
                        <Smartphone className="h-5 w-5 mr-2" />
                        Pay ₹{batchSetuData.totalAmount.toFixed(2)} for All {activeBatchDebts.length} Dues
                        {batchSetuData.platformFee === 0 && (
                          <span className="ml-2 text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
                            100% FREE
                          </span>
                        )}
                      </a>
                    </Button>
                    <p className="text-[11px] text-center text-slate-400 font-medium">
                      One payment automatically clears all {activeBatchDebts.length} debts in the group
                    </p>
                  </div>

                  {/* Mobile Collapsible QR */}
                  <div className="block md:hidden pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchShowMobileQr(!batchShowMobileQr)}
                      className="w-full rounded-xl text-xs font-bold border-slate-200 text-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="h-4 w-4 text-slate-500" />
                      <span>{batchShowMobileQr ? "Hide QR Code" : "Show QR Code to Scan on Phone"}</span>
                      {batchShowMobileQr ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                    </Button>

                    {batchShowMobileQr && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-white rounded-2xl border shadow-sm">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(batchSetuData.upiUrl)}`} 
                            alt="Setu Batch UPI QR"
                            className="h-44 w-44 object-contain"
                          />
                        </div>
                        <p className="text-xs text-slate-600 font-bold">
                          Scan with any UPI camera or banking app
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyUpi(batchSetuData.upiUrl, true)}
                          className="rounded-xl text-xs font-bold border-slate-200"
                        >
                          {batchCopiedUpi ? "✓ Link Copied" : "Copy UPI Payment URL"}
                        </Button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Desktop QR & Sandbox simulation for batch */}
                <div className="hidden md:flex md:col-span-5 flex-col items-center justify-between p-5 bg-gradient-to-b from-slate-50 via-white to-slate-50 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                  <div className="text-center space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <Layers className="h-3.5 w-3.5 text-amber-700" />
                      Master Batch UPI QR
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      Scan to Clear All Dues
                    </h4>
                    <p className="text-xs text-slate-500 leading-tight">
                      Settles all {activeBatchDebts.length} debts simultaneously for 1 single fee
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border-2 border-slate-200/80 shadow-md relative group">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(batchSetuData.upiUrl)}`} 
                      alt="Setu Batch UPI QR Code"
                      className="h-44 w-44 object-contain"
                    />
                    <div className="absolute inset-0 bg-amber-500/5 rounded-2xl pointer-events-none" />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">GPay</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">PhonePe</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Paytm</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">BHIM</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Cred</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUpi(batchSetuData.upiUrl, true)}
                    className="w-full rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {batchCopiedUpi ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" /> : <Copy className="h-3.5 w-3.5 text-slate-400 mr-1.5" />}
                    {batchCopiedUpi ? "Master UPI URL Copied!" : "Copy Payment Link"}
                  </Button>

                </div>

              </div>
            </div>
          ) : null}

        </DialogContent>
      </Dialog>

      {/* Sponsor Ad Modal for Single Free Settlement */}
      <SponsorAdModal
        open={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardEarned={() => {
          setShowAdModal(false);
          handleCreatePayment(true);
        }}
        settleAmount={selectedSettlement?.amount || 0}
        receiverName={selectedSettlement?.toUserName || "Friend"}
      />

      {/* Sponsor Ad Modal for Batch Free Settlement (1 Ad waives entire batch fee) */}
      <SponsorAdModal
        open={batchShowAdModal}
        onClose={() => setBatchShowAdModal(false)}
        onRewardEarned={() => {
          setBatchShowAdModal(false);
          handleRegenerateBatchPayment(true);
        }}
        settleAmount={activeBatchSum}
        receiverName={`${activeBatchDebts.length} Members (All Dues)`}
      />

      {/* Playful Meme Nudge Modal */}
      <MemeNudgeModal
        groupId={resolvedParams.groupId}
        targetUid={nudgeModalData?.targetUid || ""}
        targetName={nudgeModalData?.targetName || ""}
        amount={nudgeModalData?.amount || 0}
        currency={group?.currency === "INR" ? "₹" : (group?.currency || "₹")}
        isOpen={!!nudgeModalData}
        onClose={() => setNudgeModalData(null)}
      />
    </div>
  );
}
