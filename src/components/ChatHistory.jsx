import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserChatHistory, 
  deleteChatHistoryEntry, 
  batchDeleteChatHistory,
  goOnline 
} from '../utils/firestoreService';
import Card from './ui/Card';
import Button from './ui/Button';
import CodeEditor from './CodeEditor';

const ITEMS_PER_PAGE = 10;

const ChatHistory = () => {
  const [allChatHistory, setAllChatHistory] = useState([]); // Store all chat history
  const [chatHistory, setChatHistory] = useState([]); // Filtered chat history to display
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { currentUser } = useAuth();
  const observer = useRef();
  const loadingRef = useRef(null);
  
  // Cached filtered results to avoid re-filtering on every render
  const filteredResultsRef = useRef({
    all: null,
    review: null,
    enhance: null,
    translate: null,
  });

  // Fetch all chat history first
  const fetchChatHistory = useCallback(async (reset = false) => {
    if (!currentUser) {
      setAllChatHistory([]);
      setChatHistory([]);
      setLoading(false);
      setHasMore(false);
      return;
    }
    
    try {
      if (reset) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      // Try to ensure we're online before fetching
      try {
        await goOnline();
      } catch (e) {
        console.warn('Failed to ensure online state:', e);
      }
      
      const currentItems = reset ? [] : allChatHistory;
      
      // Always fetch all chat history, but increase the limit each time
      const newHistory = await getUserChatHistory(
        currentUser.uid, 
        reset ? Math.max(50, ITEMS_PER_PAGE * 2) : currentItems.length + ITEMS_PER_PAGE
      );
      
      // Check if we have more items to load
      setHasMore(newHistory.length > currentItems.length);
      
      // Update the complete chat history
      setAllChatHistory(newHistory);
      
      // Reset all cached filtered results
      filteredResultsRef.current = {
        all: newHistory,
        review: null,
        enhance: null,
        translate: null
      };
      
      // Apply the current filter
      applyFilter(activeFilter, newHistory);
      
    } catch (error) {
      console.error('Error fetching chat history:', error);
      
      // Set specific message for network errors
      if (error.code === 'failed-precondition' || error.code === 'unavailable' || 
          error.message?.includes('network') || !navigator.onLine) {
        setError('Network connection issue. Please check your internet connection.');
      } else {
        setError('Failed to load chat history. Please try again.');
      }
      
      // If we have some data already and this isn't a reset, keep showing it
      if (!reset && allChatHistory.length > 0) {
        // We'll keep the existing data visible
      } else if (reset) {
        // For a reset operation, show an empty state
        setAllChatHistory([]);
        setChatHistory([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setFilterLoading(false);
    }
  }, [currentUser, activeFilter, allChatHistory]);

  // Apply client-side filtering
  const applyFilter = useCallback((filter, sourceData = null) => {
    setFilterLoading(true);
    
    // Use provided source data or current all chat history
    const data = sourceData || allChatHistory;
    
    // Check if we already have this filter cached
    if (filteredResultsRef.current[filter]) {
      setChatHistory(filteredResultsRef.current[filter]);
      setFilterLoading(false);
      return;
    }
    
    // Apply filter client-side
    let filtered;
    if (filter === 'all') {
      filtered = data;
    } else {
      filtered = data.filter(item => item.type === filter);
    }
    
    // Cache the filtered results
    filteredResultsRef.current[filter] = filtered;
    
    // Update state
    setChatHistory(filtered);
    setFilterLoading(false);
  }, [allChatHistory]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    if (filter === activeFilter) return;
    
    setActiveFilter(filter);
    applyFilter(filter);
    
    // Reset selection when changing filters
    setSelectedItems([]);
  };

  // Initial data fetch
  useEffect(() => {
    fetchChatHistory(true);
  }, [fetchChatHistory, currentUser]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (error) {
        // When we go back online and there was an error, try to fetch again
        fetchChatHistory(true);
      }
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [error, fetchChatHistory]);

  // Handle infinite scrolling
  useEffect(() => {
    if (loading || !hasMore) return;
    
    const handleObserver = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) {
        fetchChatHistory(false);
      }
    };
    
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };
    
    observer.current = new IntersectionObserver(handleObserver, options);
    
    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore, fetchChatHistory, loadingMore]);

  // Handle single item deletion
  const handleDelete = async (chatId) => {
    try {
      await deleteChatHistoryEntry(chatId, currentUser.uid);
      
      // Remove from all cached data
      const newAllHistory = allChatHistory.filter(chat => chat.id !== chatId);
      setAllChatHistory(newAllHistory);
      
      // Update each filter cache
      Object.keys(filteredResultsRef.current).forEach(key => {
        if (filteredResultsRef.current[key]) {
          filteredResultsRef.current[key] = filteredResultsRef.current[key].filter(
            chat => chat.id !== chatId
          );
        }
      });
      
      // Update current display
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
    } catch (error) {
      console.error('Error deleting chat history entry:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  // Handle bulk selection
  const toggleSelection = (chatId) => {
    if (selectedItems.includes(chatId)) {
      setSelectedItems(selectedItems.filter(id => id !== chatId));
    } else {
      setSelectedItems([...selectedItems, chatId]);
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setLoading(true);
      await batchDeleteChatHistory(selectedItems, currentUser.uid);
      
      // Update all chat history
      const newAllHistory = allChatHistory.filter(chat => !selectedItems.includes(chat.id));
      setAllChatHistory(newAllHistory);
      
      // Update filter caches
      Object.keys(filteredResultsRef.current).forEach(key => {
        if (filteredResultsRef.current[key]) {
          filteredResultsRef.current[key] = filteredResultsRef.current[key].filter(
            chat => !selectedItems.includes(chat.id)
          );
        }
      });
      
      // Update current display
      setChatHistory(prev => prev.filter(chat => !selectedItems.includes(chat.id)));
      
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting multiple chat history entries:', error);
      setError('Failed to delete selected items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to readable date with memoization
  const formatDateCache = new Map();
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    // Check cache first
    const cacheKey = timestamp.toString();
    if (formatDateCache.has(cacheKey)) {
      return formatDateCache.get(cacheKey);
    }
    
    const date = new Date(timestamp);
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
    
    // Store in cache
    formatDateCache.set(cacheKey, formatted);
    return formatted;
  };

  // Toggle modal with conversation details
  const toggleConversationModal = (conversation = null) => {
    setSelectedConversation(conversation);
    setModalOpen(conversation !== null);
  };

  // Function to determine language for code highlighting
  const getLanguageFromContent = (content) => {
    if (!content) return 'plaintext';
    
    // Simple heuristic to detect language based on content
    if (content.includes('def ') && content.includes(':')) return 'python';
    if (content.includes('function') && content.includes('{')) return 'javascript';
    if (content.includes('class') && content.includes('public static void')) return 'java';
    if (content.includes('import') && content.includes(';')) return 'typescript';
    
    // Default language
    return 'plaintext';
  };

  // Show sign-in prompt for non-authenticated users
  if (!currentUser) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4 text-cyan-400 text-4xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Sign In to View Your History</h3>
        <p className="text-gray-400 mb-4">
          Log in to view and manage your conversation history.
        </p>
        <Link to="/login" className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">
          Sign In
        </Link>
      </Card>
    );
  }

  // Get filter statistics
  const getFilterStats = useCallback(() => {
    if (!allChatHistory.length) return {};
    
    const stats = {
      all: allChatHistory.length,
      review: 0,
      enhance: 0,
      translate: 0
    };
    
    allChatHistory.forEach(item => {
      if (stats[item.type] !== undefined) {
        stats[item.type]++;
      }
    });
    
    return stats;
  }, [allChatHistory]);
  
  const filterStats = getFilterStats();

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Your Conversation History</h2>
        
        <div className="flex flex-wrap gap-2 relative">
          <button 
            className={`px-3 py-1 rounded-full text-sm transition-colors ${activeFilter === 'all' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('all')}
            disabled={filterLoading}
          >
            All <span className="text-xs opacity-70 ml-1">({filterStats.all || 0})</span>
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm transition-colors ${activeFilter === 'review' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('review')}
            disabled={filterLoading}
          >
            Review <span className="text-xs opacity-70 ml-1">({filterStats.review || 0})</span>
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm transition-colors ${activeFilter === 'translate' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            onClick={() => handleFilterChange('translate')}
            disabled={filterLoading}
          >
            Translate <span className="text-xs opacity-70 ml-1">({filterStats.translate || 0})</span>
          </button>
          
          {filterLoading && (
            <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => fetchChatHistory(true)}
            className="mt-2 text-sm text-cyan-500 hover:text-cyan-400"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bulk action controls */}
      {selectedItems.length > 0 && (
        <div className="bg-gray-800 p-3 rounded-md mb-4 flex items-center justify-between">
          <span className="text-gray-300">
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setSelectedItems([])}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Conversation items */}
      {loading && chatHistory.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : chatHistory.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">
            {activeFilter === 'all' ? 'No Conversations Yet' : `No ${activeFilter} Conversations`}
          </h3>
          <p className="text-gray-400 mb-4">
            {activeFilter === 'all' 
              ? 'Start using our review, enhance, or translate features to build your history.'
              : `You haven't used the ${activeFilter} feature yet. Try it out!`}
          </p>
        </Card>
      ) : (
        <div className="transition-opacity duration-200 ease-in-out" style={{ opacity: filterLoading ? 0.7 : 1 }}>
          <div className="space-y-4">
            {chatHistory.map((chat) => (
              <Card key={chat.id} className={`p-4 transition-colors ${selectedItems.includes(chat.id) ? 'bg-gray-800 border-cyan-500' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(chat.id)}
                      onChange={() => toggleSelection(chat.id)}
                      className="mr-3 h-4 w-4 text-cyan-600 bg-gray-800 border-gray-700 rounded focus:ring-cyan-500 focus:ring-offset-gray-900"
                    />
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        chat.type === 'review' ? 'bg-blue-900/50 text-blue-400' :
                        chat.type === 'enhance' ? 'bg-purple-900/50 text-purple-400' : 
                        'bg-green-900/50 text-green-400'
                      }`}>
                        {chat.type.charAt(0).toUpperCase() + chat.type.slice(1)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{formatDate(chat.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleConversationModal(chat)}
                      className="text-cyan-500 hover:text-cyan-400 transition-colors"
                      aria-label="View Conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(chat.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                      aria-label="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="text-sm mb-3 mt-2">
                  <h4 className="font-medium text-gray-300 mb-1">Your Input:</h4>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <p className="text-gray-300 whitespace-pre-wrap line-clamp-2">
                      {chat.content}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <h4 className="font-medium text-gray-300 mb-1">AI Response:</h4>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <p className="text-gray-300 whitespace-pre-wrap line-clamp-2">
                      {chat.response}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleConversationModal(chat)}
                    className="text-sm"
                  >
                    View Conversation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Loading indicator for infinite scroll */}
          {(loadingMore || hasMore) && (
            <div 
              ref={loadingRef} 
              className="flex justify-center py-8"
            >
              {loadingMore ? (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              ) : (
                <div className="h-8 w-8"></div> // Placeholder for observer
              )}
            </div>
          )}
        </div>
      )}

      {/* Conversation View Modal */}
      {modalOpen && selectedConversation && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Conversation Details</h3>
                <p className="text-gray-400 text-sm">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full mr-2 ${
                    selectedConversation.type === 'review' ? 'bg-blue-900/50 text-blue-400' :
                    selectedConversation.type === 'enhance' ? 'bg-purple-900/50 text-purple-400' : 
                    'bg-green-900/50 text-green-400'
                  }`}>
                    {selectedConversation.type.charAt(0).toUpperCase() + selectedConversation.type.slice(1)}
                  </span>
                  {formatDate(selectedConversation.timestamp)}
                </p>
              </div>
              <button 
                onClick={() => toggleConversationModal()}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-3">Your Input:</h4>
                <Card className="bg-gray-800 overflow-hidden">
                  <div className="h-auto max-h-[300px] overflow-auto">
                    <CodeEditor
                      value={selectedConversation.content || ''}
                      language={getLanguageFromContent(selectedConversation.content)}
                      readOnly={true}
                      showCopyButton={true}
                      minHeight="100px"
                    />
                  </div>
                </Card>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-3">AI Response:</h4>
                <Card className="bg-gray-800 overflow-hidden">
                  <div className="h-auto max-h-[300px] overflow-auto">
                    <CodeEditor
                      value={selectedConversation.response || ''}
                      language={getLanguageFromContent(selectedConversation.response)}
                      readOnly={true}
                      showCopyButton={true}
                      minHeight="100px"
                    />
                  </div>
                </Card>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => toggleConversationModal()}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory; 