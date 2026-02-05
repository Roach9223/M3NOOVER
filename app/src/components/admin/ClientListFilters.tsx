'use client';

interface ClientListFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
  balanceFilter: 'all' | 'outstanding' | 'clear';
  onBalanceChange: (balance: 'all' | 'outstanding' | 'clear') => void;
}

export function ClientListFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  balanceFilter,
  onBalanceChange,
}: ClientListFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by parent or athlete name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Status filter */}
        <div className="flex rounded-lg overflow-hidden border border-charcoal-700">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-accent-500 text-white'
                  : 'bg-charcoal-800 text-neutral-400 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Balance filter */}
        <div className="flex rounded-lg overflow-hidden border border-charcoal-700">
          {(['all', 'outstanding', 'clear'] as const).map((balance) => (
            <button
              key={balance}
              onClick={() => onBalanceChange(balance)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                balanceFilter === balance
                  ? 'bg-accent-500 text-white'
                  : 'bg-charcoal-800 text-neutral-400 hover:text-white'
              }`}
            >
              {balance === 'all'
                ? 'Any Balance'
                : balance === 'outstanding'
                ? 'Outstanding'
                : 'Paid Up'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
