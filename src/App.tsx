import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, setDoc, onSnapshot, query, where, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { coffees } from './data/coffees';
import { CoffeeCard } from './components/CoffeeCard';
import { Cart } from './components/Cart';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { db, auth } from './lib/firebase';
import type { Coffee, CartItem } from './types';
import { useAccessibility } from './context/AccessibilityContext';

function App() {
  const { highVisibilityMode } = useAccessibility();
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [showCart, setShowCart] = React.useState(false);
  const [filter, setFilter] = React.useState<'Teh' | 'Kopi' | 'Favorites'>('Teh');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [userName, setUserName] = React.useState<string>('');
  const [currentTable, setCurrentTable] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showTableWarning, setShowTableWarning] = React.useState(false);
  const [recentCoffeeIds, setRecentCoffeeIds] = React.useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize recentCoffeeIds from localStorage
  React.useEffect(() => {
    const storedIds = localStorage.getItem('recentCoffeeIds');
    if (storedIds) {
      try {
        setRecentCoffeeIds(JSON.parse(storedIds));
      } catch (e) {
        console.error("Failed to parse recentCoffeeIds", e);
        setRecentCoffeeIds([]);
      }
    }
  }, []);

  // Apply high visibility class to body
  React.useEffect(() => {
    if (highVisibilityMode) {
      document.body.classList.add('high-visibility');
    } else {
      document.body.classList.remove('high-visibility');
    }
  }, [highVisibilityMode]);

  // Function to check if device is mobile or tablet
  const isMobileOrTablet = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
    return isMobile || isTablet;
  };

  // Handle fullscreen mode
  React.useEffect(() => {
    const handleFullscreen = async () => {
      if (isMobileOrTablet()) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (error) {
          console.log('Fullscreen request failed');
        }
      }
    };

    handleFullscreen();
  }, []);

  React.useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.name) {
              setUserName(userData.name);
            } else {
              setUserName('Guest');
            }
            localStorage.setItem('userName', userData.name);
          } else {
            const storedName = localStorage.getItem('userName');
            if (storedName) {
              setUserName(storedName);
            }
          }

          const storedTable = localStorage.getItem('currentTable');
          if (storedTable) {
            setCurrentTable(storedTable);
          }

          if (user.emailVerified && location.pathname === '/login') {
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          const storedName = localStorage.getItem('userName');
          if (storedName) {
            setUserName(storedName);
          }
        }
      } else {
        setUserName('');
        setCurrentTable(null);
        setCartItems([]);
        localStorage.removeItem('userName');
        localStorage.removeItem('currentTable');
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  React.useEffect(() => {
    if (!user?.emailVerified || !currentTable) return;

    const cartQuery = query(
      collection(db, 'cart'),
      where('tableName', '==', currentTable)
    );

    const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
      const items: CartItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const coffee = coffees.find(c => c.id === data.coffeeId);
        if (coffee) {
          items.push({
            id: doc.id,
            coffee,
            quantity: data.quantity,
            options: data.options,
            userName: data.userName,
            tableName: data.tableName
          });
        }
      });
      setCartItems(items);
    });

    return () => unsubscribe();
  }, [user?.emailVerified, currentTable]);

  const filteredCoffees = React.useMemo(() => {
    if (filter === 'Favorites') {
      return recentCoffeeIds
        .map(id => coffees.find(c => c.id === id))
        .filter((c): c is Coffee => !!c);
    }
    return coffees.filter(coffee => coffee.type === filter);
  }, [filter, recentCoffeeIds]);

  const handleAddToCart = async (coffee: Coffee, options: { sugar: boolean; milk: boolean }) => {
    if (!user?.emailVerified) {
      navigate('/login');
      return;
    }

    if (!currentTable) {
      setShowTableWarning(true);
      return;
    }

    try {
      // 1. Add to Firestore Cart
      await addDoc(collection(db, 'cart'), {
        userId: user.uid,
        coffeeId: coffee.id,
        quantity: 1,
        options,
        userName,
        tableName: currentTable,
        createdAt: serverTimestamp()
      });

      // 2. Update Recent Items in state and localStorage
      setRecentCoffeeIds(prev => {
        const filtered = prev.filter(id => id !== coffee.id);
        const updated = [coffee.id, ...filtered].slice(0, 5);
        localStorage.setItem('recentCoffeeIds', JSON.stringify(updated));
        return updated;
      });

    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  const handleRemoveFavorite = (id: string) => {
    setRecentCoffeeIds(prev => {
      const updated = prev.filter(itemId => itemId !== id);
      localStorage.setItem('recentCoffeeIds', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      await deleteDoc(doc(db, 'cart', cartItemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item from cart');
    }
  };

  const handleCheckout = async () => {
    if (!user?.emailVerified) {
      navigate('/login');
      return;
    }
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const order = {
        userId: user.uid,
        userName,
        tableName: currentTable,
        items: cartItems.map(item => ({
          coffeeId: item.coffee.id,
          name: item.coffee.name,
          price: item.coffee.price,
          quantity: item.quantity,
          options: item.options
        })),
        total: cartItems.reduce((sum, item) => sum + item.coffee.price * item.quantity, 0),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), order);
      
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, 'cart', item.id!))
      );
      await Promise.all(deletePromises);
      
      setShowCart(false);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-accent text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user?.emailVerified ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/" element={
        user?.emailVerified ? (
          <div className="min-h-screen bg-brand-bg">
            <Header
              user={user}
              userName={userName}
              cartItems={cartItems}
              showCart={showCart}
              setShowCart={setShowCart}
              currentTable={currentTable}
              setCurrentTable={setCurrentTable}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
              {!showCart && (
                <div className="flex justify-center gap-4 mb-10">
                  <button
                    onClick={() => setFilter('Favorites')}
                    className={`px-6 py-3 rounded-md text-base font-medium transition-colors ${
                      filter === 'Favorites'
                        ? 'bg-brand-accent text-brand-bg'
                        : 'bg-brand-card text-brand-text-secondary hover:bg-[#3a2f2c]'
                    }`}
                  >
                    Favorites
                  </button>
                  <button
                    onClick={() => setFilter('Teh')}
                    className={`px-6 py-3 rounded-md text-base font-medium transition-colors ${
                      filter === 'Teh'
                        ? 'bg-brand-accent text-brand-bg'
                        : 'bg-brand-card text-brand-text-secondary hover:bg-[#3a2f2c]'
                    }`}
                  >
                    Teh
                  </button>
                  <button
                    onClick={() => setFilter('Kopi')}
                    className={`px-6 py-3 rounded-md text-base font-medium transition-colors ${
                      filter === 'Kopi'
                        ? 'bg-brand-accent text-brand-bg'
                        : 'bg-brand-card text-brand-text-secondary hover:bg-[#3a2f2c]'
                    }`}
                  >
                    Kopi
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {showCart ? (
                  <div className="col-span-full">
                    <Cart
                      items={cartItems}
                      onRemoveFromCart={handleRemoveFromCart}
                      onCheckout={handleCheckout}
                      isProcessing={isProcessing}
                      onBackToMenu={() => setShowCart(false)}
                    />
                  </div>
                ) : (
                  filteredCoffees.map(coffee => (
                    <CoffeeCard
                      key={coffee.id}
                      coffee={coffee}
                      onAddToCart={handleAddToCart}
                      isFavorite={recentCoffeeIds.includes(coffee.id)}
                      onRemoveFavorite={handleRemoveFavorite}
                    />
                  ))
                )}
              </div>
            </main>

            {/* Table Warning Modal */}
            {showTableWarning && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-brand-card rounded-lg p-6 max-w-sm mx-auto border border-[#3a2f2c]">
                  <h3 className="text-brand-text-primary text-lg font-semibold mb-4">Join a Table</h3>
                  <p className="text-brand-text-secondary mb-6">Please join a table before adding items to your cart.</p>
                  <button
                    onClick={() => setShowTableWarning(false)}
                    className="w-full bg-brand-accent text-brand-bg py-3 rounded-md hover:bg-[#e6d5c8] transition-colors font-bold"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
