"use client";

import { useEffect, useRef, useState } from "react";

interface AdsterraBannerProps {
  adKey?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function AdsterraBanner({
  adKey = "ae9d16cc9abc184e693997fd2e0102fb",
  width = 728,
  height = 90,
  className,
}: AdsterraBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateScale = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        if (clientWidth > 0 && clientWidth < width) {
          setScale(clientWidth / width);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width]);

  if (!mounted) {
    return (
      <div
        style={{
          width: "100%",
          height: 90,
          borderRadius: 16,
          background: "var(--muted, #F8FAFC)",
        }}
      />
    );
  }

  const scaledHeight = Math.round(height * scale);

  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_blank" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        background: transparent;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <script type="text/javascript">
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="https://www.highrevenueformat.com/${adKey}/invoke.js"></script>
  </body>
</html>`;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        height: scaledHeight,
        minHeight: scaledHeight,
        position: "relative",
      }}
    >
      <div
        style={{
          width: width,
          height: height,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <iframe
          title="Sponsored Advertisement"
          srcDoc={htmlContent}
          width={width}
          height={height}
          style={{
            border: "none",
            overflow: "hidden",
            width: `${width}px`,
            height: `${height}px`,
          }}
          scrolling="no"
        />
      </div>
    </div>
  );
}
