import { Play, Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { subscribeCarousels } from "@/lib/firebaseServices";
import type { CarouselItem } from "@/data/adminData";
import heroBanner from "@/assets/hero-banner.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Static fallback slide shown when no Firebase carousels are active
const fallbackSlide = {
  image: heroBanner,
  title: "Welcome to\nLUO FILM",
  badges: ["VIP", "Exclusive"],
  genre: "Drama",
  rating: "9.0",
  year: "2026",
  age: "13+",
  status: "Now Streaming",
  tags: ["Movies", "Series", "Live Sport"],
  desc: "Stream the best movies, series and live sports on LUO FILM – your ultimate entertainment platform.",
};

const HeroBanner = () => {
  const { user, setShowLogin } = useAuth();
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    return subscribeCarousels((items) => {
      setCarousels(items.filter(c => c.isActive));
    });
  }, []);

  const handlePlayClick = () => {
    if (!user) {
      setShowLogin(true);
      toast.info("Please login to start watching");
      return;
    }
    // Implement play logic or navigation if needed, currently it just prompts login
  };

  const slides = carousels.map(c => ({
        image: c.imageUrl || heroBanner,
        title: c.title,
        badges: [c.hotWord].filter(Boolean),
        genre: "",
        rating: "",
        year: "",
        age: "",
        status: c.subtitle,
        tags: [],
        desc: c.subtitle,
      }));

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-black">
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt={s.title}
          className={`absolute inset-0 w-full h-full object-fill transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
          onError={(e) => { (e.target as HTMLImageElement).src = heroBanner; }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      <div className="absolute bottom-4 left-4 md:left-10 max-w-sm z-10">
        <h1 className="text-xl md:text-2xl font-black italic text-foreground mb-1 leading-tight whitespace-pre-line">
          {slide.title}
        </h1>
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {slide.badges.map((b) => (
            <span key={b} className="bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded">{b}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-[9px] mb-1.5 flex-wrap">
          {slide.status && <span className="text-primary font-medium">{slide.status}</span>}
        </div>
        <p className="text-muted-foreground text-[9px] leading-relaxed mb-2.5 line-clamp-2">{slide.desc}</p>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePlayClick}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-semibold text-[10px] hover:opacity-90 transition-opacity"
          >
            <Play className="w-3 h-3 fill-current" /> Play
          </button>
          <button className="flex items-center justify-center w-7 h-7 rounded-full border border-muted-foreground/40 text-foreground hover:border-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 md:right-10 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-foreground" : "bg-muted-foreground/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
