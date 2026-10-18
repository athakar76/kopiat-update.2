import React from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
    setIsLoading(false);
    setIsForgotPassword(false);
  };

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
        await sendEmailVerification(userCredential.user);
        localStorage.setItem('userName', name);
        setMessage('Registration successful! Please check your email for verification.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        if (!auth.currentUser?.emailVerified) {
          setError('Please verify your email before logging in.');
          await auth.signOut();
          return;
        }
        resetForm();
        onClose();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#3a2f2c] rounded-lg p-6 w-full max-w-md relative border border-white/20">
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-[#b3a395] hover:text-[#d4a574]"
        >
          ×
        </button>

        <h2 className="text-2xl font-semibold text-[#e6d5c8] mb-4">
          {isForgotPassword ? 'Reset Password' : isRegistering ? 'Register' : 'Login'}
        </h2>

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
                className="mt-1 block w-full rounded-md bg-[#2a1f1c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
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
              className="mt-2 text-[#e6d5c8] hover:text-[#d4a574] text-sm block w-full"
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
                  className="mt-1 block w-full rounded-md bg-[#2a1f1c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
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
                className="mt-1 block w-full rounded-md bg-[#2a1f1c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
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
                className="mt-1 block w-full rounded-md bg-[#2a1f1c] border-[#4a3f3c] text-[#e6d5c8] px-3 py-2"
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
              {isLoading ? (isRegistering ? 'Registering...' : 'Logging in...') : (isRegistering ? 'Register' : 'Login')}
            </button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsRegistering(!isRegistering);
                }}
                className="text-[#e6d5c8] hover:text-[#d4a574]"
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
                  className="text-[#e6d5c8] hover:text-[#d4a574]"
                >
                  Forgot Password?
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
