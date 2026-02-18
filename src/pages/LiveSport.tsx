import { useNavigate } from "react-router-dom";
import SportsSection from "@/components/SportsSection";

const LiveSport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-foreground text-xl font-bold mb-1">Live Sport</h1>
        <p className="text-muted-foreground text-xs mb-4">
          Watch live matches and highlights —{" "}
          <button onClick={() => navigate("/watch/sport-live")} className="text-primary hover:underline">
            Open Live Player
          </button>
        </p>
      </div>
      <SportsSection />
    </div>
  );
};

export default LiveSport;
