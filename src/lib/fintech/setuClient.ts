/**
 * Setu UPI Deeplinks API Client for Splinzo
 * Handles API calls, token authorization, and sandbox simulations.
 */

export interface CreatePaymentLinkParams {
  billerBillID: string;
  amountInPaise: number; // e.g. ₹501 = 50100 paise
  description: string;
  receiverUpiId?: string;
  receiverName?: string;
}

export interface SetuPaymentLinkResponse {
  linkId: string;
  shortUrl: string;
  upiUrl: string;
  qrData?: string;
  isSimulated: boolean;
}

export interface SetuPaymentStatusResponse {
  status: "CREATED" | "UPCOMING" | "PAID" | "EXPIRED" | "FAILED";
  amountPaid?: number;
  utr?: string;
  paidAt?: string;
}

const SETU_ENV = process.env.SETU_ENV || "uat";
const SETU_BASE_URL = SETU_ENV === "production" 
  ? "https://prod.setu.co/api/v1" 
  : "https://uat.setu.co/api/v1";

export const setuClient = {
  isConfigured(): boolean {
    return Boolean(
      process.env.SETU_CLIENT_ID &&
      process.env.SETU_CLIENT_SECRET &&
      process.env.SETU_PRODUCT_INSTANCE_ID
    );
  },

  /**
   * Create a tracked UPI payment link via Setu API.
   * If credentials are not yet set, generates a safe simulated development session.
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<SetuPaymentLinkResponse> {
    const { billerBillID, amountInPaise, description, receiverUpiId, receiverName } = params;
    const amountInRupees = (amountInPaise / 100).toFixed(2);

    // If Setu credentials are not yet present in environment, return a functional simulation
    if (!this.isConfigured()) {
      const simulatedLinkId = `sim_setu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fallbackUpi = receiverUpiId 
        ? `upi://pay?pa=${receiverUpiId}&pn=${encodeURIComponent(receiverName || "Splinzo")}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(description)}`
        : `upi://pay?pn=Splinzo&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(description)}`;

      return {
        linkId: simulatedLinkId,
        shortUrl: `https://splinzo.in/pay/${simulatedLinkId}`,
        upiUrl: fallbackUpi,
        qrData: fallbackUpi,
        isSimulated: true,
      };
    }

    try {
      const response = await fetch(`${SETU_BASE_URL}/payment-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.SETU_CLIENT_ID!,
          "x-client-secret": process.env.SETU_CLIENT_SECRET!,
          "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID!,
        },
        body: JSON.stringify({
          amountValues: {
            value: amountInPaise,
            currencyCode: "INR",
          },
          billerBillID,
          amountRule: "EXACT",
          paymentLinkDescription: description.substring(0, 50),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Setu API Error: ${response.statusText}`);
      }

      const linkData = data.data;
      return {
        linkId: linkData.id,
        shortUrl: linkData.paymentLink?.shortUrl || "",
        upiUrl: linkData.paymentLink?.upiIntent?.upiUrl || linkData.paymentLink?.shortUrl || "",
        qrData: linkData.paymentLink?.upiIntent?.upiUrl,
        isSimulated: false,
      };
    } catch (err: any) {
      console.error("[setuClient.createPaymentLink] API failed, falling back to simulated session:", err.message);
      
      const simulatedLinkId = `sim_setu_${Date.now()}`;
      const fallbackUpi = receiverUpiId 
        ? `upi://pay?pa=${receiverUpiId}&pn=${encodeURIComponent(receiverName || "Splinzo")}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(description)}`
        : `upi://pay?pn=Splinzo&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(description)}`;

      return {
        linkId: simulatedLinkId,
        shortUrl: `https://splinzo.in/pay/${simulatedLinkId}`,
        upiUrl: fallbackUpi,
        qrData: fallbackUpi,
        isSimulated: true,
      };
    }
  },

  /**
   * Check status of a payment link from Setu
   */
  async checkPaymentStatus(linkId: string): Promise<SetuPaymentStatusResponse> {
    if (linkId.startsWith("sim_setu_")) {
      return {
        status: "UPCOMING",
      };
    }

    try {
      const response = await fetch(`${SETU_BASE_URL}/payment-links/${linkId}`, {
        method: "GET",
        headers: {
          "x-client-id": process.env.SETU_CLIENT_ID!,
          "x-client-secret": process.env.SETU_CLIENT_SECRET!,
          "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID!,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { status: "UPCOMING" };
      }

      const link = data.data;
      return {
        status: link.status === "PAID" ? "PAID" : "UPCOMING",
        amountPaid: link.amountPaid?.value ? link.amountPaid.value / 100 : undefined,
        utr: link.refID || link.transactionReference || undefined,
        paidAt: link.paidAt,
      };
    } catch (err) {
      console.error("[setuClient.checkPaymentStatus] Error:", err);
      return { status: "UPCOMING" };
    }
  },
};
