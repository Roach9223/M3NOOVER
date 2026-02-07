'use client';

import { useState, useRef, useEffect } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedClient = clients.find((c) => c.id === value);

  const filteredClients = clients.filter((client) => {
    if (!search) return true;
    const name = client.full_name?.toLowerCase() || '';
    return name.includes(search.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (clientId: string) => {
    onChange(clientId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Trigger button / display */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-left text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent flex items-center justify-between"
      >
        <span className={selectedClient ? 'text-white' : 'text-neutral-500'}>
          {selectedClient?.full_name || 'Select a client...'}
        </span>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-charcoal-800 border border-charcoal-700 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-charcoal-700">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-600 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-60 overflow-auto">
            {filteredClients.length === 0 ? (
              <li className="px-4 py-3 text-neutral-500 text-center">
                No clients found
              </li>
            ) : (
              filteredClients.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(client.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-charcoal-700 transition-colors ${
                      client.id === value
                        ? 'bg-accent-500/10 text-accent-500'
                        : 'text-white'
                    }`}
                  >
                    {client.full_name || 'Unknown'}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
