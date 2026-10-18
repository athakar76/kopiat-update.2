import React from 'react';
import { ShoppingCart, Users, X } from 'lucide-react';
import { TableModal } from './TableModal';

interface SubHeaderProps {
  user: any;
  userName: string;
  cartItems: any[];
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  currentTable: string | null;
  setCurrentTable: (table: string | null) => void;
  showUnjoinWarning: boolean;
  setShowUnjoinWarning: (show: boolean) => void;
  handleUnjoinTable: () => void;
}

export function SubHeader({
  user,
  userName,
  cartItems,
  showCart,
  setShowCart,
  currentTable,
  setCurrentTable,
  showUnjoinWarning,
  setShowUnjoinWarning,
  handleUnjoinTable
}: SubHeaderProps) {
  const [showTableModal, setShowTableModal] = React.useState(false);

  const handleSelectTable = (tableName: string) => {
    setCurrentTable(tableName);
    localStorage.setItem('currentTable', tableName);
  };

  return (
    <>
      <div className="bg-[#1a1412] border-b border-[#3a2f2c]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-end gap-4 text-sm">
            {user?.emailVerified && (
              <>
                <button
                  onClick={() => setShowTableModal(true)}
                  className="flex items-center gap-2 text-[#d4a574] hover:text-[#e6d5c8] transition-colors"
                >
                  <Users size={16} />
                  <span>Tables</span>
                </button>
                {currentTable && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#2a1f1c] rounded-md">
                    <span className="text-[#d4a574]">Table: {currentTable}</span>
                    <button
                      onClick={() => setShowUnjoinWarning(true)}
                      className="text-[#b3a395] hover:text-[#d4a574] p-1"
                      title="Leave table"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative p-2 text-[#d4a574] hover:text-[#e6d5c8] transition-colors"
                >
                  <ShoppingCart size={16} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#d4a574] text-[#1a1412] text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {user?.emailVerified && (
        <>
          <TableModal
            isOpen={showTableModal}
            onClose={() => setShowTableModal(false)}
            userId={user.uid}
            onSelectTable={handleSelectTable}
          />

          {showUnjoinWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-[#3a2f2c] rounded-lg p-6 max-w-sm mx-auto border border-white/20">
                <h3 className="text-[#e6d5c8] text-lg font-semibold mb-4">Leave Table</h3>
                <p className="text-[#e6d5c8] mb-6">
                  Are you sure you want to leave this table? Your items in the cart will be removed.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleUnjoinTable}
                    className="flex-1 bg-[#d4a574] text-[#1a1412] py-2 rounded-md hover:bg-[#e6d5c8] transition-colors"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowUnjoinWarning(false)}
                    className="flex-1 bg-[#2a1f1c] text-[#e6d5c8] py-2 rounded-md hover:bg-[#3a2f2c] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
