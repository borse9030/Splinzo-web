"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useInvitations } from "@/hooks/useInvitations";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { usePayments } from "@/hooks/usePayments";
import { invitationService } from "@/services/invitationService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardBannerAd } from "@/components/ads/DashboardBannerAd";
import { 
  Inbox, 
  Check, 
  X, 
  Receipt, 
  Users, 
  Globe, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  CheckCheck,
  Zap,
  Send,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";

const AMBER = "#F9B912";
const AMBER_LIGHT = "#FFF8E1";

export default function ActivityPage() {
  const { appUser } = useAuth();
  const router = useRouter();

  const { invitations, loading: invLoading } = useInvitations();
  const { feed, loading: feedLoading } = useActivityFeed();
  const { 
    incomingPayments, 
    outgoingPayments, 
    loading: payLoading, 
    approvePayment,
    approvingId,
    pendingIncomingCount 
  } = usePayments();

  const [activeTab, setActiveTab] = useState<"all" | "settlements" | "invites" | "timeline">("all");
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [declinedInviteIds, setDeclinedInviteIds] = useState<Set<string>>(new Set());
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const handleAcceptInvite = async (invitationId: string, groupId: string) => {
    if (!appUser) return;
    setProcessingInviteId(invitationId);
    try {
      await invitationService.acceptInvitation(invitationId, groupId, appUser);
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setProcessingInviteId(null);
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    setProcessingInviteId(invitationId);
    try {
      await invitationService.declineInvitation(invitationId);
      setDeclinedInviteIds(prev => new Set([...prev, invitationId]));
    } catch (err) {
      console.error("Failed to decline invitation:", err);
    } finally {
      setProcessingInviteId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  const visibleInvitations = invitations.filter(inv => !declinedInviteIds.has(inv.id));
  const isLoading = invLoading || feedLoading || payLoading;

  const totalItems = visibleInvitations.length + incomingPayments.length + outgoingPayments.length + feed.length;

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "expense":
        return <Receipt className="h-5 w-5 text-amber-600" />;
      case "payment":
        return <Zap className="h-5 w-5 text-emerald-600" />;
      case "group":
      case "trip":
        return <Users className="h-5 w-5 text-blue-600" />;
      default:
        return <Globe className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatPaymentDate = (createdAt: any) => {
    try {
      if (!createdAt) return "";
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return format(date, "MMM d, h:mm a");
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <header>
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg mt-2" />
        </header>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border border-gray-100 shadow-sm rounded-2xl">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-7 w-20 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* ══ HEADER ══ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            Activity
            {pendingIncomingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                {pendingIncomingCount} Settlement{pendingIncomingCount > 1 ? "s" : ""} Pending
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Real-time settlements, invitations, and group timeline
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2">
          {visibleInvitations.length > 0 && (
            <div
              className="h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Inbox className="h-3.5 w-3.5" />
              {visibleInvitations.length} Invite{visibleInvitations.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </header>

      {/* ══ FILTER TABS ══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "all"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "settlements"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Settlements
          {(incomingPayments.length + outgoingPayments.length) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
              {incomingPayments.length + outgoingPayments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "invites"
              ? "bg-amber-500 text-gray-950 shadow-sm shadow-amber-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          Invitations
          {visibleInvitations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 text-current">
              {visibleInvitations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "timeline"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Timeline
          {feed.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
              {feed.length}
            </span>
          )}
        </button>
      </div>

      {/* Ad placement */}
      <DashboardBannerAd />

      {/* ══ UNIFIED EMPTY STATE ══ */}
      {totalItems === 0 && (
        <Card className="border border-dashed border-gray-200 shadow-none rounded-3xl bg-gray-50/60 my-6">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm"
              style={{ background: AMBER_LIGHT }}
            >
              <CheckCheck className="h-8 w-8" style={{ color: AMBER }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-2 max-w-md text-sm leading-relaxed">
              No pending invitations, incoming settlements, or recent group activities. Everything is settled and up to date!
            </p>
          </CardContent>
        </Card>
      )}

      {/* ══ SECTION: ⚡ INCOMING UPI SETTLEMENTS (CREDITOR VIEW) ══ */}
      {(activeTab === "all" || activeTab === "settlements") && incomingPayments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              ⚡ Incoming UPI Settlements
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {incomingPayments.length} Received
            </span>
          </div>

          <div className="space-y-2.5">
            {incomingPayments.map((payment) => {
              const isApproved = payment.status === "approved";
              return (
                <Card
                  key={payment.id}
                  className={`border transition-all rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md ${
                    isApproved 
                      ? "border-emerald-200/80 hover:border-emerald-300" 
                      : "border-blue-200 hover:border-blue-300 bg-blue-50/20"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {isApproved ? (
                          <ArrowDownLeft className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                            <span className="text-emerald-700 font-extrabold">{payment.fromUserName}</span> settled with you
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> ✓ Automated UPI Settlement
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" /> ⚡ Verifying with Bank...
                              </>
                            )}
                          </span>

                          {payment.utr && (
                            <button
                              onClick={() => copyToClipboard(payment.utr!)}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded transition-colors"
                              title="Click to copy Bank UTR reference"
                            >
                              UTR: {payment.utr}
                              {copiedUtr === payment.utr ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-400" />
                              )}
                            </button>
                          )}

                          <span className="text-xs text-gray-400">
                            • {formatPaymentDate(payment.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                      <div className="text-base sm:text-lg font-black text-emerald-600">
                        +₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      {!isApproved && (
                        <Button
                          size="sm"
                          disabled={approvingId === payment.id}
                          onClick={() => approvePayment(payment.id)}
                          className="h-7 px-3 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 mt-1 shadow-sm"
                        >
                          {approvingId === payment.id ? "Approving..." : "Confirm Received"}
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

      {/* ══ SECTION: 📤 MY PAYMENTS (DEBTOR VIEW) ══ */}
      {(activeTab === "all" || activeTab === "settlements") && outgoingPayments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <Send className="h-3.5 w-3.5 text-gray-500" />
              📤 My Payments (Sent)
            </h2>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
              {outgoingPayments.length} Sent
            </span>
          </div>

          <div className="space-y-2.5">
            {outgoingPayments.map((payment) => {
              const isApproved = payment.status === "approved";
              return (
                <Card
                  key={payment.id}
                  className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-gray-100 text-gray-700 border border-gray-200">
                        <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          You settled with <span className="text-gray-900 font-extrabold">{payment.toUserName}</span>
                        </h3>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                              isApproved
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> ✓ Verified via UPI
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" /> ⚡ Verifying with Bank...
                              </>
                            )}
                          </span>

                          {payment.utr && (
                            <button
                              onClick={() => copyToClipboard(payment.utr!)}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded transition-colors"
                              title="Click to copy Bank UTR reference"
                            >
                              UTR: {payment.utr}
                              {copiedUtr === payment.utr ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-gray-400" />
                              )}
                            </button>
                          )}

                          <span className="text-xs text-gray-400">
                            • {formatPaymentDate(payment.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                      <div className="text-base sm:text-lg font-black text-gray-900">
                        -₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ SECTION: ✈️ INVITATIONS ══ */}
      {(activeTab === "all" || activeTab === "invites") && visibleInvitations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-3.5 w-3.5 text-amber-500" />
              ✈️ Trip & Group Invitations
            </h2>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {visibleInvitations.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {visibleInvitations.map((invitation) => (
              <Card
                key={invitation.id}
                className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden bg-white ring-1 ring-black/5"
              >
                <div className="h-1.5 w-full" style={{ background: AMBER }} />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0 shadow-sm"
                      style={{ background: AMBER_LIGHT, color: "#B45309" }}
                    >
                      {invitation.groupName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-base truncate">
                        {invitation.groupName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-700">{invitation.inviterName}</span>
                        {" "}invited you to join
                      </p>
                      <div className="flex gap-2.5 mt-3.5">
                        <Button
                          size="sm"
                          disabled={processingInviteId === invitation.id}
                          onClick={() => handleAcceptInvite(invitation.id, invitation.groupId)}
                          className="rounded-full px-5 font-bold text-xs sm:text-sm h-9 hover:opacity-90 shadow-sm"
                          style={{ background: AMBER, color: "#1a1a1a" }}
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          {processingInviteId === invitation.id ? "Joining..." : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingInviteId === invitation.id}
                          onClick={() => handleDeclineInvite(invitation.id)}
                          className="rounded-full px-5 font-bold text-xs sm:text-sm h-9 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ══ SECTION: 🌐 GLOBAL TIMELINE FEED ══ */}
      {(activeTab === "all" || activeTab === "timeline") && feed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-blue-500" />
              🌐 Global Timeline
            </h2>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">
              {feed.length} Recent
            </span>
          </div>

          <div className="space-y-2.5">
            {feed.map((activity) => (
              <Card 
                key={activity.id} 
                className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white"
              >
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm"
                    style={{ background: AMBER_LIGHT }}
                  >
                    {getTimelineIcon(activity.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-[15px] text-gray-900 leading-snug">
                      <span className="font-extrabold text-gray-900">{activity.createdByName}</span>
                      {" "}
                      <span className="text-gray-700">{activity.message}</span>
                    </p>
                    <p className="text-xs font-medium text-gray-400 mt-1">
                      {format(activity.createdAt, "MMM d, h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Filter-specific Empty States */}
      {activeTab === "settlements" && incomingPayments.length === 0 && outgoingPayments.length === 0 && (
        <Card className="border border-dashed border-gray-200 shadow-none rounded-3xl bg-gray-50/60 p-8 text-center">
          <Zap className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-gray-800">No settlement history yet</p>
          <p className="text-xs text-gray-500 mt-1">UPI settlements and bank verification updates will appear here automatically.</p>
        </Card>
      )}

      {activeTab === "invites" && visibleInvitations.length === 0 && (
        <Card className="border border-dashed border-gray-200 shadow-none rounded-3xl bg-gray-50/60 p-8 text-center">
          <Inbox className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="font-bold text-gray-800">No pending invitations</p>
          <p className="text-xs text-gray-500 mt-1">When someone invites you to join a trip or group, it will show up here.</p>
        </Card>
      )}

      {activeTab === "timeline" && feed.length === 0 && (
        <Card className="border border-dashed border-gray-200 shadow-none rounded-3xl bg-gray-50/60 p-8 text-center">
          <Globe className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="font-bold text-gray-800">No recent timeline activity</p>
          <p className="text-xs text-gray-500 mt-1">Expense additions, trip updates, and member activities will stream in live.</p>
        </Card>
      )}
    </div>
  );
}
