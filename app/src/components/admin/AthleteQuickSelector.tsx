'use client';

interface Athlete {
  id: string;
  name: string;
  parent_name?: string;
}

interface AthleteQuickSelectorProps {
  athletes: Athlete[];
  value: string;
  onChange: (athleteId: string) => void;
  disabled?: boolean;
}

export function AthleteQuickSelector({
  athletes,
  value,
  onChange,
  disabled,
}: AthleteQuickSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        Athlete <span className="text-red-400">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
        required
      >
        <option value="">Select an athlete...</option>
        {athletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.name}
            {athlete.parent_name && ` (${athlete.parent_name})`}
          </option>
        ))}
      </select>
    </div>
  );
}
