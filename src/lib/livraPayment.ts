// Payment API Integration
// Fincra Checkout for deposits, Livra for withdrawals
const PAYMENT_BASE = "https://payment.livrauganda.workers.dev";
const LIVRA_BASE = "https://api.livrauganda.workers.dev/api";

// ---- Fincra Checkout (Deposits/Payments) ----

export interface CheckoutResponse {
  success: boolean;
  data?: {
    redirectUrl: string;
    reference: string;
    amount: number;
    currency: string;
  };
  message?: string;
}

export interface PendingPayment {
  reference: string;
  type: "subscription" | "agent-subscription" | "agent-renewal" | "agent-share";
  amount: number;
  planId?: string;
  planLabel?: string;
  planDays?: number;
  agentName?: string;
  agentPhone?: string;
  renewPlan?: string;
  contentId?: string;
  shareCode?: string;
  userEmail?: string;
  phoneNumber?: string;
  timestamp: number;
}

// Initiate a checkout redirect for payment
export const createCheckout = async (
  amount: number,
  email: string,
  metadata: Record<string, string> = {}
): Promise<CheckoutResponse> => {
  const origin = window.location.origin;
  const res = await fetch(`${PAYMENT_BASE}/checkout/redirect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      currency: "UGX",
      email: email || "customer@luofilm.site",
      successUrl: `${origin}/payment/callback?status=success`,
      failureUrl: `${origin}/payment/callback?status=failed`,
      metadata,
      paymentMethods: ["mobile_money", "card"],
    }),
  });
  return res.json();
};

// Save pending payment to localStorage before redirect
export const savePendingPayment = (payment: PendingPayment) => {
  localStorage.setItem("pending_payment", JSON.stringify(payment));
};

// Get and clear pending payment after redirect
export const getPendingPayment = (): PendingPayment | null => {
  const raw = localStorage.getItem("pending_payment");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearPendingPayment = () => {
  localStorage.removeItem("pending_payment");
};

// ---- Livra Withdraw (Send money to user) ----

export interface LivraWithdrawResponse {
  success: boolean;
  message?: string;
  internal_reference?: string;
  [key: string]: any;
}

export const livraWithdraw = async (
  phone: string,
  amount: number,
  description: string
): Promise<LivraWithdrawResponse> => {
  let cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) cleaned = "+256" + cleaned.slice(1);
  else if (cleaned.startsWith("256")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+256")) cleaned = "+256" + cleaned;

  const res = await fetch(`${LIVRA_BASE}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msisdn: cleaned, amount, description }),
  });
  return res.json();
};
