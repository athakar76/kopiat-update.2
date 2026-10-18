import React from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X } from 'lucide-react';

interface GroupTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSelectTable: (tableName: string) => void;
}

interface Table {
  id: string;
  name: string;
  createdAt: string;
}

export function GroupTableModal({ isOpen, onClose, userId, onSelectTable }: GroupTableModalProps) {
  const [tables, setTables] = React.useState<Table[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [newTableName, setNewTableName] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen, userId]);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const tablesQuery = query(
        collection(db, 'tables'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(tablesQuery);
      const tablesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];
      setTables(tablesList);
    } catch (error) {
      console.error('Error loading tables:', error);
      setError('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewTable = async () => {
    if (!newTableName.trim()) {
      setError('Please enter a table name');
      return;
    }

    try {
      const newTable = {
        name: newTableName.trim(),
        userId,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'tables'), newTable);
      setTables(prev => [...prev, { id: docRef.id, ...newTable }]);
      setNewTableName('');
      setError('');
    } catch (error) {
      console.error('Error creating table:', error);
      setError('Failed to create table');
    }
  };

  const handleUseTable = (tableName: string) => {
    onSelectTable(tableName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#2a1f1c] rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#b3a395] hover:text-[#d4a574]"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-[#e6d5c8] mb-6">Group Tables</h2>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            placeholder="Enter table name"
            className="flex-1 rounded-md bg-[#3a2f2c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
          />
          <button
            onClick={createNewTable}
            className="bg-[#d4a574] text-[#1a1412] px-4 py-2 rounded-md hover:bg-[#e6d5c8] transition-colors"
          >
            Create
          </button>
        </div>

        {isLoading ? (
          <p className="text-[#b3a395] text-center">Loading tables...</p>
        ) : tables.length === 0 ? (
          <p className="text-[#b3a395] text-center">No tables created yet</p>
        ) : (
          <div className="space-y-3">
            <h3 className="text-[#e6d5c8] font-medium mb-2">Your Tables</h3>
            {tables.map(table => (
              <div
                key={table.id}
                className="bg-[#3a2f2c] p-4 rounded-md flex justify-between items-center"
              >
                <div>
                  <h4 className="text-[#e6d5c8] font-medium">{table.name}</h4>
                  <p className="text-[#b3a395] text-sm">
                    Created: {new Date(table.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleUseTable(table.name)}
                  className="text-[#d4a574] hover:text-[#e6d5c8]"
                >
                  Use Table
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
