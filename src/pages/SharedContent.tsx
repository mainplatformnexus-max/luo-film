import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Play, CreditCard, Timer, Lock, AlertCircle, Download, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSharedLinkByCode } from "@/lib/firebaseServices";
import type { SharedLink } from "@/lib/firebaseServices";
import ArtPlayerComponent from "@/components/ArtPlayerComponent";
import { createCheckout, savePendingPayment } from "@/lib/livraPayment";

type PaymentStep = "info" | "payment" | "redirecting" | "watching";

const SharedContent = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>("info");
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [content, setContent] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user already has access from a successful payment callback
  useEffect(() => {
    if (!shareCode) { setLoading(false); return; }
    const accessTimestamp = sessionStorage.getItem(`access_${shareCode}`);
    if (accessTimestamp) {
      const elapsed = (Date.now() - parseInt(accessTimestamp)) / 1000;
      if (elapsed < 600) {
        getSharedLinkByCode(shareCode).then(data => {
          setContent(data);
          setStep("watching");
          setTimeLeft(600 - Math.floor(elapsed));
          setIsTimerRunning(true);
          setLoading(false);
        }).catch(() => setLoading(false));
        return;
      } else {
        sessionStorage.removeItem(`access_${shareCode}`);
      }
    }
    getSharedLinkByCode(shareCode).then(data => {
      setContent(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shareCode]);

  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isTimerRunning) {
        setIsTimerRunning(false);
        setStep("info");
        if (shareCode) sessionStorage.removeItem(`access_${shareCode}`);
        toast({ title: "Access expired", description: "Your 10-minute access has ended.", variant: "destructive" });
      }
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePay = async () => {
    if (!content || !shareCode) return;
    setStep("redirecting");

    try {
      const result = await createCheckout(content.price, email || "customer@luofilm.site", {
        type: "agent-share",
        shareCode,
      });

      if (!result.success || !result.data?.redirectUrl) {
        throw new Error(result.message || "Failed to create checkout");
      }

      savePendingPayment({
        reference: result.data.reference,
        type: "agent-share",
        amount: content.price,
        shareCode,
        timestamp: Date.now(),
      });

      window.location.href = result.data.redirectUrl;
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
      setStep("payment");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!content) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-foreground text-lg font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground text-sm">This share link is invalid or has expired.</p>
      </div>
    </div>
  );

  if (step === "watching") return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <span className="text-primary text-xs font-semibold">Time Remaining</span>
        </div>
        <span className={`text-sm font-bold ${timeLeft < 120 ? "text-destructive" : "text-primary"}`}>{formatTime(timeLeft)}</span>
      </div>
      <div className="aspect-video bg-muted relative max-w-4xl mx-auto">
        {content.streamLink ? (
          <ArtPlayerComponent src={content.streamLink} poster={content.posterUrl} autoplay />
        ) : (
          <>
            <img src={content.posterUrl || "/placeholder.svg"} alt={content.contentTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-8 h-8 ml-1" />
              </button>
            </div>
          </>
        )}
        {timeLeft < 120 && <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">Expiring soon!</div>}
      </div>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-foreground text-lg font-bold">{content.contentTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{content.contentType}</p>
        {content.streamLink && (
          <a href={content.streamLink} download target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[11px] font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        )}
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-1000 ${timeLeft < 120 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${(timeLeft / 600) * 100}%` }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <div className="aspect-video bg-muted relative">
            <img src={content.posterUrl || "/placeholder.svg"} alt={content.contentTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Lock className="w-10 h-10 text-muted-foreground" /></div>
            <div className="absolute top-2 right-2 bg-secondary/90 text-foreground text-[10px] px-2 py-0.5 rounded">{content.contentType}</div>
          </div>
          <div className="p-4">
            <h1 className="text-foreground text-base font-bold">{content.contentTitle}</h1>
            <p className="text-muted-foreground text-xs mt-1">{content.contentType}</p>
            <p className="text-muted-foreground text-[10px] mt-2">Shared by Agent</p>
          </div>
        </div>

        {step === "info" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Pay to watch</p>
              <p className="text-accent text-3xl font-bold mt-1">UGX {content.price.toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Timer className="w-3 h-3 text-muted-foreground" />
                <p className="text-muted-foreground text-[10px]">10 minutes access after payment</p>
              </div>
            </div>
            <Button className="w-full text-xs h-10 gap-1" onClick={() => setStep("payment")}>
              <CreditCard className="w-4 h-4" /> Pay Now
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
              <p className="text-accent text-2xl font-bold">UGX {content.price.toLocaleString()}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Email (optional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <Button className="w-full text-xs h-10 gap-1" onClick={handlePay}>
              <ExternalLink className="w-4 h-4" /> Pay UGX {content.price.toLocaleString()}
            </Button>
            <button onClick={() => setStep("info")} className="w-full text-muted-foreground text-[10px] text-center mt-1 hover:text-foreground">← Go back</button>
          </div>
        )}

        {step === "redirecting" && (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-foreground text-sm font-semibold">Redirecting to payment...</p>
            <p className="text-muted-foreground text-xs">You'll be taken to a secure checkout page</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedContent;
