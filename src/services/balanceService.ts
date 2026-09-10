import { Expense } from "@/types/expense";
import { Payment } from "@/types/payment";
import { GroupMember } from "@/types/group";

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

    // Process expenses
    expenses.forEach((expense) => {
      // Credit payers (support multi-payer)
      if (expense.payers && Object.keys(expense.payers).length > 0) {
        for (const [payerId, paidAmount] of Object.entries(expense.payers)) {
          const amt = Number(paidAmount) || 0;
          if (amt > 0) {
            balances[payerId] = (balances[payerId] || 0) + amt;
          }
        }
      } else if (expense.payerId) {
        balances[expense.payerId] = (balances[expense.payerId] || 0) + expense.amount;
      }

      // Subtract shares from participants
      if (expense.customSplitAmounts && Object.keys(expense.customSplitAmounts).length > 0) {
        // Custom split
        for (const [userId, amount] of Object.entries(expense.customSplitAmounts)) {
          const share = Number(amount) || 0;
          balances[userId] = (balances[userId] || 0) - share;
        }
      } else if (expense.splitBetweenIds && expense.splitBetweenIds.length > 0) {
        // Equal split
        const share = expense.amount / expense.splitBetweenIds.length;
        expense.splitBetweenIds.forEach((userId) => {
          balances[userId] = (balances[userId] || 0) - share;
        });
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

    return balances;
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
