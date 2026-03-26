'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Campaign } from '@/lib/types';

export default function HistoryChart({ campaigns }: { campaigns: Campaign[] }) {
  // Take last 7 campaigns and format for chart
  const data = [...campaigns]
    .reverse()
    .slice(-7)
    .map(c => ({
      name: c.useCase.charAt(0).toUpperCase() + c.useCase.slice(1),
      count: c.totalFound,
      date: new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      color: c.useCase === 'job' ? '#6366f1' : c.useCase === 'customer' ? '#10b981' : '#f59e0b'
    }));

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full bg-surface p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-muted-foreground italic">
        No campaign data to display yet.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full bg-surface p-8 rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
      <h3 className="text-xl font-heading mb-6 flex items-center gap-3">
        Campaign Activity
        <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground bg-secondary px-2 py-0.5 rounded">Last 7 runs</span>
      </h3>
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{ 
                  backgroundColor: '#111318', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f1f5f9'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
