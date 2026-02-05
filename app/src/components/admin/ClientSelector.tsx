'use client';

interface Client {
  id: string;
  full_name: string | null;
}

interface ClientSelectorProps {
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
}

export function ClientSelector({ clients, value, onChange }: ClientSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent appearance-none cursor-pointer"
    >
      <option value="">Select a client...</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.full_name || 'Unknown'}
        </option>
      ))}
    </select>
  );
}
