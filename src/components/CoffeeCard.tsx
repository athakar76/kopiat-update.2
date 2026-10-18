import React, { useState } from 'react';
import { Coffee, Plus, X } from 'lucide-react';
import type { Coffee as CoffeeType } from '../types';

interface CoffeeCardProps {
  coffee: CoffeeType;
  onAddToCart: (coffee: CoffeeType, options: { sugar: boolean; milk: boolean }) => void;
  isFavorite?: boolean;
  onRemoveFavorite?: (id: string) => void;
}

export function CoffeeCard({ 
  coffee, 
  onAddToCart, 
  isFavorite, 
  onRemoveFavorite 
}: CoffeeCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState({ sugar: false, milk: false });

  const handleAdd = () => {
    onAddToCart(coffee, options);
    setShowOptions(false);
    setOptions({ sugar: false, milk: false });
  };

  return (
    <div className="relative bg-brand-card rounded-xl overflow-hidden shadow-md border border-[#3a2f2c] group transition-all hover:shadow-xl">
      {isFavorite && onRemoveFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFavorite(coffee.id);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 bg-black/40 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-sm"
          aria-label="Remove from favorites"
        >
          <X size={16} />
        </button>
      )}

      <div className="aspect-square overflow-hidden bg-[#2a1f1c]">
        <img 
          src={coffee.image} 
          alt={coffee.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-brand-text-primary font-bold text-lg leading-tight">{coffee.name}</h3>
        </div>
        <p className="text-brand-text-secondary text-sm mb-3">{coffee.type}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-brand-accent font-bold text-lg">
            ${coffee.price.toFixed(2)}
          </span>
          
          {!showOptions ? (
            <button
              onClick={() => setShowOptions(true)}
              className="p-2 bg-brand-accent text-brand-bg rounded-lg hover:bg-[#e6d5c8] transition-colors"
              aria-label="Add to cart"
            >
              <Plus size={20} />
            </button>
          ) : (
            <div className="flex flex-col gap-2 w-full ml-2">
              <div className="flex items-center justify-between text-xs text-brand-text-secondary">
                <span>Sugar</span>
                <input
                  type="checkbox"
                  checked={options.sugar}
                  onChange={(e) => setOptions({ ...options, sugar: e.target.checked })}
                  className="accent-brand-accent"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-brand-text-secondary">
                <span>Milk</span>
                <input
                  type="checkbox"
                  checked={options.milk}
                  onChange={(e) => setOptions({ ...options, milk: e.target.checked })}
                  className="accent-brand-accent"
                />
              </div>
              <button
                onClick={handleAdd}
                className="mt-1 w-full py-1.5 bg-brand-accent text-brand-bg text-xs font-bold rounded hover:bg-[#e6d5c8] transition-colors"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
