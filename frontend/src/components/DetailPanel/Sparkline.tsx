'use client';

import React from 'react';

interface SparklineProps {
  points?: number[];
  color?: string;
  height?: number;
  width?: number;
}

export default function Sparkline({
  points = [43, 34, 38, 25, 31, 19, 28, 15, 23, 12, 20, 11, 18, 8, 16, 10],
  color = '#0d7778',
  height = 55,
  width = 300,
}: SparklineProps) {
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const svgPoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 10) - 5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div style={{ width: '100%', height: `${height}px`, marginTop: '12px' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />
      </svg>
    </div>
  );
}
