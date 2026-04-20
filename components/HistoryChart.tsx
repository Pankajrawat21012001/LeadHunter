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
  const data = [...campaigns]
    .reverse()
    .slice(-7)
    .map(c => ({
      name: c.useCase.charAt(0).toUpperCase() + c.useCase.slice(1),
      count: c.totalFound,
      date: new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      color: c.useCase === 'job' ? '#7c3aed' : c.useCase === 'customer' ? '#059669' : '#d97706'
    }));

  if (data.length === 0) {
    return (
      <div className="h-[280px] w-full bg-white p-8 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center text-muted-foreground italic text-sm">
        No campaign data to display yet.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full bg-white p-8 rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
      <h3 className="text-lg font-heading text-foreground mb-5 flex items-center gap-3">
        Campaign Activity
        <span className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">Last 7 runs</span>
      </h3>
      <div className="w-full h-[160px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.07)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#7c6fa0" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#7c6fa0" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(124,58,237,0.04)' }}
              contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid rgba(124,58,237,0.15)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#1a1033',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.1)'
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
