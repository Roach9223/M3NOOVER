'use client';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

interface LineItemEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemEditor({ items, onChange }: LineItemEditorProps) {
  const addItem = () => {
    onChange([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unit_price_cents: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Description (e.g., Speed & Agility Training)"
              value={item.description}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>
          <div className="w-20">
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>
          <div className="w-32">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={item.unit_price_cents / 100 || ''}
                onChange={(e) =>
                  updateItem(item.id, 'unit_price_cents', Math.round(parseFloat(e.target.value || '0') * 100))
                }
                className="w-full pl-7 pr-3 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            disabled={items.length === 1}
            className="p-3 text-neutral-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-accent-500 hover:text-accent-400 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Item
      </button>
    </div>
  );
}
