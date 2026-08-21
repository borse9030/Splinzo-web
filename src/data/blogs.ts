export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  content: string; // React-rendered HTML/Markdown style
}

export const blogs: BlogPost[] = [
  {
    slug: "ultimate-guide-splitting-rent-roommates",
    title: "The Ultimate Guide to Splitting Rent with Roommates",
    summary: "Living with roommates is great, but figuring out who pays what can be a nightmare. Learn how to track shared household expenses, utility bills, and rent effortlessly.",
    author: "Splinzo Team",
    date: "August 20, 2026",
    readTime: "5 min read",
    category: "Roommates",
    content: `
      <h2>The Challenge of Shared Expenses</h2>
      <p>Moving in with friends or new roommates is an exciting milestone, but one of the most common causes of friction is managing shared finances. From the initial security deposit to monthly utility bills and spontaneous grocery runs, keeping a mental tally simply doesn't work.</p>
      
      <h2>Step 1: Set Clear Expectations Early</h2>
      <p>Before the first bill arrives, have an open conversation about how expenses will be handled. Will you split everything equally? Will you divide groceries or buy your own? Having this conversation upfront prevents resentment later.</p>
      
      <h2>Step 2: Log Everything Immediately</h2>
      <p>The golden rule of expense sharing is to log the expense the moment it happens. Whether it's picking up toilet paper on the way home or paying the internet bill, record it immediately. Using an app like Splinzo allows you to quickly log who paid and how the cost should be divided.</p>
      
      <h2>Step 3: The Power of Smart Splitting</h2>
      <p>Instead of sending dozens of small Venmo or UPI requests back and forth every week, Splinzo's Smart Split algorithm consolidates your group's debts. If you owe John $20, John owes Sarah $20, and Sarah owes you $20, Splinzo mathematically cancels these out so nobody has to send a single transaction!</p>
      
      <h2>Settle Up Regularly</h2>
      <p>Decide on a "settle up day"—usually the 1st or the 15th of the month. When that day arrives, everyone pays their final consolidated balances. No drama, no spreadsheets, just financial peace of mind.</p>
    `
  },
  {
    slug: "manage-group-trip-budgets",
    title: "How to Manage Group Trip Budgets Without Losing Friends",
    summary: "Group vacations are notorious for causing financial stress. Discover the best strategies to split costs for flights, Airbnbs, and dinners on your next trip.",
    author: "Splinzo Team",
    date: "August 15, 2026",
    readTime: "6 min read",
    category: "Travel",
    content: `
      <h2>The Group Trip Dilemma</h2>
      <p>You've finally aligned schedules, booked the Airbnb, and made it to your destination. But then comes the awkward part: someone pays for the rental car, another pays for dinner, and someone else buys the concert tickets. How do you keep track without ruining the vacation vibe?</p>
      
      <h2>Avoid the Shared Spreadsheet</h2>
      <p>While a shared Google Sheet might seem like a good idea, it rarely survives contact with reality. People forget to log items, formulas get broken, and calculating who owes who at the end requires a degree in accounting.</p>
      
      <h2>Use a Dedicated Travel Ledger</h2>
      <p>By creating a dedicated "Trip" group in Splinzo, anyone can add an expense at any time. Did someone buy a round of drinks that didn't include the designated driver? You can easily adjust the split so the driver doesn't pay for alcohol.</p>
      
      <h2>Keep Conversations Contextual</h2>
      <p>One of the biggest issues is losing track of *why* an expense was added. With Splinzo's built-in chat, you can discuss specific expenses right where they live. "Hey, did this include tip?" can be asked and answered instantly.</p>
      
      <h2>Settle Up at the Airport</h2>
      <p>The best time to settle up is while waiting at your terminal to go home. Everyone hits "Settle Up", sees exactly who to pay, clicks the UPI deep link, and the trip is officially financially closed before the plane even takes off!</p>
    `
  },
  {
    slug: "top-5-features-expense-sharing-app",
    title: "Top 5 Features Every Expense Sharing App Needs",
    summary: "Not all bill-splitting apps are created equal. Here are the absolute must-have features you should look for when choosing a financial tool for your group.",
    author: "Splinzo Team",
    date: "August 10, 2026",
    readTime: "4 min read",
    category: "Finance",
    content: `
      <h2>Why You Need a Dedicated App</h2>
      <p>If you're still relying on memory or text messages to track IOUs, you're inevitably losing money or damaging relationships. But with so many apps on the market, what actually matters?</p>
      
      <h2>1. Algorithmic Debt Simplification</h2>
      <p>This is the holy grail of expense sharing. An app must have an algorithm that reduces the total number of transactions required to settle up. Instead of a messy web of IOUs, it should calculate the most direct payment path.</p>
      
      <h2>2. Seamless Payment Integration</h2>
      <p>Tracking the debt is only half the battle; paying it is the other. Apps like Splinzo integrate directly with UPI (on Android and Web), allowing you to open your banking app with the amount and payee already filled in.</p>
      
      <h2>3. Flexible Splitting Options</h2>
      <p>Expenses aren't always split evenly. Sometimes you need to split by exact percentages, exact amounts, or by shares (e.g., a couple counts as 2 shares). Your app needs to handle all edge cases effortlessly.</p>
      
      <h2>4. Cloud Sync and Offline Support</h2>
      <p>If you're traveling internationally or in a remote area without cellular service, you still need to log that taxi ride. The app should cache the expense offline and automatically sync to the group ledger once you find Wi-Fi.</p>
      
      <h2>5. Uncompromising Privacy</h2>
      <p>Your financial data is highly sensitive. Ensure the app uses end-to-end encryption and has a strict policy against selling user data to third-party marketers.</p>
    `
  }
];
