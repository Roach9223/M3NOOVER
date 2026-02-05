'use client';

import { formatAmountForDisplay } from '@/lib/format';

interface MetricsRowProps {
  revenueThisMonth: number;
  activeClients: number;
  sessionsThisWeek: number;
  outstandingCount: number;
  outstandingAmount: number;
}

export function MetricsRow({
  revenueThisMonth,
  activeClients,
  sessionsThisWeek,
  outstandingCount,
  outstandingAmount,
}: MetricsRowProps) {
  const metrics = [
    {
      label: 'This Month',
      value: formatAmountForDisplay(revenueThisMonth),
      sublabel: 'Revenue',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Clients',
      value: activeClients.toString(),
      sublabel: 'Active',
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/10',
    },
    {
      label: 'Sessions',
      value: sessionsThisWeek.toString(),
      sublabel: 'This Week',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Outstanding',
      value: outstandingCount.toString(),
      sublabel: outstandingCount > 0 ? formatAmountForDisplay(outstandingAmount) : 'All clear',
      color: outstandingCount > 0 ? 'text-amber-400' : 'text-green-400',
      bgColor: outstandingCount > 0 ? 'bg-amber-500/10' : 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`${metric.bgColor} rounded-xl p-4 text-center`}
        >
          <p className={`text-2xl md:text-3xl font-bold ${metric.color}`}>
            {metric.value}
          </p>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wide">
            {metric.sublabel}
          </p>
        </div>
      ))}
    </div>
  );
}
