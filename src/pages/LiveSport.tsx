import { useNavigate } from "react-router-dom";
import SportsSection from "@/components/SportsSection";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LiveSport = () => {
  const navigate = useNavigate();
  const { user, setShowLogin } = useAuth();

  const handleLivePlayerClick = () => {
    if (!user) {
      setShowLogin(true);
      toast.info("Please login to watch live sports");
      return;
    }
    navigate("/watch/sport-live");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-foreground text-xl font-bold mb-1">Live Sport</h1>
        <p className="text-muted-foreground text-xs mb-4">
          Watch live matches and highlights —{" "}
          <button onClick={handleLivePlayerClick} className="text-primary hover:underline">
            Open Live Player
          </button>
        </p>
      </div>
      <SportsSection />
    </div>
  );
};

export default LiveSport;
