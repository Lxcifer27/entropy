import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  getAdditionalUserInfo
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper function to handle Firebase auth errors
  const handleAuthError = (error) => {
    const errorCode = error.code;
    let errorMessage = 'An unexpected error occurred';
    
    // Map Firebase error codes to user-friendly messages
    switch (errorCode) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account with that email was found';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'Email already in use';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in popup was closed before completing the sign in';
        break;
      case 'auth/cancelled-popup-request':
        errorMessage = 'Sign-in cancelled';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Sign-in popup was blocked by the browser';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Please sign in again to complete this action';
        break;
      default:
        errorMessage = error.message || 'An unexpected error occurred';
    }
    
    setAuthError(errorMessage);
    console.error('Auth error:', errorCode, errorMessage);
    return errorMessage;
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setAuthError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get additional user info (is new user?)
      const additionalInfo = getAdditionalUserInfo(result);
      return { result, isNewUser: additionalInfo?.isNewUser };
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  // Sign up with email and password
  const signup = async (email, password) => {
    try {
      setAuthError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  // Log out
  const logout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.warn('Auth initialization timeout - forcing load completion');
    }, 5000); // 5 seconds timeout

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const value = {
    currentUser,
    login,
    loginWithGoogle,
    signup,
    logout,
    resetPassword,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 