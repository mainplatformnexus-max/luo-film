import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, X, Loader2 } from "lucide-react";
import { getPendingPayment, clearPendingPayment } from "@/lib/livraPayment";
import { addTransaction, updateUser, getUsers, addAgent, generateAgentId, updateAgent, getAgentByAgentId, updateSharedLink, getSharedLinkByCode } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [agentId, setAgentId] = useState("");

  const status = searchParams.get("status");

  useEffect(() => {
    const handleCallback = async () => {
      const pending = getPendingPayment();
      if (!pending) {
        setProcessing(false);
        setMessage("No pending payment found.");
        return;
      }

      if (status !== "success") {
        clearPendingPayment();
        setProcessing(false);
        setSuccess(false);
        setMessage("Payment was not completed. Please try again.");
        return;
      }

      try {
        const now = new Date();

        // Record transaction
        await addTransaction({
          userId: user?.uid || "",
          userName: pending.agentName || user?.displayName || pending.phoneNumber || "",
          userPhone: pending.agentPhone || pending.phoneNumber || "",
          type: pending.type === "agent-share" ? "agent-share" : "subscription",
          amount: pending.amount,
          status: "completed",
          method: "Fincra Checkout",
          createdAt: now.toISOString().split("T")[0],
        } as any);

        if (pending.type === "subscription" && pending.planDays) {
          // Activate user subscription
          const expiry = new Date(now);
          expiry.setDate(expiry.getDate() + pending.planDays);
          const users = await getUsers();
          const userRecord = users.find(u => u.email === (pending.userEmail || user?.email));
          if (userRecord) {
            await updateUser(userRecord.id, {
              subscription: pending.planLabel || "Active",
              subscriptionExpiry: expiry.toISOString().split("T")[0],
            });
          }
          setMessage("Your subscription is now active! Enjoy unlimited streaming.");
        } else if (pending.type === "agent-subscription" && pending.planDays) {
          // Create agent account
          const expiry = new Date(now);
          expiry.setDate(expiry.getDate() + pending.planDays);
          const newAgentId = generateAgentId();
          await addAgent({
            name: pending.agentName || pending.phoneNumber || "",
            phone: pending.agentPhone || pending.phoneNumber || "",
            agentId: newAgentId,
            balance: 0,
            sharedMovies: 0,
            sharedSeries: 0,
            totalEarnings: 0,
            status: "active",
            plan: pending.planLabel || "Weekly",
            planExpiry: expiry.toISOString().split("T")[0],
            createdAt: now.toISOString().split("T")[0],
          } as any);
          setAgentId(newAgentId);
          setMessage(`Agent account created! Your Agent ID: ${newAgentId}`);
        } else if (pending.type === "agent-renewal" && pending.renewPlan) {
          // Renew agent plan
          const expiry = new Date(now);
          if (pending.renewPlan === "month") expiry.setMonth(expiry.getMonth() + 1);
          else expiry.setDate(expiry.getDate() + 7);
          
          const agent = await getAgentByAgentId(pending.agentPhone || "");
          if (agent) {
            await updateAgent(agent.id, {
              status: "active",
              planExpiry: expiry.toISOString().split("T")[0],
              plan: pending.renewPlan === "month" ? "Monthly" : "Weekly",
            });
          }
          setMessage("Agent subscription renewed successfully!");
        } else if (pending.type === "agent-share" && pending.shareCode) {
          // Credit agent for shared content
          const content = await getSharedLinkByCode(pending.shareCode);
          if (content) {
            await updateSharedLink(content.id, {
              views: (content.views || 0) + 1,
              earnings: (content.earnings || 0) + pending.amount,
            });
            try {
              const agent = await getAgentByAgentId(content.agentId);
              if (agent) {
                await updateAgent(agent.id, {
                  balance: (agent.balance || 0) + pending.amount,
                  totalEarnings: (agent.totalEarnings || 0) + pending.amount,
                });
              }
            } catch (e) { console.error("Failed to credit agent:", e); }
          }
          // Store access grant in sessionStorage
          sessionStorage.setItem(`access_${pending.shareCode}`, Date.now().toString());
          setMessage("Payment successful! Redirecting to content...");
          setTimeout(() => navigate(`/shared/${pending.shareCode}`, { replace: true }), 2000);
        }

        setSuccess(true);
      } catch (err: any) {
        console.error("Callback processing error:", err);
        setMessage("Payment received but activation failed. Please contact support.");
        setSuccess(false);
      }

      clearPendingPayment();
      setProcessing(false);
    };

    handleCallback();
  }, [status]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        {processing ? (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <p className="text-foreground font-bold">Processing your payment...</p>
            <p className="text-muted-foreground text-xs">Please wait</p>
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <p className="text-foreground font-bold">Payment Successful!</p>
            <p className="text-muted-foreground text-xs">{message}</p>
            {agentId && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <p className="text-muted-foreground text-[10px]">Your Agent ID</p>
                <p className="text-primary font-bold text-lg">{agentId}</p>
                <p className="text-muted-foreground text-[10px] mt-1">Save this — use it to log in</p>
              </div>
            )}
            <button onClick={() => navigate("/", { replace: true })} className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
              {agentId ? "Go to Agent Dashboard" : "Continue Watching"}
            </button>
          </>
        ) : (
          <>
            <X className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-foreground font-bold">Payment Failed</p>
            <p className="text-muted-foreground text-xs">{message}</p>
            <button onClick={() => navigate("/", { replace: true })} className="w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
