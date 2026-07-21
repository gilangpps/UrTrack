import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterChip {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
}

export default function FilterBar({ search, onSearchChange, searchPlaceholder = 'Search...', chips }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-urtrack-500 focus:border-transparent"
        />
        {search && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.value}
              onClick={chip.onClick}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                chip.active
                  ? 'bg-urtrack-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
