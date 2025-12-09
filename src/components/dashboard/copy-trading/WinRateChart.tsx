"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface WinRateChartProps {
    data: { date: string; value: number }[]; // value 0 to 1
}

export function WinRateChart({ data }: WinRateChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="date"
                    stroke="#525252"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#525252"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                    cursor={{ fill: '#262626' }}
                    contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626" }}
                    labelStyle={{ color: "#a3a3a3" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Win Rate']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value >= 0.5 ? '#10b981' : '#ef4444'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
