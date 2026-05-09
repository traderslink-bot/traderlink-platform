"use client";

import { useEffect, useRef } from "react";

type LevelLine = {
  y: number;
  tone: "support" | "resistance" | "vwap";
  label: string;
};

const levels: LevelLine[] = [
  { y: 0.28, tone: "resistance", label: "R2 18.42" },
  { y: 0.42, tone: "resistance", label: "R1 17.86" },
  { y: 0.55, tone: "vwap", label: "VWAP" },
  { y: 0.68, tone: "support", label: "S1 16.90" },
  { y: 0.8, tone: "support", label: "S2 16.35" },
];

function colorForTone(tone: LevelLine["tone"]): string {
  if (tone === "support") {
    return "rgba(52, 211, 153, 0.72)";
  }

  if (tone === "resistance") {
    return "rgba(96, 165, 250, 0.72)";
  }

  return "rgba(251, 191, 36, 0.7)";
}

export function LandingHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      pixelRatio = window.devicePixelRatio || 1;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);

      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#020817");
      background.addColorStop(0.52, "#071d3d");
      background.addColorStop(1, "#03121f");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.globalAlpha = 0.54;
      context.strokeStyle = "rgba(148, 163, 184, 0.28)";
      context.lineWidth = 1;
      const gridGap = Math.max(42, Math.min(72, width / 18));
      for (let x = (time / 80) % gridGap; x < width; x += gridGap) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += gridGap) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.globalAlpha = 1;

      const chartLeft = width * 0.5;
      const chartRight = width * 0.98;
      const chartTop = height * 0.36;
      const chartBottom = height * 0.9;
      const chartWidth = chartRight - chartLeft;
      const chartHeight = chartBottom - chartTop;

      context.fillStyle = "rgba(2, 8, 23, 0.22)";
      context.fillRect(chartLeft - 26, chartTop - 18, chartWidth + 52, chartHeight + 64);

      for (const level of levels) {
        const y = chartTop + chartHeight * level.y;
        context.strokeStyle = colorForTone(level.tone);
        context.lineWidth = level.tone === "vwap" ? 2.4 : 1.8;
        context.setLineDash(level.tone === "vwap" ? [8, 8] : [12, 12]);
        context.beginPath();
        context.moveTo(chartLeft, y);
        context.lineTo(chartRight, y);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = colorForTone(level.tone);
        context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
        context.fillText(level.label, chartRight - 86, y - 8);
      }

      const points = Array.from({ length: 72 }, (_, index) => {
        const progress = index / 71;
        const wave = Math.sin(progress * Math.PI * 5.2 + time / 1400) * 0.08;
        const pulse = Math.sin(progress * Math.PI * 15 + time / 620) * 0.025;
        const trend = 0.62 - progress * 0.22;
        return {
          x: chartLeft + progress * chartWidth,
          y: chartTop + chartHeight * Math.max(0.18, Math.min(0.82, trend + wave + pulse)),
        };
      });

      context.strokeStyle = "rgba(125, 211, 252, 0.95)";
      context.lineWidth = 3;
      context.shadowColor = "rgba(56, 189, 248, 0.7)";
      context.shadowBlur = 22;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
      context.shadowBlur = 0;

      for (let index = 5; index < points.length; index += 9) {
        const point = points[index];
        const candleHeight = 16 + ((index * 7) % 24);
        const isGreen = index % 3 !== 0;
        context.strokeStyle = isGreen
          ? "rgba(52, 211, 153, 0.78)"
          : "rgba(248, 113, 113, 0.72)";
        context.lineWidth = 1.8;
        context.beginPath();
        context.moveTo(point.x, point.y - candleHeight / 2);
        context.lineTo(point.x, point.y + candleHeight / 2);
        context.stroke();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-90"
    />
  );
}
