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
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

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

  const handleSettle = async (settlement: any) => {
    setSettling(settlement.toUserId);
    try {
      const paymentRef = doc(collection(db, "payments"));
      await setDoc(paymentRef, {
        groupId: group.id,
        fromUserId: settlement.fromUserId,
        fromUserName: settlement.fromUserName,
        toUserId: settlement.toUserId,
        toUserName: settlement.toUserName,
        amount: settlement.amount,
        status: "pending_approval",
        createdAt: serverTimestamp(),
      });
      // Optionally show a toast
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
                          onClick={() => handleSettle(s)} 
                          disabled={settling === s.toUserId}
                          className="rounded-xl px-8 w-full sm:w-auto"
                        >
                          {settling === s.toUserId ? "Recording..." : "Record Payment"}
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
    </div>
  );
}
