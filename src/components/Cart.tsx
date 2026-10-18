import React from 'react';
import { CartItem } from '../types';
import { User, Users, ArrowLeft, BarChart2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CartProps {
  items: CartItem[];
  onRemoveFromCart: (cartItemId: string) => void;
  onCheckout: () => void;
  isProcessing: boolean;
  onBackToMenu: () => void;
}

interface ItemTotal {
  name: string;
  type: string;
  count: number;
  totalPrice: number;
}

export function Cart({ items, onRemoveFromCart, onCheckout, isProcessing, onBackToMenu }: CartProps) {
  const [showTotals, setShowTotals] = React.useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = React.useState(false);
  const total = items.reduce((sum, item) => sum + item.coffee.price * item.quantity, 0);
  const currentUserName = localStorage.getItem('userName');
  const [tableOwner, setTableOwner] = React.useState<string | null>(null);

  // Calculate category counts for the header
  const categoryCounts = React.useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.coffee.type === 'Teh') acc.teh += item.quantity;
        if (item.coffee.type === 'Kopi') acc.kopi += item.quantity;
        return acc;
      },
      { teh: 0, kopi: 0 }
    );
  }, [items]);

  React.useEffect(() => {
    const getTableOwner = async () => {
      if (items.length === 0) return;
      
      const tableName = items[0].tableName;
      if (!tableName) return;

      try {
        const tableQuery = query(
          collection(db, 'tables'),
          where('name', '==', tableName)
        );
        const querySnapshot = await getDocs(tableQuery);
        if (!querySnapshot.empty) {
          const tableData = querySnapshot.docs[0].data();
          setTableOwner(tableData.userName);
        }
      } catch (error) {
        console.error('Error fetching table owner:', error);
      }
    };

    getTableOwner();
  }, [items]);

  const itemsByTable = React.useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      const tableName = item.tableName || 'No Table';
      if (!acc[tableName]) {
        acc[tableName] = [];
      }
      acc[tableName].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    return Object.entries(grouped).sort(([a], [b]) => {
      if (a === 'No Table') return 1;
      if (b === 'No Table') return -1;
      return a.localeCompare(b);
    });
  }, [items]);

  const itemTotals = React.useMemo(() => {
    const totals = items.reduce((acc, item) => {
      const { name, type } = item.coffee;
      if (!acc[name]) {
        acc[name] = {
          name,
          type,
          count: 0,
          totalPrice: 0
        };
      }
      acc[name].count += item.quantity;
      acc[name].totalPrice += item.coffee.price * item.quantity;
      return acc;
    }, {} as Record<string, ItemTotal>);

    return Object.values(totals).sort((a, b) => {
      // Primary sort: Category (Kopi before Teh)
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      // Secondary sort: Count descending
      return b.count - a.count;
    });
  }, [items]);

  const canRemoveItem = (itemUserName: string) => {
    return currentUserName === itemUserName || currentUserName === tableOwner;
  };

  const handleClearTable = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearTable = () => {
    setShowClearConfirmation(false);
    onCheckout();
  };

  return (
    <div className="bg-[#2a1f1c] rounded-lg shadow-md p-4 border border-[#3a2f2c]">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 text-[#d4a574] hover:text-[#e6d5c8] transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Menu
        </button>
        <h2 className="text-xl font-semibold text-[#e6d5c8]">Your Cart</h2>
        {items.length > 0 && (
          <button
            onClick={() => setShowTotals(!showTotals)}
            className="flex items-center gap-2 text-[#d4a574] hover:text-[#e6d5c8] transition-colors"
            title={showTotals ? "Show items" : "Show order totals"}
          >
            <BarChart2 size={20} />
          </button>
        )}
      </div >

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#b3a395] mb-4">Your cart is empty</p>
          <button
            onClick={onBackToMenu}
            className="text-[#d4a574] hover:text-[#e6d5c8] font-medium"
          >
            Browse Menu
          </button>
        </div>
      ) : showTotals ? (
        <div className="space-y-4">
          <div className="bg-[#3a2f2c] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[#e6d5c8] mb-4">
              Order Totals (Teh - {categoryCounts.teh}, Kopi - {categoryCounts.kopi})
            </h3>
            <div className="space-y-3">
              {itemTotals.map((item) => (
                <div key={item.name} className="flex justify-between items-center border-b border-[#4a3f3c] last:border-b-0 pb-2 last:pb-0">
                  <div>
                    <h4 className="text-[#e6d5c8]">{item.name}</h4>
                    <p className="text-sm text-[#b3a395]">Quantity: {item.count}</p>
                  </div >
                  <span className="text-[#d4a574]">${item.totalPrice.toFixed(2)}</span >
                </div >
              ))}
            </div >
          </div >
          <div className="mt-6 pt-4 border-t border-[#3a2f2c]">
            <div className="flex justify-between mb-4">
              <span className="font-semibold text-[#e6d5c8]">Total:</span >
              <span className="font-semibold text-[#d4a574]">${total.toFixed(2)}</span >
            </div >
            {currentUserName === tableOwner && (
              <button
                onClick={handleClearTable}
                disabled={isProcessing}
                className={`w-full bg-red-500 text-white py-2 rounded-md transition-colors ${
                  isProcessing 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-red-600'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Clear Table'}
              </button>
            )}
          </div >
        </div >
      ) : (
        <>
          <div className="space-y-6">
            {itemsByTable.map(([tableName, tableItems]) => (
              <div key={tableName} className="border border-[#3a2f2c] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-[#d4a574]" />
                  <h3 className="text-lg font-medium text-[#e6d5c8]">{tableName}</h3>
                  {tableOwner === currentUserName && (
                    <span className="text-xs text-[#d4a574] bg-[#3a2f2c] px-2 py-1 rounded-full">
                      Table Owner
                    </span >
                  )}
                </div >
                <div className="space-y-4">
                  {tableItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between border-b border-[#3a2f2c] pb-4 last:border-b-0 ${
                        item.userName === currentUserName ? 'bg-[#2a1f1c] rounded-md p-2' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <h4 className="font-medium text-[#e6d5c8]">{item.coffee.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-[#b3a395]">
                          <User size={14} />
                          <span>{item.userName}</span >
                        </div >
                      </div >
                      <div className="flex items-center gap-4">
                        <span className="text-[#d4a574]">${item.coffee.price}</span >
                        {canRemoveItem(item.userName) && (
                          <button
                            onClick={() => onRemoveFromCart(item.id!)}
                            className="text-red-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-[#3a2f2c]"
                            title={currentUserName === tableOwner ? "Remove as table owner" : "Remove item"}
                          >
                            ×
                          </button>
                        )}
                      </div >
                    </div >
                  ))}
                </div >
              </div >
            ))}
          </div >
          <div className="mt-6 pt-4 border-t border-[#3a2f2c]">
            <div className="flex justify-between mb-4">
              <span className="font-semibold text-[#e6d5c8]">Total:</span >
              <span className="font-semibold text-[#d4a574]">${total.toFixed(2)}</span >
            </div >
            {currentUserName === tableOwner && (
              <button
                onClick={handleClearTable}
                disabled={isProcessing}
                className={`w-full bg-red-500 text-white py-2 rounded-md transition-colors ${
                  isProcessing 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-red-600'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Clear Table'}
              </button>
            )}
          </div >
        </>
      )}

      {/* Clear Table Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#3a2f2c] rounded-lg p-6 max-w-sm mx-auto border border-white/20">
            <h3 className="text-[#e6d5c8] text-lg font-semibold mb-4">Clear Table</h3>
            <p className="text-[#e6d5c8] mb-6">
              Are you sure you want to clear all items from the table? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmClearTable}
                className="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Clear Table
              </button>
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="flex-1 bg-[#2a1f1c] text-[#e6d5c8] py-2 rounded-md hover:bg-[#4a3f3c] transition-colors"
              >
                Cancel
              </button>
            </div >
          </div >
        </div >
      )}
    </div >
  );
}
