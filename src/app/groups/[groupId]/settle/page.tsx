"use client";

import { use, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { useExpenses } from "@/hooks/useExpenses";
import { usePayments } from "@/hooks/usePayments";
import { balanceService } from "@/services/balanceService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, CheckCircle2, IndianRupee, Smartphone, ShieldCheck, Copy, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { userService } from "@/services/userService";

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

  const [settling, setSettling] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [receiverDetails, setReceiverDetails] = useState<any>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  const loading = groupLoading || expensesLoading || paymentsLoading;

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
    setDialogLoading(true);
    try {
      const user = await userService.getUser(settlement.toUserId);
      if (user) {
        setReceiverDetails(user);
      }
    } catch (err) {
      console.error("Failed to load receiver details:", err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedSettlement) return;
    setSettling(selectedSettlement.toUserId);
    try {
      const paymentRef = doc(collection(db, "payments"));
      await setDoc(paymentRef, {
        groupId: group.id,
        fromUserId: selectedSettlement.fromUserId,
        fromUserName: selectedSettlement.fromUserName,
        toUserId: selectedSettlement.toUserId,
        toUserName: selectedSettlement.toUserName,
        amount: selectedSettlement.amount,
        status: "pending_approval",
        createdAt: serverTimestamp(),
      });
      // Close dialog
      setSelectedSettlement(null);
    } catch (err) {
      console.error("Failed to record settlement:", err);
    } finally {
      setSettling(null);
    }
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
              
              return (
                <Card key={idx} className="border-none shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                          <AvatarFallback>{s.fromUserName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex flex-col items-center px-2">
                          <span className="text-sm font-medium text-gray-500">
                            {iAmPaying ? "You pay" : `${s.fromUserName} pays`}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-300 my-1" />
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
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
                          className="rounded-xl px-8 w-full sm:w-auto"
                        >
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
            {otherSettlements.map((s, idx) => (
              <Card key={idx} className="border-none shadow-sm opacity-75">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fromUserId}`} />
                      <AvatarFallback>{s.fromUserName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.toUserId}`} />
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
            ))}
          </div>
        </section>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!selectedSettlement} onOpenChange={(open) => !open && setSelectedSettlement(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              You are settling your balance with {selectedSettlement?.toUserName}.
            </DialogDescription>
          </DialogHeader>

          {dialogLoading ? (
            <div className="py-6 flex justify-center"><Skeleton className="h-24 w-full" /></div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border">
                <span className="text-sm font-medium text-gray-500 mb-1">Amount to pay</span>
                <span className="text-4xl font-extrabold text-gray-900">
                  {group.currency === 'INR' ? '₹' : group.currency}{selectedSettlement?.amount.toFixed(2)}
                </span>
              </div>

              {/* UPI Options */}
              {receiverDetails && (receiverDetails.upiId || receiverDetails.paymentQrUrl) ? (
                <div className="space-y-4">
                  {receiverDetails.paymentQrUrl && (
                    <div className="flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-200 p-4 rounded-2xl">
                      <QrCode className="h-6 w-6 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-600">Scan QR to Pay</span>
                      <img src={receiverDetails.paymentQrUrl} alt="Receiver QR" className="h-48 w-48 object-contain rounded-xl" />
                    </div>
                  )}

                  {receiverDetails.upiId && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Smartphone className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">UPI ID</p>
                            <p className="font-semibold text-sm">{receiverDetails.upiId}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(receiverDetails.upiId)}>
                          <Copy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>

                      <Button 
                        asChild
                        className="w-full rounded-xl h-12 shadow-md bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        <a href={`upi://pay?pa=${receiverDetails.upiId}&pn=${encodeURIComponent(receiverDetails.displayName || selectedSettlement?.toUserName)}&am=${selectedSettlement?.amount}&cu=INR`} target="_blank" rel="noopener noreferrer">
                          <IndianRupee className="h-5 w-5 mr-2" />
                          Pay via UPI App
                        </a>
                      </Button>
                      <p className="text-xs text-center text-gray-500 mt-1">Tap to open GPay, PhonePe, Paytm, etc.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex gap-3 text-sm">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <p>{selectedSettlement?.toUserName} has not added a UPI ID or QR code. Please settle offline.</p>
                </div>
              )}

              <Button 
                onClick={handleSettle} 
                disabled={settling === selectedSettlement?.toUserId}
                className="w-full rounded-xl h-12"
              >
                {settling === selectedSettlement?.toUserId ? "Recording..." : "I have paid, send for approval"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
