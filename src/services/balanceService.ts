import { Expense } from "@/types/expense";
import { Payment } from "@/types/payment";
import { GroupMember } from "@/types/group";
import { SplitResolver } from "@/lib/fintech/splitResolver";

export interface Settlement {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export const balanceService = {
  /**
   * Calculates the net balance for each user in a group based on expenses and approved payments.
   * Positive balance = user is owed money
   * Negative balance = user owes money
   * Uses SplitResolver with largest-remainder penny conservation to strictly preserve zero-sum balances.
   */
  calculateBalances(
    members: GroupMember[],
    expenses: Expense[],
    payments: Payment[]
  ): Record<string, number> {
    const balances: Record<string, number> = {};
    
    // Initialize balances to 0 for all members
    members.forEach((m) => {
      balances[m.id] = 0;
    });

    // Process expenses with unified SplitResolver
    expenses.forEach((expense) => {
      // 1. Credit payers (supports single and multi-payer distributions)
      const payerCredits = SplitResolver.resolvePayerCredits(expense);
      for (const [payerId, paidAmount] of Object.entries(payerCredits)) {
        balances[payerId] = (balances[payerId] || 0) + paidAmount;
      }

      // 2. Subtract resolved member shares (penny-conserved across all 6 modes)
      const memberShares = SplitResolver.resolveMemberShares(expense);
      for (const [userId, share] of Object.entries(memberShares)) {
        balances[userId] = (balances[userId] || 0) - share;
      }
    });

    // Process approved payments (settlements)
    payments.forEach((payment) => {
      if (payment.status === "approved") {
        if (balances[payment.fromUserId] !== undefined) {
          balances[payment.fromUserId] += payment.amount;
        }
        if (balances[payment.toUserId] !== undefined) {
          balances[payment.toUserId] -= payment.amount;
        }
      }
    });

    // Clean up floating point representation to 2 decimals
    const roundedBalances: Record<string, number> = {};
    for (const [uid, bal] of Object.entries(balances)) {
      const rounded = Math.round(bal * 100) / 100;
      roundedBalances[uid] = Object.is(rounded, -0) ? 0 : rounded;
    }

    return roundedBalances;
  },

  /**
   * Debt simplification algorithm
   * Matches the largest debtors with the largest creditors to minimize total transactions.
   */
  suggestSettlements(
    balances: Record<string, number>,
    members: GroupMember[]
  ): Settlement[] {
    const debtors: { id: string; amount: number; name: string }[] = [];
    const creditors: { id: string; amount: number; name: string }[] = [];

    // Separate debtors and creditors
    for (const [userId, balance] of Object.entries(balances)) {
      if (Math.abs(balance) < 0.01) continue; // Ignore negligible amounts

      const member = members.find((m) => m.id === userId);
      const name = member ? member.name : "Unknown User";

      if (balance < 0) {
        debtors.push({ id: userId, amount: Math.abs(balance), name });
      } else if (balance > 0) {
        creditors.push({ id: userId, amount: balance, name });
      }
    }

    // Sort both descending by amount
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: Settlement[] = [];
    let d = 0; // debtor index
    let c = 0; // creditor index

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];

      const settleAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        fromUserId: debtor.id,
        fromUserName: debtor.name,
        toUserId: creditor.id,
        toUserName: creditor.name,
        amount: Number(settleAmount.toFixed(2)),
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      // Move to next if fully settled
      if (Math.abs(debtor.amount) < 0.01) d++;
      if (Math.abs(creditor.amount) < 0.01) c++;
    }

    return settlements;
  }
};
