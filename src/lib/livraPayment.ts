// Livra Payment API Integration
const LIVRA_BASE = "https://api.livrauganda.workers.dev/api";

// Format phone number to +256 format
const formatPhone = (phone: string): string => {
  let cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) cleaned = "+256" + cleaned.slice(1);
  else if (cleaned.startsWith("256")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+256")) cleaned = "+256" + cleaned;
  return cleaned;
};

export interface LivraDepositResponse {
  success: boolean;
  internal_reference?: string;
  message?: string;
  [key: string]: any;
}

export interface LivraStatusResponse {
  success: boolean;
  status: string;
  request_status: string;
  message?: string;
  amount?: number;
  provider?: string;
  provider_transaction_id?: string;
  completed_at?: string;
  [key: string]: any;
}

export interface LivraWithdrawResponse {
  success: boolean;
  message?: string;
  internal_reference?: string;
  [key: string]: any;
}

// Initiate a deposit (request payment from user)
export const livraDeposit = async (
  phone: string,
  amount: number,
  description: string
): Promise<LivraDepositResponse> => {
  const res = await fetch(`${LIVRA_BASE}/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msisdn: formatPhone(phone),
      amount,
      description,
    }),
  });
  return res.json();
};

// Initiate a withdrawal (send money to user)
export const livraWithdraw = async (
  phone: string,
  amount: number,
  description: string
): Promise<LivraWithdrawResponse> => {
  const res = await fetch(`${LIVRA_BASE}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msisdn: formatPhone(phone),
      amount,
      description,
    }),
  });
  return res.json();
};

// Check payment status
export const livraCheckStatus = async (
  internalReference: string
): Promise<LivraStatusResponse> => {
  const res = await fetch(
    `${LIVRA_BASE}/request-status?internal_reference=${internalReference}`
  );
  return res.json();
};

// Poll payment status until success/failure
export const pollPaymentStatus = (
  internalReference: string,
  onStatusUpdate?: (status: string, data: LivraStatusResponse) => void
): Promise<LivraStatusResponse> => {
  const MAX_RETRIES = 40; // ~4 minutes
  const INTERVAL = 6000; // 6 seconds
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      attempts++;
      try {
        const data = await livraCheckStatus(internalReference);
        console.log(`Payment poll #${attempts}:`, data);

        onStatusUpdate?.(data.request_status || data.status, data);

        if (data.request_status === "success") {
          clearInterval(intervalId);
          resolve(data);
        } else if (
          data.request_status === "failed" ||
          data.status === "failed" ||
          data.request_status === "expired"
        ) {
          clearInterval(intervalId);
          reject(new Error(data.message || "Payment failed"));
        } else if (attempts >= MAX_RETRIES) {
          clearInterval(intervalId);
          reject(new Error("Payment timed out. Please try again."));
        }
        // Otherwise keep polling (pending state)
      } catch (error) {
        console.error("Poll error:", error);
        if (attempts >= MAX_RETRIES) {
          clearInterval(intervalId);
          reject(error);
        }
      }
    }, INTERVAL);
  });
};
