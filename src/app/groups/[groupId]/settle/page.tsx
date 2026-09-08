"use client";

import { use, useState, useEffect, useRef } from "react";
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
  IndianRupee, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  QrCode, 
  Loader2, 
  Zap, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  AlertTriangle
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

interface SetuData {
  paymentId: string;
  linkId: string;
  upiUrl: string;
  shortUrl: string;
  qrData?: string;
  baseAmount: number;
  platformFee: number;
  totalAmount: number;
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

  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [receiverDetails, setReceiverDetails] = useState<any>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Setu Integration States
  const [setuData, setSetuData] = useState<SetuData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "awaiting" | "paid">("idle");
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loading = groupLoading || expensesLoading || paymentsLoading;

  // Poll for payment status once Setu payment link is created
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

  if (loading || !group) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const balances = balanceService.calculateBalances(group.members, expenses, payments);
  const settlements = balanceService.suggestSettlements(balances, group.members);

  const handleOpenDialog = async (settlement: any) => {
    setSelectedSettlement(settlement);
    setReceiverDetails(null);
    setSetuData(null);
    setPaymentStatus("idle");
    setVerifiedUtr(null);
    setShowQr(false);
    setDialogLoading(true);

    try {
      // 1. Fetch receiver profile details (UPI ID, etc.)
      const user = await userService.getUser(settlement.toUserId);
      setReceiverDetails(user);

      // 2. Call Setu API to create a tracked payment link
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
        }),
      });

      const linkResult = await res.json();
      if (linkResult.success) {
        setSetuData(linkResult);
        setPaymentStatus("awaiting");
      }
    } catch (err) {
      console.error("Failed to initialize payment:", err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!setuData?.paymentId) return;
    setSimulating(true);
    try {
      const res = await fetch("/api/settle/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: setuData.paymentId,
          simulateSuccess: true,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPaymentStatus("paid");
        setVerifiedUtr(result.utr);
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopyUpi = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const mySettlements = settlements.filter(s => s.fromUserId === appUser?.id || s.toUserId === appUser?.id);
  const otherSettlements = settlements.filter(s => s.fromUserId !== appUser?.id && s.toUserId !== appUser?.id);

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-bold">You're all settled up</h3>
        <p className="text-gray-500 mt-2">
          There are no pending balances in this group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      {mySettlements.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Settlements</h3>
          <div className="space-y-4">
            {mySettlements.map((s, idx) => {
              const iAmPaying = s.fromUserId === appUser?.id;
              const fromMember = group.members.find(m => m.id === s.fromUserId);
              const toMember = group.members.find(m => m.id === s.toUserId);
              
              return (
                <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={fromMember?.photoUrl || fromMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                          <AvatarFallback>{s.fromUserName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex flex-col items-center px-2">
                          <span className="text-sm font-medium text-gray-500">
                            {iAmPaying ? "You pay" : `${s.fromUserName} pays`}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-300 my-1" />
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={toMember?.photoUrl || toMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
                          <AvatarFallback>{s.toUserName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="ml-2">
                          <p className="text-lg font-bold text-gray-900">
                            {group.currency === 'INR' ? '₹' : group.currency}{s.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            to {iAmPaying ? s.toUserName : "You"}
                          </p>
                        </div>
                      </div>

                      {iAmPaying && (
                        <Button 
                          onClick={() => handleOpenDialog(s)} 
                          className="rounded-xl px-8 w-full sm:w-auto font-bold shadow-sm"
                        >
                          <Zap className="h-4 w-4 mr-2 fill-amber-400 text-amber-400" />
                          Settle & Pay
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {otherSettlements.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Other Group Settlements</h3>
          <div className="space-y-4">
            {otherSettlements.map((s, idx) => {
              const fromMember = group.members.find(m => m.id === s.fromUserId);
              const toMember = group.members.find(m => m.id === s.toUserId);
              
              return (
              <Card key={idx} className="border-none shadow-sm opacity-75">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={fromMember?.photoUrl || fromMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                      <AvatarFallback>{s.fromUserName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={toMember?.photoUrl || toMember?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
                      <AvatarFallback>{s.toUserName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {group.currency === 'INR' ? '₹' : group.currency}{s.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.fromUserName} pays {s.toUserName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </section>
      )}

      {/* Industrial Setu Payment Dialog */}
      <Dialog open={!!selectedSettlement} onOpenChange={(open) => {
        if (!open) {
          setSelectedSettlement(null);
          setPaymentStatus("idle");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                Verified UPI Settlement
              </div>
            </div>
            <DialogTitle className="text-xl font-black text-gray-900 mt-2">
              Settle with {selectedSettlement?.toUserName}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs">
              Automated bank verification powered by Setu UPI Deeplinks.
            </DialogDescription>
          </DialogHeader>

          {dialogLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-sm font-semibold text-gray-500">Generating secure UPI payment session...</p>
            </div>
          ) : paymentStatus === "paid" ? (
            /* CELEBRATION / VERIFIED SCREEN */
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Payment Verified!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Bank confirmation received. Your balance has been automatically updated.
                </p>
              </div>

              {verifiedUtr && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-mono text-gray-600 w-full flex items-center justify-between">
                  <span className="font-semibold text-gray-400">BANK UTR:</span>
                  <span className="font-bold text-gray-800">{verifiedUtr}</span>
                </div>
              )}

              <Button 
                onClick={() => setSelectedSettlement(null)} 
                className="w-full rounded-xl h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md"
              >
                Done & View Balances
              </Button>
            </div>
          ) : setuData ? (
            /* PAYMENT CHECKOUT & VERIFICATION */
            <div className="space-y-5 pt-2">
              
              {/* Price Breakdown Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-amber-50/30 border border-gray-100 space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Settlement Amount</span>
                  <span className="font-semibold text-gray-900">₹{setuData.baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    Instant Bank Verification Fee
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                  </span>
                  <span className="font-semibold text-gray-900">+₹{setuData.platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200/80 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">Total Payable</span>
                  <span className="text-2xl font-black text-gray-900">
                    ₹{setuData.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Live Detection Radar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                  </span>
                  <span className="font-medium">Waiting for UPI bank confirmation...</span>
                </div>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              </div>

              {/* Receiver details preview / Missing Warning */}
              {receiverDetails?.upiId ? (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-500">Paying to UPI ID: <strong className="text-gray-800">{receiverDetails.upiId}</strong></span>
                  <button 
                    onClick={() => handleCopyUpi(receiverDetails.upiId)}
                    className="text-gray-400 hover:text-gray-700 font-semibold p-1"
                  >
                    {copiedUpi ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
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
                      Direct automated payment to their personal bank account is unavailable. You can remind them to add their UPI ID in their Splinzo profile, or settle manually offline.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Mobile Action: Open in UPI App */}
              <div className="space-y-2">
                <Button 
                  asChild
                  className="w-full rounded-2xl h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <a href={setuData.upiUrl} target="_blank" rel="noopener noreferrer">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Pay ₹{setuData.totalAmount.toFixed(2)} via UPI App
                  </a>
                </Button>
                <p className="text-[11px] text-center text-gray-400 font-medium">
                  Opens Google Pay, PhonePe, Paytm, or BHIM automatically
                </p>
              </div>

              {/* Toggle Dynamic QR Code */}
              <div className="border border-gray-100 rounded-2xl p-3 bg-white shadow-xs">
                <button 
                  onClick={() => setShowQr(!showQr)}
                  className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-gray-900"
                >
                  <span className="flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-gray-500" />
                    {showQr ? "Hide QR Code" : "Scan QR Code on Desktop"}
                  </span>
                  {showQr ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showQr && (
                  <div className="mt-4 flex flex-col items-center space-y-2 pb-2">
                    <div className="p-3 bg-white rounded-2xl border shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setuData.upiUrl)}`} 
                        alt="Setu UPI QR"
                        className="h-44 w-44 object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-gray-400">Scan with any UPI camera or banking app</span>
                  </div>
                )}
              </div>

              {/* Sandbox / Testing Simulation Button */}
              {setuData.isSimulated && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Setu Sandbox Testing Mode
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    className="w-full rounded-xl text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    {simulating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Simulate Successful Bank Confirmation
                  </Button>
                </div>
              )}

            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-sm text-gray-600">
                Could not connect to UPI settlement service. Please try again.
              </p>
              <Button 
                onClick={() => selectedSettlement && handleOpenDialog(selectedSettlement)} 
                className="w-full rounded-xl"
              >
                Retry Connection
              </Button>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}
