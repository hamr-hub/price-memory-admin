import React from "react";

type Point = { x: number; y: number };
type Item = { date: string; open?: number; close?: number; low?: number; high?: number; avg?: number };

const TrendChart: React.FC<{ data: Item[]; height?: number; metric?: "close" | "avg" | "open"; overlayData?: Item[] }> = ({ data, height = 120, metric = "close", overlayData }) => {
  const width = 600;
  const values = data.map((d) => Number((metric === "avg" ? d.avg : metric === "open" ? d.open : d.close) ?? 0)).filter((v) => !Number.isNaN(v));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min || 1;
  const points: Point[] = values.map((v, i) => ({ x: (i / Math.max(values.length - 1, 1)) * width, y: height - ((v - min) / range) * height }));
  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ");
  const last = points[points.length - 1];
  const minIndex = values.length ? values.indexOf(min) : -1;
  const minPoint = minIndex >= 0 ? points[minIndex] : undefined;
  const ovValues = (overlayData || []).map((d) => Number((metric === "avg" ? d.avg : metric === "open" ? d.open : d.close) ?? 0)).filter((v) => !Number.isNaN(v));
  const ovMin = ovValues.length ? Math.min(...ovValues) : 0;
  const ovMax = ovValues.length ? Math.max(...ovValues) : 0;
  const ovRange = ovMax - ovMin || 1;
  const ovPoints: Point[] = ovValues.map((v, i) => ({ x: (i / Math.max(ovValues.length - 1, 1)) * width, y: height - ((v - ovMin) / ovRange) * height }));
  const ovPath = ovPoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", border: "1px solid #eee", borderRadius: 6 }}>
      <path d={path} fill="none" stroke="#1677ff" strokeWidth={2} />
      {overlayData && overlayData.length > 0 && <path d={ovPath} fill="none" stroke="#fa8c16" strokeWidth={2} strokeDasharray="4 3" />}
      {last && <circle cx={last.x} cy={last.y} r={3} fill="#1677ff" />}
      {minPoint && (
        <g>
          <circle cx={minPoint.x} cy={minPoint.y} r={3} fill="#52c41a" />
          <text x={minPoint.x + 6} y={minPoint.y - 6} fontSize={12} fill="#52c41a">历史低价</text>
        </g>
      )}
    </svg>
  );
};

export default TrendChart;
