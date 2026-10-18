import React from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Search } from 'lucide-react';

interface JoinTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (tableName: string) => void;
}

interface TableWithUser {
  id: string;
  name: string;
  createdAt: string;
  userName: string;
}

export function JoinTableModal({ isOpen, onClose, onSelectTable }: JoinTableModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [tables, setTables] = React.useState<TableWithUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const searchTables = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Search for tables by name
      const tableQuery = query(
        collection(db, 'tables'),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      
      const tableSnapshot = await getDocs(tableQuery);
      const tableResults: TableWithUser[] = [];

      // Get user details for each table
      for (const doc of tableSnapshot.docs) {
        const tableData = doc.data();
        const userDoc = await getDocs(
          query(
            collection(db, 'users'),
            where('uid', '==', tableData.userId)
          )
        );

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          tableResults.push({
            id: doc.id,
            name: tableData.name,
            createdAt: tableData.createdAt,
            userName: userData.name || 'Unknown User'
          });
        }
      }

      // Search for tables by username
      const userQuery = query(
        collection(db, 'users'),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );

      const userSnapshot = await getDocs(userQuery);
      
      for (const userDoc of userSnapshot.docs) {
        const userData = userDoc.data();
        const userTableQuery = query(
          collection(db, 'tables'),
          where('userId', '==', userDoc.id)
        );
        
        const userTableSnapshot = await getDocs(userTableQuery);
        
        userTableSnapshot.docs.forEach(tableDoc => {
          const tableData = tableDoc.data();
          if (!tableResults.some(t => t.id === tableDoc.id)) {
            tableResults.push({
              id: tableDoc.id,
              name: tableData.name,
              createdAt: tableData.createdAt,
              userName: userData.name
            });
          }
        });
      }

      setTables(tableResults);
      if (tableResults.length === 0) {
        setError('No tables found');
      }
    } catch (error) {
      console.error('Error searching tables:', error);
      setError('Failed to search tables');
    } finally {
      setIsLoading(false);
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

        <h2 className="text-2xl font-semibold text-[#e6d5c8] mb-6">Join Table</h2>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by table name or username"
            className="flex-1 rounded-md bg-[#3a2f2c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
          />
          <button
            onClick={searchTables}
            disabled={isLoading}
            className="bg-[#d4a574] text-[#1a1412] px-4 py-2 rounded-md hover:bg-[#e6d5c8] transition-colors flex items-center gap-2"
          >
            <Search size={16} />
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="space-y-3">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-[#3a2f2c] p-4 rounded-md flex justify-between items-center"
            >
              <div>
                <h4 className="text-[#e6d5c8] font-medium">{table.name}</h4>
                <p className="text-[#b3a395] text-sm">
                  Created by: {table.userName}
                </p>
                <p className="text-[#b3a395] text-sm">
                  {new Date(table.createdAt).toLocaleDateString()}
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
      </div>
    </div>
  );
}
