import { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserChatHistory } from '../utils/firestoreService';

// Lazy load the ChatHistory component to improve initial load time
const ChatHistory = lazy(() => import('../components/ChatHistory'));

// Lightweight loading fallback
const HistoryLoader = () => (
  <div className="flex justify-center py-12">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
      <p className="text-gray-400">Loading your conversation history...</p>
    </div>
  </div>
);

const ChatHistoryPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [preloaded, setPreloaded] = useState(false);

  // Preload data before showing the component
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Preload initial history data in the background
    const preloadData = async () => {
      try {
        // Fetch a small batch of initial data to warm up the cache
        await getUserChatHistory(currentUser.uid, 5);
        setPreloaded(true);
      } catch (error) {
        console.warn('Error preloading history data:', error);
        // Still mark as preloaded even if it fails, so the UI continues
        setPreloaded(true);
      }
    };

    preloadData();
  }, [currentUser, navigate]);

  return (
    <div className="container mx-auto max-w-5xl py-12 px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mt-9 mb-3">Your Chat History</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Keep track of your code reviews, enhancements, and translations.
        </p>
      </div>

      <Suspense fallback={<HistoryLoader />}>
        <ChatHistory />
      </Suspense>
      
      <div className="mt-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Conversation History Features</h2>
          <p className="text-gray-400">Store and organize all your AI interactions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center p-4">
            <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Organized By Type</h3>
            <p className="text-gray-400 text-sm">
              Filter your history by review, enhance, or translate operations.
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Timestamped Entries</h3>
            <p className="text-gray-400 text-sm">
              Each conversation is saved with the exact date and time for easy reference.
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Full Context Preserved</h3>
            <p className="text-gray-400 text-sm">
              View both your original input and the AI's response for each entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryPage; 