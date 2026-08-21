"use client";

import { use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useExpense } from "@/hooks/useExpense";
import { useGroup } from "@/hooks/useGroup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Receipt, Calendar, User, IndianRupee, Smartphone, ShieldCheck, Copy, QrCode } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/hooks/usePayments";
import { paymentService } from "@/services/paymentService";
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
import { useState, useEffect } from "react";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function ExpenseDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const resolvedParams = use(params);
  const { groupId, expenseId } = resolvedParams;
  const { appUser } = useAuth();
  const { expense, loading: expenseLoading, error: expenseError } = useExpense(groupId, expenseId);
  const { group, loading: groupLoading } = useGroup(groupId);
  const { payments } = usePayments(groupId);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiverDetails, setReceiverDetails] = useState<any>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [returnedFromUpi, setReturnedFromUpi] = useState(false);

  // Clever UX: Detect when user returns to the web browser from the UPI app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && paymentInitiated) {
        // User came back from the UPI app!
        setTimeout(() => setReturnedFromUpi(true), 500); // small delay for smooth transition
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [paymentInitiated]);

  if (expenseError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 mt-4">
        <p className="font-medium">Failed to load expense details.</p>
      </div>
    );
  }

  if (expenseLoading || groupLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-bold text-gray-900">Expense not found</h3>
        <Button asChild className="mt-4 rounded-full" style={{ background: AMBER, color: "#1a1a1a" }}>
          <Link href={`/groups/${groupId}`}>Back to Group</Link>
        </Button>
      </div>
    );
  }

  // Find member details
  const payer = group?.members?.find((m: any) => m.id === expense.payerId) || {
    id: "",
    displayName: "Unknown User",
    email: "",
  };
  const payerName = payer.displayName || "Unknown User";

  // Calculate my share if I'm not the payer
  let myShare = 0;
  const amIInvolved = expense.splitBetweenIds.includes(appUser?.id || "");
  const amIPayer = expense.payerId === appUser?.id;
  
  if (amIInvolved && !amIPayer) {
    if (expense.customSplitAmounts && expense.customSplitAmounts[appUser!.id]) {
      myShare = expense.customSplitAmounts[appUser!.id];
    } else {
      myShare = expense.amount / expense.splitBetweenIds.length;
    }
  }

  // Find if there's already a payment for this expense
  const paymentRecord = payments?.find(p => p.expenseId === expenseId && ((p.fromUserId === appUser?.id) || (p.toUserId === appUser?.id && p.fromUserId === payer.id)));
  // Actually, look for a payment where I am paying the payer for this expense
  const myPaymentToPayer = payments?.find(p => p.expenseId === expenseId && p.fromUserId === appUser?.id && p.toUserId === payer.id);

  const handleOpenPaymentDialog = async () => {
    setPaymentDialogOpen(true);
    setPaymentInitiated(false);
    setReturnedFromUpi(false);
    setReceiverDetails(null);
    setDialogLoading(true);
    try {
      const user = await userService.getUser(payer.id);
      if (user) {
        setReceiverDetails(user);
      }
    } catch (err) {
      console.error("Failed to load receiver details:", err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!appUser || !group) return;
    setRecordingPayment(true);
    try {
      const paymentRef = doc(collection(db, "payments"));
      await setDoc(paymentRef, {
        expenseId: expenseId,
        groupId: group.id,
        fromUserId: appUser.id,
        fromUserName: appUser.displayName,
        toUserId: payer.id,
        toUserName: payer.displayName,
        amount: myShare,
        status: "pending_approval",
        createdAt: serverTimestamp(),
      });
      setPaymentDialogOpen(false);
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await paymentService.approvePayment(paymentId);
    } catch (err) {
      console.error("Failed to approve payment:", err);
    }
  };

  const dateStr = expense.createdAt
    ? expense.createdAt.toDate().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white shadow-sm">
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </div>
          </Link>
          <h2 className="text-xl font-extrabold text-gray-900">Expense Details</h2>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        {/* Hero: bill image if available, else amber icon */}
        {(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) ? (
          <a href={(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) as string} target="_blank" rel="noopener noreferrer" className="block relative">
            <img
              src={(expense.billImageUrl || expense.imageUrl || expense.receiptUrl) as string}
              alt="Bill"
              className="w-full object-cover"
              style={{ maxHeight: "260px", minHeight: "160px" }}
            />
            {/* Tap hint */}
            <div
              className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
            >
              Tap to view full
            </div>
          </a>
        ) : (
          <div
            className="h-24 w-full flex items-center justify-center"
            style={{ background: AMBER_LIGHT }}
          >
            <Receipt className="h-10 w-10" style={{ color: AMBER }} />
          </div>
        )}

        <CardContent className="pt-5 pb-6 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{expense.description}</h1>
          <p className="text-4xl font-extrabold mb-4" style={{ color: AMBER }}>
            {expense.currency === "INR" ? "₹" : expense.currency} {expense.amount.toFixed(2)}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <Calendar className="h-4 w-4" />
            <span>Added on {dateStr}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payer and Split Details */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Paid By</h3>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                style={{ background: "#4CAF50" }}
              >
                {payerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{payerName}</p>
                <p className="text-xs text-gray-500 font-medium">Paid the full amount</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Split Between</h3>
            <div className="space-y-3">
              {expense.splitBetweenIds.map((userId) => {
                const member = group?.members?.find((m: any) => m.id === userId) || {
                  id: "",
                  displayName: "Unknown User",
                };
                const memberName = member.displayName || "Unknown User";

                let shareAmount = 0;
                if (expense.customSplitAmounts && expense.customSplitAmounts[userId]) {
                  shareAmount = expense.customSplitAmounts[userId];
                } else {
                  shareAmount = expense.amount / expense.splitBetweenIds.length;
                }

                const isMe = userId === appUser?.id;

                return (
                  <div key={userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center font-bold shadow-sm text-sm"
                        style={isMe ? { background: AMBER, color: "#1a1a1a" } : { background: "#F5F5F5", color: "#666" }}
                      >
                        {memberName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm text-gray-900">
                        {memberName} {isMe && "(You)"}
                      </p>
                    </div>
                    <p className="font-bold text-sm text-gray-900">
                      ₹{shareAmount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Action Bar */}
      {amIInvolved && !amIPayer && myShare > 0 && !myPaymentToPayer && (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-blue-50/50">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-1">You owe {payerName}</h3>
            <p className="text-2xl font-extrabold text-blue-600 mb-4">₹{myShare.toFixed(2)}</p>
            <Button onClick={handleOpenPaymentDialog} className="w-full rounded-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700">
              Pay via UPI
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Status Bar */}
      {myPaymentToPayer && (
        <Card className={`border-none shadow-sm rounded-3xl overflow-hidden ${myPaymentToPayer.status === 'approved' ? 'bg-green-50' : 'bg-amber-50'}`}>
          <CardContent className="p-6 text-center">
            {myPaymentToPayer.status === 'approved' ? (
              <>
                <h3 className="font-bold text-green-900">Payment Complete</h3>
                <p className="text-sm text-green-700 mt-1">You have settled your share of ₹{myPaymentToPayer.amount.toFixed(2)} for this expense.</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-amber-900">Payment Pending Approval</h3>
                <p className="text-sm text-amber-700 mt-1">Waiting for {payerName} to confirm they received ₹{myPaymentToPayer.amount.toFixed(2)}.</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Receiver Approval Bar */}
      {amIPayer && payments && payments.filter(p => p.expenseId === expenseId && p.status === 'pending_approval' && p.toUserId === appUser?.id).map(p => (
        <Card key={p.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-amber-100/50 mt-4">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-amber-900">{p.fromUserName} marked their share as paid</h3>
            <p className="text-2xl font-extrabold text-amber-700 my-2">₹{p.amount.toFixed(2)}</p>
            <Button onClick={() => handleApprovePayment(p.id)} className="w-full rounded-full h-12 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white">
              Confirm Received
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Pay your share of ₹{myShare.toFixed(2)} to {payerName}.
            </DialogDescription>
          </DialogHeader>

          {dialogLoading ? (
            <div className="py-6 flex justify-center"><Skeleton className="h-24 w-full" /></div>
          ) : (
            <div className="space-y-6 py-4">
              {returnedFromUpi ? (
                <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Welcome Back!</h3>
                    <p className="text-sm text-gray-600 mt-2">Did your UPI payment of ₹{myShare.toFixed(2)} to {payerName} succeed?</p>
                  </div>
                  <div className="flex gap-3 w-full pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-12"
                      onClick={() => {
                        setPaymentInitiated(false);
                        setReturnedFromUpi(false);
                      }}
                    >
                      No, try again
                    </Button>
                    <Button 
                      onClick={handleRecordPayment} 
                      disabled={recordingPayment}
                      className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700"
                    >
                      {recordingPayment ? "Recording..." : "Yes, it's paid!"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border">
                    <span className="text-sm font-medium text-gray-500 mb-1">Amount to pay</span>
                    <span className="text-4xl font-extrabold text-gray-900">
                      {group?.currency === 'INR' ? '₹' : (group?.currency || '₹')}{myShare.toFixed(2)}
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
                            onClick={() => setPaymentInitiated(true)}
                          >
                            <a href={`upi://pay?pa=${receiverDetails.upiId}&pn=${encodeURIComponent(receiverDetails.displayName || payerName)}&am=${myShare}&cu=INR`} target="_blank" rel="noopener noreferrer">
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
                      <p>{payerName} has not added a UPI ID or QR code. Please settle offline.</p>
                    </div>
                  )}

                  <Button 
                    variant="outline"
                    onClick={handleRecordPayment} 
                    disabled={recordingPayment}
                    className="w-full rounded-xl h-12 text-gray-500"
                  >
                    {recordingPayment ? "Recording..." : "I paid manually, send for approval"}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
