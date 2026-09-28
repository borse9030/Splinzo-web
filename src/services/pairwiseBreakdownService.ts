import { Expense } from "@/types/expense";
import { Payment } from "@/types/payment";
import { SplitResolver } from "@/lib/fintech/splitResolver";

export interface PairwiseExpenseItem {
  expenseId: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  createdAt?: any;
  payerId: string;
  payerName?: string;
  isCreditorPayer: boolean; // toUserId paid
  isDebtorPayer: boolean; // fromUserId paid
  debtorShare: number; // fromUserId's share
  creditorShare: number; // toUserId's share
  debtorItems?: string[]; // itemized products assigned to debtor
  creditorItems?: string[]; // itemized products assigned to creditor
  netEffect: number; // positive = debtor owes creditor (+), negative = debtor offset (-)
}

export interface PairwisePaymentItem {
  paymentId: string;
  amount: number;
  currency: string;
  createdAt?: any;
  fromUserId: string;
  toUserId: string;
  amountDeducted: number;
}

export interface PairwiseSettlementBreakdown {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  settlementAmount: number;
  currency: string;
  contributingExpenses: PairwiseExpenseItem[];
  contributingPayments: PairwisePaymentItem[];
  totalOwedForProducts: number; // what debtor owes for products paid by creditor
  totalOffsetForProducts: number; // what debtor paid that offsets what they owe
  totalPaymentsDeducted: number;
  calculatedNet: number;
  topProductNames: string[];
}

export const pairwiseBreakdownService = {
  /**
   * Computes the detailed breakdown of products, expenses, and payments
   * between a debtor (fromUser) and creditor (toUser).
   */
  getPairwiseBreakdown(
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    toUserName: string,
    expenses: Expense[],
    payments: Payment[] = [],
    currency: string = "INR",
    settlementAmount: number = 0
  ): PairwiseSettlementBreakdown {
    const contributingExpenses: PairwiseExpenseItem[] = [];
    let totalOwedForProducts = 0;
    let totalOffsetForProducts = 0;

    // Sort expenses chronologically descending (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });

    for (const expense of sortedExpenses) {
      if (!expense.amount || expense.amount <= 0) continue;

      const payerCredits = SplitResolver.resolvePayerCredits(expense);
      const memberShares = SplitResolver.resolveMemberShares(expense);

      const paidByCreditor = payerCredits[toUserId] || 0;
      const paidByDebtor = payerCredits[fromUserId] || 0;
      const debtorShare = memberShares[fromUserId] || 0;
      const creditorShare = memberShares[toUserId] || 0;

      // Portion of debtor's share funded by creditor
      const owedToCreditor = paidByCreditor > 0 && expense.amount > 0
        ? (paidByCreditor / expense.amount) * debtorShare
        : 0;

      // Portion of creditor's share funded by debtor
      const offsetByDebtor = paidByDebtor > 0 && expense.amount > 0
        ? (paidByDebtor / expense.amount) * creditorShare
        : 0;

      const netEffect = Math.round((owedToCreditor - offsetByDebtor) * 100) / 100;

      // Check if both users participate in this expense or if there's direct financial interaction
      const isInvolved = Math.abs(netEffect) >= 0.01 || 
        (paidByCreditor > 0 && debtorShare > 0) || 
        (paidByDebtor > 0 && creditorShare > 0) ||
        (debtorShare > 0 && creditorShare > 0 && (paidByCreditor > 0 || paidByDebtor > 0));

      if (isInvolved) {
        // Collect assigned itemized items if present
        let debtorItems: string[] | undefined;
        let creditorItems: string[] | undefined;

        if (expense.itemizedItems && expense.itemizedItems.length > 0) {
          debtorItems = expense.itemizedItems
            .filter(item => item.assignedTo?.includes(fromUserId))
            .map(item => `${item.name} (${currency === 'INR' ? '₹' : currency}${item.price.toFixed(2)})`);

          creditorItems = expense.itemizedItems
            .filter(item => item.assignedTo?.includes(toUserId))
            .map(item => `${item.name} (${currency === 'INR' ? '₹' : currency}${item.price.toFixed(2)})`);
        }

        if (netEffect > 0) {
          totalOwedForProducts += netEffect;
        } else if (netEffect < 0) {
          totalOffsetForProducts += Math.abs(netEffect);
        }

        contributingExpenses.push({
          expenseId: expense.id,
          description: expense.description || "Expense",
          category: expense.category || "General",
          amount: expense.amount,
          currency: expense.currency || currency,
          createdAt: expense.createdAt,
          payerId: expense.payerId,
          isCreditorPayer: paidByCreditor > 0,
          isDebtorPayer: paidByDebtor > 0,
          debtorShare: Math.round(debtorShare * 100) / 100,
          creditorShare: Math.round(creditorShare * 100) / 100,
          debtorItems,
          creditorItems,
          netEffect,
        });
      }
    }

    // Process approved direct payments between fromUser and toUser
    const contributingPayments: PairwisePaymentItem[] = [];
    let totalPaymentsDeducted = 0;

    for (const payment of payments) {
      if (payment.status !== "approved") continue;

      if (payment.fromUserId === fromUserId && payment.toUserId === toUserId) {
        totalPaymentsDeducted += payment.amount;
        contributingPayments.push({
          paymentId: payment.id,
          amount: payment.amount,
          currency: currency,
          createdAt: payment.createdAt,
          fromUserId: payment.fromUserId,
          toUserId: payment.toUserId,
          amountDeducted: payment.amount,
        });
      }
    }

    totalOwedForProducts = Math.round(totalOwedForProducts * 100) / 100;
    totalOffsetForProducts = Math.round(totalOffsetForProducts * 100) / 100;
    totalPaymentsDeducted = Math.round(totalPaymentsDeducted * 100) / 100;

    const calculatedNet = Math.round((totalOwedForProducts - totalOffsetForProducts - totalPaymentsDeducted) * 100) / 100;

    const topProductNames = contributingExpenses
      .slice(0, 4)
      .map(e => e.description)
      .filter(Boolean);

    return {
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      settlementAmount: settlementAmount || (calculatedNet > 0 ? calculatedNet : 0),
      currency,
      contributingExpenses,
      contributingPayments,
      totalOwedForProducts,
      totalOffsetForProducts,
      totalPaymentsDeducted,
      calculatedNet,
      topProductNames,
    };
  },

  /**
   * Helper to format a clear WhatsApp reminder message that lists the exact products
   */
  formatWhatsAppReminder(
    breakdown: PairwiseSettlementBreakdown,
    groupName: string,
    myUpiId?: string | null,
    publicGroupUrl?: string
  ): string {
    const symbol = breakdown.currency === "INR" ? "₹" : breakdown.currency;
    const amountStr = breakdown.settlementAmount.toFixed(2);
    
    let productLines = "";
    if (breakdown.contributingExpenses.length > 0) {
      const lines = breakdown.contributingExpenses.slice(0, 5).map(e => {
        if (e.netEffect > 0) {
          return `  • *${e.description}*: ${symbol}${e.netEffect.toFixed(2)} (owed to ${breakdown.toUserName})`;
        } else if (e.netEffect < 0) {
          return `  • *${e.description}*: -${symbol}${Math.abs(e.netEffect).toFixed(2)} (offset by ${breakdown.fromUserName})`;
        } else {
          return `  • *${e.description}*: ${symbol}${e.amount.toFixed(2)} (shared)`;
        }
      });
      productLines = `📦 *For products / expenses:*\n${lines.join("\n")}\n\n`;
    }

    let upiBlock = "";
    if (myUpiId && myUpiId.trim().length > 0) {
      const upiUri = `upi://pay?pa=${myUpiId.trim()}&pn=${encodeURIComponent(breakdown.toUserName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(`Splinzo ${groupName}`)}`;
      upiBlock = `⚡ *Tap to pay instantly via UPI (GPay/PhonePe/Paytm):*\n${upiUri}\n\n`;
    }

    let linkBlock = "";
    if (publicGroupUrl) {
      linkBlock = `📊 *View group breakdown & settle:*\n${publicGroupUrl}\n\n`;
    }

    return (
      `👋 Hey ${breakdown.fromUserName}!\n\n` +
      `Just a friendly reminder for your pending balance of *${symbol}${amountStr}* in Splinzo for "*${groupName}*".\n\n` +
      productLines +
      upiBlock +
      linkBlock +
      `Thanks! ✨`
    );
  }
};
