import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee as CoffeeIcon, LogOut, Eye, EyeOff } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, and } from 'firebase/firestore';
import { SubHeader } from './SubHeader';
import { useAccessibility } from '../context/AccessibilityContext';

interface HeaderProps {
  user: any;
  userName: string;
  cartItems: any[];
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  currentTable: string | null;
  setCurrentTable: (table: string | null) => void;
}

export function Header({ user, userName, cartItems, showCart, setShowCart, currentTable, setCurrentTable }: HeaderProps) {
  const navigate = useNavigate();
  const { highVisibilityMode, toggleHighVisibility } = useAccessibility();
  const [showUnjoinWarning, setShowUnjoinWarning] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userName');
      localStorage.removeItem('currentTable');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUnjoinTable = async () => {
    try {
      const cartQuery = query(
        collection(db, 'cart'),
        and(
          where('tableName', '==', currentTable),
          where('userName', '==', userName)
        )
      );
      
      const querySnapshot = await getDocs(cartQuery);
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      setCurrentTable(null);
      localStorage.removeItem('currentTable');
      setShowCart(false);
      setShowUnjoinWarning(false);
    } catch (error) {
      console.error('Error removing cart items:', error);
      alert('Failed to remove cart items');
    }
  };

  const handleLogoClick = () => {
    setShowCart(false);
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-50 bg-brand-bg shadow-lg">
      <header className="bg-brand-card">
        <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity p-2"
            aria-label="Home"
          >
            <CoffeeIcon className="text-brand-accent" size={32} />
            <h1 className="text-2xl font-bold text-brand-text-primary">Coffee Shop</h1>
          </button>
          
          {user?.emailVerified && (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleHighVisibility}
                className="flex items-center gap-2 text-brand-accent hover:text-brand-text-primary transition-colors p-3 rounded-md border border-brand-accent/30"
                title={highVisibilityMode ? "Disable High Visibility" : "Enable High Visibility"}
              >
                {highVisibilityMode ? <EyeOff size={24} /> : <Eye size={24} />}
                <span className="hidden sm:inline text-sm font-medium">
                  {highVisibilityMode ? 'Normal' : 'High Vis'}
                </span>
              </button>

              <div className="flex items-center gap-2 text-brand-text-primary px-4 py-2 bg-brand-card rounded-md border border-[#4a3f3c]">
                <span className="font-medium">{userName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-brand-accent hover:text-brand-text-primary transition-colors p-3 rounded-full hover:bg-brand-card"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </div>
          )}
        </div>
      </header>
      <SubHeader 
        user={user}
        userName={userName}
        cartItems={cartItems}
        showCart={showCart}
        setShowCart={setShowCart}
        currentTable={currentTable} 
        setCurrentTable={setCurrentTable} 
        showUnjoinWarning={showUnjoinWarning}
        setShowUnjoinWarning={setShowUnjoinWarning}
        handleUnjoinTable={handleUnjoinTable}
      />
    </div>
  );
}
