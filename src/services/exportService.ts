import { Expense } from "@/types/expense";
import { GroupMember } from "@/types/group";

export const exportService = {
  /**
   * Generates and downloads a CSV export of all group expenses.
   */
  exportToCsv(expenses: Expense[], members: GroupMember[], groupName: string) {
    const memberMap = new Map<string, string>();
    members.forEach(m => memberMap.set(m.id, m.displayName || m.name || "Member"));

    const rows: string[][] = [
      [
        "Date",
        "Description",
        "Category",
        "Paid By",
        "Amount",
        "Currency",
        "Original Amount",
        "Original Currency",
        "Recurring",
        "Split Mode",
      ]
    ];

    expenses.forEach(e => {
      const payerName = memberMap.get(e.payerId) || "Unknown";
      const dateStr = e.createdAt?.toDate 
        ? e.createdAt.toDate().toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0];

      rows.push([
        `"${dateStr}"`,
        `"${(e.description || "").replace(/"/g, '""')}"`,
        `"${(e.category || "General").replace(/"/g, '""')}"`,
        `"${payerName.replace(/"/g, '""')}"`,
        (e.amount || 0).toFixed(2),
        `"${e.currency || "INR"}"`,
        e.originalAmount ? e.originalAmount.toFixed(2) : "",
        e.originalCurrency ? `"${e.originalCurrency}"` : "",
        e.isRecurring ? `Yes (${e.recurringInterval || "monthly"})` : "No",
        `"${e.splitMode || "equal"}"`,
      ]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `splinzo_${groupName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_expenses_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Generates a printable, branded executive PDF expense report.
   */
  exportToPdf(expenses: Expense[], members: GroupMember[], groupName: string, currency: string) {
    const memberMap = new Map<string, string>();
    members.forEach(m => memberMap.set(m.id, m.displayName || m.name || "Member"));

    const totalSpend = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const currSymbol = currency === "INR" ? "₹" : currency;
    const formattedDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Calculate category breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || "General";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to generate and print your PDF report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Splinzo Expense Report - ${groupName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            body { padding: 40px; color: #1e293b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #f1f5f9; }
            .logo { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .logo span { color: #f59e0b; }
            .report-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
            .meta { text-align: right; font-size: 12px; color: #64748b; line-height: 1.6; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 30px 0; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; }
            .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .stat-val { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { text-align: left; padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
            td { padding: 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .amount-col { text-align: right; font-weight: 700; color: #0f172a; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">SPLINZO<span>.</span></div>
              <div class="report-title">Group Expense Report: ${groupName}</div>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${formattedDate}</div>
              <div><strong>Total Records:</strong> ${expenses.length}</div>
              <div><strong>Ledger Currency:</strong> ${currency}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Group Spend</div>
              <div class="stat-val">${currSymbol}${totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Expenses Logged</div>
              <div class="stat-val">${expenses.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Active Members</div>
              <div class="stat-val">${members.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Split Mode</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(e => {
                const payer = memberMap.get(e.payerId) || "Member";
                const date = e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—";
                return `
                  <tr>
                    <td>${date}</td>
                    <td><strong>${e.description}</strong></td>
                    <td><span class="badge">${e.category || "General"}</span></td>
                    <td>${payer}</td>
                    <td><span class="badge">${e.splitMode || "equal"}</span></td>
                    <td class="amount-col">${currSymbol}${(e.amount || 0).toFixed(2)}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>

          <div class="footer">
            Report generated securely via Splinzo. Splinzo empowers zero-friction shared finances and smart settlements.
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
