import React from "react";

type Point = { x: number; y: number };
type Item = { date: string; open?: number; close?: number; low?: number; high?: number; avg?: number };

const TrendChart: React.FC<{ data: Item[]; height?: number }> = ({ data, height = 120 }) => {
  const width = 600;
  const values = data.map((d) => Number(d.close ?? d.avg ?? 0)).filter((v) => !Number.isNaN(v));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min || 1;
  const points: Point[] = values.map((v, i) => ({ x: (i / Math.max(values.length - 1, 1)) * width, y: height - ((v - min) / range) * height }));
  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ");
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} style={{ display: "block", border: "1px solid #eee", borderRadius: 6 }}>
      <path d={path} fill="none" stroke="#1677ff" strokeWidth={2} />
      {last && <circle cx={last.x} cy={last.y} r={3} fill="#1677ff" />}
    </svg>
  );
};

export default TrendChart;
