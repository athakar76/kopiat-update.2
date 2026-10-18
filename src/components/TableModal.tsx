import React from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Search, Plus, Trash2 } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSelectTable: (tableName: string) => void;
}

interface TableWithUser {
  id: string;
  name: string;
  createdAt: string;
  userName: string;
  userId: string;
}

export function TableModal({ isOpen, onClose, userId, onSelectTable }: TableModalProps) {
  const [mode, setMode] = React.useState<'create' | 'join'>('create');
  const [newTableName, setNewTableName] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [tables, setTables] = React.useState<TableWithUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (isOpen && mode === 'create') {
      loadUserTables();
    }
  }, [isOpen, mode, userId]);

  // Auto-search effect
  React.useEffect(() => {
    if (mode === 'join' && searchTerm.length >= 2) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      setIsLoading(true);
      searchTimeout.current = setTimeout(() => {
        searchTables();
      }, 300);
    } else if (mode === 'join') {
      setTables([]);
      setError('');
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, mode]);

  const loadUserTables = async () => {
    try {
      setIsLoading(true);
      setError('');
      const tablesQuery = query(
        collection(db, 'tables'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(tablesQuery);
      const tablesList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt,
          userName: data.userName || 'Unknown User',
          userId: data.userId
        };
      });
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
      setIsLoading(true);
      setError('');

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userName = userDoc.exists() ? userDoc.data().name : localStorage.getItem('userName');

      if (!userName) {
        throw new Error('User name not found');
      }

      const tableName = newTableName.trim();
      const newTable = {
        name: tableName,
        searchName: tableName.toLowerCase(), // For case-insensitive search
        userId,
        userName,
        searchUserName: userName.toLowerCase(), // For case-insensitive search
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'tables'), newTable);
      
      setTables(prev => [...prev, {
        id: docRef.id,
        name: tableName,
        createdAt: newTable.createdAt,
        userName: userName,
        userId: userId
      }]);
      setNewTableName('');
    } catch (error) {
      console.error('Error creating table:', error);
      setError('Failed to create table');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await deleteDoc(doc(db, 'tables', tableId));
      setTables(prev => prev.filter(table => table.id !== tableId));
    } catch (error) {
      console.error('Error deleting table:', error);
      setError('Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  const searchTables = async () => {
    if (searchTerm.length < 2) return;

    try {
      const searchTermLower = searchTerm.toLowerCase().trim();
      const tableResults = new Map<string, TableWithUser>();

      // Search by table name (case-insensitive)
      const nameQuery = query(
        collection(db, 'tables'),
        where('searchName', '>=', searchTermLower),
        where('searchName', '<=', searchTermLower + '\uf8ff')
      );

      // Search by username (case-insensitive)
      const userQuery = query(
        collection(db, 'tables'),
        where('searchUserName', '>=', searchTermLower),
        where('searchUserName', '<=', searchTermLower + '\uf8ff')
      );

      const [nameSnapshot, userSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(userQuery)
      ]);

      // Process results using a Map to avoid duplicates
      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          if (!tableResults.has(doc.id)) {
            tableResults.set(doc.id, {
              id: doc.id,
              name: data.name,
              createdAt: data.createdAt,
              userName: data.userName || 'Unknown User',
              userId: data.userId
            });
          }
        });
      };

      processSnapshot(nameSnapshot);
      processSnapshot(userSnapshot);

      const results = Array.from(tableResults.values());
      setTables(results);
      
      if (results.length === 0) {
        setError('No tables found matching your search');
      } else {
        setError('');
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
      <div className="bg-[#3a2f2c] rounded-lg p-6 w-full max-w-md relative border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#b3a395] hover:text-[#d4a574]"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-[#e6d5c8] mb-6">Tables</h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('create');
              setSearchTerm('');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-colors ${
              mode === 'create'
                ? 'bg-[#d4a574] text-[#1a1412]'
                : 'bg-[#2a1f1c] text-[#e6d5c8] hover:bg-[#4a3f3c]'
            }`}
          >
            Create Table
          </button>
          <button
            onClick={() => {
              setMode('join');
              setNewTableName('');
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-colors ${
              mode === 'join'
                ? 'bg-[#d4a574] text-[#1a1412]'
                : 'bg-[#2a1f1c] text-[#e6d5c8] hover:bg-[#4a3f3c]'
            }`}
          >
            Join Table
          </button>
        </div>

        {mode === 'create' ? (
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              className="flex-1 rounded-md bg-[#2a1f1c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2 placeholder-[#b3a395]"
            />
            <button
              onClick={createNewTable}
              disabled={isLoading}
              className="bg-[#d4a574] text-[#1a1412] px-4 py-2 rounded-md hover:bg-[#e6d5c8] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} />
              Create
            </button>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by table name or owner"
                className="w-full rounded-md bg-[#2a1f1c] border-[#4a3f3c] text-[#e6d5c8] pl-10 pr-3 py-2 placeholder-[#b3a395]"
              />
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b3a395]"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#d4a574] border-t-transparent"></div>
                </div>
              )}
            </div>
            <p className="text-[#b3a395] text-sm">
              Type at least 2 characters to search
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-[#2a1f1c] p-4 rounded-md flex justify-between items-center"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUseTable(table.name)}
                  className="text-[#d4a574] hover:text-[#e6d5c8] px-3 py-1 transition-colors"
                >
                  Use Table
                </button>
                {table.userId === userId && (
                  <button
                    onClick={() => deleteTable(table.id)}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-400 px-2 py-1 transition-colors disabled:opacity-50"
                    title="Delete table"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
