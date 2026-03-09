import { useState } from "react";
import { X, Crown, Phone, Smartphone, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckout, savePendingPayment } from "@/lib/livraPayment";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  mode?: "user" | "agent";
}

const userPlans = [
  { id: "1day", label: "1 Day", price: "5,000", priceNum: 5000, duration: "24 hours access", days: 1 },
  { id: "1week", label: "1 Week", price: "10,000", priceNum: 10000, duration: "7 days access", days: 7 },
  { id: "1month", label: "1 Month", price: "25,000", priceNum: 25000, duration: "30 days access", days: 30 },
];

const agentPlans = [
  { id: "agent-1week", label: "1 Week", price: "25,000", priceNum: 25000, duration: "7 days Agent access", days: 7 },
  { id: "agent-1month", label: "1 Month", price: "50,000", priceNum: 50000, duration: "30 days Agent access", days: 30 },
];

const SubscribeModal = ({ open, onClose, mode = "user" }: SubscribeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"plan" | "pay" | "redirecting">("plan");
  const { toast } = useToast();
  const { user, setShowLogin } = useAuth();

  if (!open) return null;

  if (!user && mode === "user") {
    onClose();
    setShowLogin(true);
    toast({ title: "Login Required", description: "Please log in to subscribe." });
    return null;
  }

  const plans = mode === "agent" ? agentPlans : userPlans;
  const title = mode === "agent" ? "Agent 1X Plan" : "Subscribe";
  const subtitle = mode === "agent"
    ? "Get your Agent ID and unlock earnings"
    : "Choose a plan and enjoy unlimited content";

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const planInfo = plans.find(p => p.id === selectedPlan);
    if (!planInfo) return;

    setStep("redirecting");

    try {
      const userEmail = email || user?.email || "customer@luofilm.site";
      const result = await createCheckout(planInfo.priceNum, userEmail, {
        type: mode === "agent" ? "agent-subscription" : "subscription",
        planId: planInfo.id,
      });

      if (!result.success || !result.data?.redirectUrl) {
        throw new Error(result.message || "Failed to create checkout");
      }

      // Save pending payment info
      savePendingPayment({
        reference: result.data.reference,
        type: mode === "agent" ? "agent-subscription" : "subscription",
        amount: planInfo.priceNum,
        planId: planInfo.id,
        planLabel: planInfo.label,
        planDays: planInfo.days,
        agentName: name || undefined,
        agentPhone: phoneNumber || undefined,
        userEmail,
        phoneNumber,
        timestamp: Date.now(),
      });

      // Redirect to payment page
      window.location.href = result.data.redirectUrl;
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
      setStep("pay");
    }
  };

  const handleClose = () => {
    setStep("plan");
    setSelectedPlan(null);
    setPhoneNumber("");
    setEmail("");
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <h2 className="text-foreground font-bold text-lg">{title}</h2>
          <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
        </div>

        {step === "plan" && (
          <div className="px-6 pb-6 space-y-3">
            {plans.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === plan.id ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-muted-foreground/30"
                }`}>
                <div className="text-left">
                  <p className="text-foreground text-sm font-semibold">{plan.label}</p>
                  <p className="text-muted-foreground text-[11px]">{plan.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary text-sm font-bold">UGX {plan.price}</p>
                </div>
              </button>
            ))}
            <button disabled={!selectedPlan} onClick={() => setStep("pay")}
              className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2">
              Continue to Pay
            </button>
          </div>
        )}

        {step === "pay" && (
          <form onSubmit={handlePay} className="px-6 pb-6 space-y-4">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-muted-foreground text-[11px]">Pay securely</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <Smartphone className="w-5 h-5 text-accent" />
                <span className="text-foreground font-bold text-lg">
                  UGX {plans.find((p) => p.id === selectedPlan)?.price}
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] mt-2">Mobile Money, Card, or Bank Transfer</p>
            </div>
            {mode === "agent" && (
              <>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" placeholder="Phone Number (07...)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </>
            )}
            <input type="email" placeholder="Email address" value={email || user?.email || ""} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <p className="text-muted-foreground text-[10px] text-center">
              You'll be redirected to a secure payment page to complete payment.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("plan")} className="flex-1 h-10 bg-secondary text-foreground font-medium text-sm rounded-lg hover:bg-muted transition-colors">
                Back
              </button>
              <button type="submit" className="flex-1 h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Pay Now
              </button>
            </div>
          </form>
        )}

        {step === "redirecting" && (
          <div className="px-6 pb-6 text-center space-y-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-foreground font-bold text-base">Redirecting to payment...</p>
              <p className="text-muted-foreground text-xs mt-1">You'll be taken to a secure checkout page</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
