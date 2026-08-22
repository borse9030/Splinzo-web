"use client";

import React, { useEffect, useRef } from "react";

export function VideoPlayer({ stream, isLocal = false }: { stream: MediaStream; isLocal?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: isLocal ? "scaleX(-1)" : "none",
        backgroundColor: "#111",
      }}
    />
  );
}
