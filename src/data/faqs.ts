export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "Is Splinzo free to use?",
    a: "Yes! Splinzo is completely free for all core features — creating groups, splitting expenses, and settling up. We may offer premium features in the future.",
  },
  {
    q: "Which platforms is Splinzo available on?",
    a: "Splinzo is available on Android (Google Play Store) and on the web. iOS support is coming soon!",
  },
  {
    q: "How does the smart split algorithm work?",
    a: "Our algorithm computes the optimal set of transactions to settle all debts in a group with the fewest possible payments — similar to debt consolidation.",
  },
  {
    q: "Is my financial data safe?",
    a: "Absolutely. We use Firebase with industry-standard encryption. We never store payment credentials and never sell your data.",
  },
  {
    q: "Can I use Splinzo for personal expense tracking?",
    a: "Yes! You can create a solo group or use it alongside friends. It's flexible enough for personal budgets too.",
  },
];
