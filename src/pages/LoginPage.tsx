import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export function LoginPage() {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
    setIsLoading(false);
    setIsForgotPassword(false);
  };

  const handleSocialSignIn = async (provider: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      try {
        const result = await signInWithPopup(auth, provider);
        await handleSocialAuthResult(result);
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Social sign in error:', error);
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for authentication';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuthResult = async (result: any) => {
    const user = result.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } else {
      await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    }

    localStorage.setItem('userName', user.displayName || '');
    navigate('/');
  };

  const handleGoogleSignIn = () => handleSocialSignIn(googleProvider);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });

        await sendEmailVerification(userCredential.user);
        localStorage.setItem('userName', name);
        setMessage('Registration successful! Please check your email for verification.');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError('Please verify your email before logging in.');
          await auth.signOut();
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          localStorage.setItem('userName', userData.name);
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          lastLoginAt: new Date().toISOString()
        }, { merge: true });

        resetForm();
        navigate('/');
      }
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account already exists with this email';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1412]">
      <Header
        user={null}
        userName=""
        cartItems={[]}
        showCart={false}
        setShowCart={() => {}}
        currentTable={null}
        setCurrentTable={() => {}}
      />
      
      <div className="flex flex-col items-center justify-center p-4 pt-16">
        <div className="bg-[#2a1f1c] rounded-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-[#e6d5c8] mb-6">
            {isForgotPassword ? 'Reset Password' : isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>

          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white text-gray-800 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3a2f2c]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#2a1f1c] text-[#b3a395]">Or continue with</span>
            </div>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#e6d5c8]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#3a2f2c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
                  required
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <button
                type="submit"
                className={`w-full bg-[#d4a574] text-[#1a1412] py-2 rounded-md transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#e6d5c8]'
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsForgotPassword(false);
                }}
                className="mt-2 text-[#b3a395] hover:text-[#d4a574] text-sm block w-full"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#e6d5c8]">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-[#3a2f2c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#e6d5c8]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#3a2f2c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#e6d5c8]">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#3a2f2c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <button
                type="submit"
                className={`w-full bg-[#d4a574] text-[#1a1412] py-2 rounded-md transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#e6d5c8]'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (isRegistering ? 'Creating Account...' : 'Logging in...') : (isRegistering ? 'Create Account' : 'Login')}
              </button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsRegistering(!isRegistering);
                  }}
                  className="text-[#b3a395] hover:text-[#d4a574]"
                >
                  {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                </button>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsForgotPassword(true);
                    }}
                    className="text-[#b3a395] hover:text-[#d4a574]"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
