import { Expense } from "@/types/expense";

/**
 * Unified mathematical engine for all expense splitting cases.
 * Strictly enforces zero-sum conservation so that:
 *   sum(memberShares) === expense.amount (rounded to 2 decimal places, exact in cents)
 */
export class SplitResolver {
  /**
   * Resolves the exact amount each participant owes for the given expense.
   * Returns a Record of userId -> exact amount owed (to 2 decimal places).
   */
  static resolveMemberShares(expense: Expense): Record<string, number> {
    const amount = expense.amount;
    const splitIds = Array.from(new Set(expense.splitBetweenIds || []));

    if (!amount || amount <= 0 || splitIds.length === 0) {
      return {};
    }

    const mode = expense.splitMode || "equal";

    switch (mode) {
      case "percentage":
        return this._resolvePercentage(amount, splitIds, expense.splitPercentages);

      case "shares":
        return this._resolveShares(amount, splitIds, expense.splitShares);

      case "adjustment":
        return this._resolveAdjustment(amount, splitIds, expense.splitAdjustments);

      case "custom":
        return this._resolveCustom(amount, splitIds, expense.customSplitAmounts);

      case "itemized":
        if (expense.itemizedItems && expense.itemizedItems.length > 0) {
          return this._resolveItemized(amount, splitIds, expense.itemizedItems);
        }
        if (expense.customSplitAmounts && Object.keys(expense.customSplitAmounts).length > 0) {
          return this._resolveCustom(amount, splitIds, expense.customSplitAmounts);
        }
        return this._resolveEqual(amount, splitIds);

      case "equal":
      default:
        if (expense.customSplitAmounts && Object.keys(expense.customSplitAmounts).length > 0) {
          return this._resolveCustom(amount, splitIds, expense.customSplitAmounts);
        }
        return this._resolveEqual(amount, splitIds);
    }
  }

  /**
   * Resolves the exact amount each payer contributed for the given expense.
   * Returns a Record of userId -> exact amount paid (to 2 decimal places).
   */
  static resolvePayerCredits(expense: Expense): Record<string, number> {
    const amount = expense.amount;
    if (expense.payers && Object.keys(expense.payers).length > 0) {
      const validPayers: Record<string, number> = {};
      for (const [payerId, paidAmount] of Object.entries(expense.payers)) {
        const num = Number(paidAmount) || 0;
        if (num > 0) {
          validPayers[payerId] = num;
        }
      }
      if (Object.keys(validPayers).length > 0) {
        return this._distributeCents(amount, validPayers);
      }
    }
    // Single payer fallback
    if (expense.payerId) {
      return { [expense.payerId]: Number(amount.toFixed(2)) };
    }
    return {};
  }

  // ─────────────────────────────────────────────────────────────
  // INTERNAL SPLIT CALCULATORS
  // ─────────────────────────────────────────────────────────────

  /** CASE 1: Equal Split with Largest Remainder penny distribution */
  private static _resolveEqual(totalAmount: number, userIds: string[]): Record<string, number> {
    if (userIds.length === 0) return {};
    const rawShares: Record<string, number> = {};
    const perPerson = totalAmount / userIds.length;
    for (const uid of userIds) {
      rawShares[uid] = perPerson;
    }
    return this._distributeCents(totalAmount, rawShares);
  }

  /** CASE 2: Percentage Split */
  private static _resolvePercentage(
    totalAmount: number,
    userIds: string[],
    percentages?: Record<string, number> | null
  ): Record<string, number> {
    if (userIds.length === 0) return {};
    if (!percentages || Object.keys(percentages).length === 0) {
      return this._resolveEqual(totalAmount, userIds);
    }

    const rawShares: Record<string, number> = {};
    let totalPct = 0;
    for (const uid of userIds) {
      const pct = percentages[uid] ?? 0;
      totalPct += pct;
      rawShares[uid] = totalAmount * (pct / 100);
    }

    // Normalize if percentages don't strictly sum to 100%
    if (totalPct > 0 && Math.abs(totalPct - 100) > 0.01) {
      for (const uid of userIds) {
        const pct = percentages[uid] ?? 0;
        rawShares[uid] = totalAmount * (pct / totalPct);
      }
    }

    return this._distributeCents(totalAmount, rawShares);
  }

  /** CASE 3: Shares / Ratios Split (Hare-Niemeyer / Largest Remainder Method) */
  private static _resolveShares(
    totalAmount: number,
    userIds: string[],
    shares?: Record<string, number> | null
  ): Record<string, number> {
    if (userIds.length === 0) return {};
    if (!shares || Object.keys(shares).length === 0) {
      return this._resolveEqual(totalAmount, userIds);
    }

    let totalShares = 0;
    for (const uid of userIds) {
      totalShares += Math.max(0, shares[uid] ?? 1);
    }
    if (totalShares <= 0) totalShares = userIds.length;

    const rawShares: Record<string, number> = {};
    for (const uid of userIds) {
      const s = Math.max(0, shares[uid] ?? 1);
      rawShares[uid] = totalAmount * (s / totalShares);
    }

    return this._distributeCents(totalAmount, rawShares);
  }

  /**
   * CASE 4: Plus/Minus Adjustments Split
   * Formula: Base amount = (Total - sum(adjustments)) / count
   * Each member owes: Base + adjustment
   */
  private static _resolveAdjustment(
    totalAmount: number,
    userIds: string[],
    adjustments?: Record<string, number> | null
  ): Record<string, number> {
    if (userIds.length === 0) return {};
    if (!adjustments || Object.keys(adjustments).length === 0) {
      return this._resolveEqual(totalAmount, userIds);
    }

    let totalAdjustments = 0;
    for (const uid of userIds) {
      totalAdjustments += adjustments[uid] ?? 0;
    }

    const remainingPool = totalAmount - totalAdjustments;
    const basePerPerson = remainingPool > 0 ? remainingPool / userIds.length : 0;

    const rawShares: Record<string, number> = {};
    for (const uid of userIds) {
      const adj = adjustments[uid] ?? 0;
      const raw = basePerPerson + adj;
      rawShares[uid] = Math.max(0, raw);
    }

    return this._distributeCents(totalAmount, rawShares);
  }

  /** CASE 5: Exact Custom Amounts */
  private static _resolveCustom(
    totalAmount: number,
    userIds: string[],
    customAmounts?: Record<string, number> | null
  ): Record<string, number> {
    if (userIds.length === 0) return {};
    if (!customAmounts || Object.keys(customAmounts).length === 0) {
      return this._resolveEqual(totalAmount, userIds);
    }

    const rawShares: Record<string, number> = {};
    let sumCustom = 0;
    for (const uid of userIds) {
      const val = customAmounts[uid] ?? 0;
      rawShares[uid] = val;
      sumCustom += val;
    }

    // If exact custom amounts match within 1 cent, distribute any tiny rounding diff
    if (Math.abs(sumCustom - totalAmount) <= 0.05) {
      return this._distributeCents(totalAmount, rawShares);
    }

    // If sum differs significantly, scale proportionally to preserve totalAmount
    if (sumCustom > 0) {
      for (const uid of userIds) {
        rawShares[uid] = totalAmount * ((customAmounts[uid] ?? 0) / sumCustom);
      }
      return this._distributeCents(totalAmount, rawShares);
    }

    return this._resolveEqual(totalAmount, userIds);
  }

  /**
   * CASE 6: Itemized Receipt Split
   * Each item has price and claimants (assignedTo). Remainder (tax, tip, fees) distributed proportionally.
   */
  private static _resolveItemized(
    totalAmount: number,
    userIds: string[],
    items: Array<{ name: string; price: number; assignedTo?: string[]; claimants?: string[] }>
  ): Record<string, number> {
    const subtotals: Record<string, number> = {};
    for (const uid of userIds) {
      subtotals[uid] = 0;
    }

    let itemsSum = 0;
    for (const item of items) {
      const price = Number(item.price) || 0;
      const claimants = (item.assignedTo || item.claimants || []).filter((id) => userIds.includes(id));
      const activeClaimants = claimants.length > 0 ? claimants : userIds;

      itemsSum += price;
      const perClaimant = price / activeClaimants.length;
      for (const uid of activeClaimants) {
        subtotals[uid] = (subtotals[uid] || 0) + perClaimant;
      }
    }

    const remainder = totalAmount - itemsSum;
    const rawShares: Record<string, number> = {};

    if (remainder > 0 && itemsSum > 0) {
      for (const uid of userIds) {
        const sub = subtotals[uid] || 0;
        const taxTipShare = remainder * (sub / itemsSum);
        rawShares[uid] = sub + taxTipShare;
      }
    } else {
      for (const uid of userIds) {
        rawShares[uid] = subtotals[uid] || 0;
      }
    }

    return this._distributeCents(totalAmount, rawShares);
  }

  // ─────────────────────────────────────────────────────────────
  // ZERO-SUM PENNY CONSERVATION (Largest Remainder Method)
  // ─────────────────────────────────────────────────────────────

  /**
   * Converts floating-point shares into exact 2-decimal currency amounts
   * using the Largest Remainder Method (Hare-Niemeyer Algorithm).
   *
   * Guarantees:
   *   sum(result.values) === totalAmount (exactly in cents)
   */
  private static _distributeCents(
    totalAmount: number,
    rawShares: Record<string, number>
  ): Record<string, number> {
    const keys = Object.keys(rawShares);
    if (keys.length === 0) return {};

    const totalCents = Math.round(totalAmount * 100);

    // 1. Calculate floor cents and remainder for each member
    const floorCents: Record<string, number> = {};
    const remainders: Record<string, number> = {};
    let allocatedCents = 0;

    for (const key of keys) {
      const exactCents = (rawShares[key] ?? 0) * 100;
      const f = Math.floor(exactCents);
      floorCents[key] = f;
      remainders[key] = exactCents - f;
      allocatedCents += f;
    }

    // 2. Determine unallocated cents (due to rounding)
    let surplusCents = totalCents - allocatedCents;

    // 3. Sort by largest fractional remainder descending
    const sortedKeys = [...keys].sort(
      (a, b) => (remainders[b] ?? 0) - (remainders[a] ?? 0)
    );

    // 4. Distribute surplus cents one by one to members with largest fractional parts
    let idx = 0;
    while (surplusCents > 0 && sortedKeys.length > 0) {
      const key = sortedKeys[idx % sortedKeys.length];
      floorCents[key] = (floorCents[key] ?? 0) + 1;
      surplusCents--;
      idx++;
    }

    // If total allocated exceeded total due to negative remainders, subtract from smallest
    while (surplusCents < 0 && sortedKeys.length > 0) {
      const key = sortedKeys[sortedKeys.length - 1 - (idx % sortedKeys.length)];
      if ((floorCents[key] ?? 0) > 0) {
        floorCents[key] = (floorCents[key] ?? 0) - 1;
        surplusCents++;
      }
      idx++;
    }

    // 5. Convert back to float currency values with 2 decimal places
    const result: Record<string, number> = {};
    for (const key of keys) {
      result[key] = (floorCents[key] ?? 0) / 100;
    }

    return result;
  }
}
