import { useLocation, useNavigate } from "react-router-dom";
import { Film, Tv, Radio, Trophy, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "./LoginModal";
import AgentAccessModal from "./AgentAccessModal";
import SubscribeModal from "./SubscribeModal";

const MobileNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setShowLogin } = useAuth();
  const [showAgentAccess, setShowAgentAccess] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { label: "Movies", path: "/movies", icon: Film },
    { label: "Series", path: "/series", icon: Tv },
    { label: "Agent", path: "#agent", icon: ShieldCheck, center: true },
    { label: "TV", path: "/tv-channel", icon: Radio },
    { label: "Sport", path: "/live-sport", icon: Trophy },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string) => {
    if (path === "#agent") {
      setShowAgentAccess(true);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
        {/* Profile avatar top-right floating */}
        <div className="absolute -top-12 right-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg border-2 border-background"
              >
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </button>
              {showProfile && (
                <div className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-lg shadow-xl p-3 min-w-[160px]">
                  <p className="text-foreground text-xs font-medium">{user.displayName || "User"}</p>
                  <p className="text-muted-foreground text-[10px] mb-2">{user.email}</p>
                  <button
                    onClick={() => { logout(); setShowProfile(false); }}
                    className="w-full text-left text-destructive text-xs px-2 py-1.5 rounded hover:bg-secondary transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground shadow-lg hover:text-foreground transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-end justify-around px-2 pt-1.5 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.center) {
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  className="flex flex-col items-center -mt-5"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background mb-0.5">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-[9px] font-semibold text-primary">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                <span className={`text-[9px] font-medium ${active ? "text-primary" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for content */}
      <div className="lg:hidden h-16" />

      <LoginModal open={useAuth().showLogin} onClose={() => useAuth().setShowLogin(false)} />
      <AgentAccessModal
        open={showAgentAccess}
        onClose={() => setShowAgentAccess(false)}
        onAccess={() => { setShowAgentAccess(false); navigate("/agent"); }}
        onSubscribe={() => { setShowAgentAccess(false); setShowSubscribe(true); }}
      />
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} mode="agent" />
    </>
  );
};

export default MobileNavBar;
