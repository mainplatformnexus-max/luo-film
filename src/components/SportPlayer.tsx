import { useEffect, useRef } from "react";
import Artplayer from "artplayer";
import Hls from "hls.js";

interface SportPlayerProps {
  src: string;
  poster?: string;
}

function playM3u8(video: HTMLMediaElement, url: string, art: Artplayer) {
  if (Hls.isSupported()) {
    if ((art as any).hls) (art as any).hls.destroy();
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    (art as any).hls = hls;
    art.on("destroy", () => hls.destroy());
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
  }
}

const SportPlayer = ({ src, poster }: SportPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    const isHls = src.includes(".m3u8");
    const isLiveStream = isHls;

    const art = new Artplayer({
      container: containerRef.current,
      url: src,
      poster: poster || "",
      volume: 0.8,
      isLive: isLiveStream,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: true,
      loop: false,
      flip: false,
      playbackRate: false,
      aspectRatio: false,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: false,
      miniProgressBar: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: false,
      airplay: true,
      theme: "hsl(var(--primary))",
      customType: isHls
        ? {
            m3u8: playM3u8,
          }
        : undefined,
      type: isHls ? "m3u8" : undefined,
    });

    artRef.current = art;

    return () => {
      if (artRef.current) {
        artRef.current.destroy(false);
        artRef.current = null;
      }
    };
  }, [src, poster]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ aspectRatio: "16/9" }}
    />
  );
};

export default SportPlayer;
