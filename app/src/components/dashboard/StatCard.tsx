interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-neutral-500 ml-1">vs last week</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-accent-500/10 rounded-lg text-accent-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
