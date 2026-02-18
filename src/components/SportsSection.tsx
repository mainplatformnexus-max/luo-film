import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllMatches, type SportMatch } from "@/data/sportsData";

const MatchCard = ({ match, onClick }: { match: SportMatch; onClick: () => void }) => {
  const isLive = match.status === "live";
  const isEnded = match.status === "ended";

  return (
    <div onClick={onClick} className="bg-card rounded-lg overflow-hidden border border-border hover:border-muted-foreground/30 transition-colors cursor-pointer min-w-[160px] w-[160px] shrink-0">
      {/* Status bar */}
      <div className="px-3 py-1.5">
        {isLive ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-[10px] font-bold uppercase">Live</span>
          </div>
        ) : isEnded ? (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[10px] font-bold">FT</span>
            {match.matchResult && <span className="text-muted-foreground text-[10px] truncate max-w-[100px]">· {match.matchResult}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-accent text-[10px] font-bold">Upcoming</span>
            <span className="text-muted-foreground text-[10px]">· {match.countdown}</span>
          </div>
        )}
      </div>

      {/* League */}
      <div className="px-3 pb-1">
        <p className="text-muted-foreground text-[8px] truncate">{match.league}</p>
      </div>

      {/* Match content */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {match.homeAvatar ? (
              <img src={match.homeAvatar} alt={match.homeTeam} className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground bg-secondary border border-border">
                {match.homeTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Score or VS */}
          <div className="flex items-center gap-1.5 px-2">
            {isLive || isEnded ? (
              <>
                <span className="text-foreground text-lg font-bold">{match.homeScore}</span>
                <span className="text-muted-foreground text-xs">-</span>
                <span className="text-foreground text-lg font-bold">{match.awayScore}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs font-medium">VS</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {match.awayAvatar ? (
              <img src={match.awayAvatar} alt={match.awayTeam} className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground bg-secondary border border-border">
                {match.awayTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams label */}
      <div className="px-3 pb-2.5">
        <p className="text-foreground text-[10px] text-center truncate">
          {match.homeTeam} VS {match.awayTeam}
        </p>
      </div>
    </div>
  );
};

type FilterTab = "all" | "live" | "upcoming" | "ended";

const SportsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await fetchAllMatches();
      if (!cancelled) {
        setMatches(data);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
    }
  };

  const handleMatchClick = (match: SportMatch) => {
    navigate(`/watch/sport-${match.id}`, {
      state: {
        matchId: match.id,
        playPath: match.playPath,
        playSource: match.playSource,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        highlights: match.highlights,
      },
    });
  };

  const filtered = filter === "all" ? matches : matches.filter((m) => m.status === filter);

  const liveCount = matches.filter((m) => m.status === "live").length;
  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
  const endedCount = matches.filter((m) => m.status === "ended").length;

  const tabs: { key: FilterTab; label: string; count: number; color: string }[] = [
    { key: "all", label: "All", count: matches.length, color: "text-foreground" },
    { key: "live", label: "🔴 Live", count: liveCount, color: "text-primary" },
    { key: "upcoming", label: "⏳ Upcoming", count: upcomingCount, color: "text-accent" },
    { key: "ended", label: "✅ FT", count: endedCount, color: "text-muted-foreground" },
  ];

  return (
    <section className="px-4 md:px-10 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm md:text-base font-bold text-foreground">⚽ Sports</h2>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll("left")} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] ${filter === tab.key ? "text-primary-foreground/70" : "opacity-60"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex gap-2.5 overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card rounded-lg border border-border min-w-[160px] w-[160px] h-[140px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {filter === "all" ? "" : filter} matches available right now.</p>
      ) : (
        <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none" }}>
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match)} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SportsSection;
