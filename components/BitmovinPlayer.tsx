"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    bitmovin: any;
  }
}

export default function BitmovinPlayer() {
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!playerContainerRef.current || typeof window === "undefined") return;

    const conf = {
      key: "<YOUR_PLAYER_KEY>", // Replace with your Bitmovin API key
    };

    const source = {
    
      progressive: [
        {
          url: `${window.location.origin}/video.mp4`,
          type: "video/mp4",
        },
      ],
      poster:
        `${window.location.origin}/1.png`,
      thumbnailTrack: {
        url: `${window.location.origin}/subtitles.vtt`,
      },
    //   subtitles: [
    //     {
    //       url: `${window.location.origin}/subtitles.vtt`, // Local VTT file
    //       id: "english",
    //       label: "English",
    //       lang: "en",
    //     },
    // ]
    };

    // Ensure Bitmovin Player is available
    if (window.bitmovin && window.bitmovin.player) {
      const player = new window.bitmovin.player.Player(playerContainerRef.current, conf);
      player.load(source);
    }

    return () => {
      // Clean up player instance on component unmount
      if (window.bitmovin && window.bitmovin.player) {
        window.bitmovin.player.destroy();
      }
    };
  }, []);

  return <div ref={playerContainerRef} style={{ width: "800px", height: "450px" }} />;
}
