'use client';

import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: number[] | { value: number }[];
  strokeColor?: string;
  fillColor?: string;
  height?: number;
}

export function SparklineChart({
  data,
  strokeColor = '#3b82f6',
  fillColor = '#3b82f6',
  height = 50,
}: SparklineChartProps) {
  const gradientId = useId();

  const chartData = Array.isArray(data)
    ? data.map((val, i) => ({ id: i, value: typeof val === 'number' ? val : (val as any).value }))
    : [];

  return (
    <div style={{ width: '100%', height }} className="pointer-events-none w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: -2, left: -2, bottom: -2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
