import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Get user's initial or display name
  const getUserInitial = () => {
    if (!currentUser) return '';
    
    if (currentUser.displayName) {
      return currentUser.displayName.charAt(0).toUpperCase();
    }
    
    if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-gray-900/95 backdrop-blur-sm shadow-md' : 'bg-gray-900'
    } border-b border-gray-800`}>
      <div className="mx-auto px-6 lg:px-12 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="text-2xl font-bold text-white transition-transform duration-300 group-hover:scale-105">
                Entropy <span className="text-cyan-500">AI</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <div className="flex space-x-6">
              <NavLink 
                to="/review" 
                className={({ isActive }) => 
                  `text-gray-300 hover:text-white transition-colors duration-200 relative group ${
                    isActive ? 'text-white' : ''
                  }`
                }
              >
                <span>Review</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              <NavLink 
                to="/enhance" 
                className={({ isActive }) => 
                  `text-gray-300 hover:text-white transition-colors duration-200 relative group ${
                    isActive ? 'text-white' : ''
                  }`
                }
              >
                <span>Enhance</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              <NavLink 
                to="/snapshot" 
                className={({ isActive }) => 
                  `text-gray-300 hover:text-white transition-colors duration-200 relative group ${
                    isActive ? 'text-white' : ''
                  }`
                }
              >
                <span>Snapshot</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              <NavLink 
                to="/translate" 
                className={({ isActive }) => 
                  `text-gray-300 hover:text-white transition-colors duration-200 relative group ${
                    isActive ? 'text-white' : ''
                  }`
                }
              >
                <span>Translate</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
              </NavLink>
              {currentUser && (
                <NavLink 
                  to="/history" 
                  className={({ isActive }) => 
                    `text-gray-300 hover:text-white transition-colors duration-200 relative group ${
                      isActive ? 'text-white' : ''
                    }`
                  }
                >
                  <span>History</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
                </NavLink>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-expanded={profileDropdownOpen}
                  >
                    {getUserInitial()}
                  </button>
                  
                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm border-b border-gray-700">
                        <div className="font-medium text-white mb-1">
                          {currentUser.displayName || "User"}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          {currentUser.email}
                        </div>
                      </div>
                      {/* <Link 
                        to="/history" 
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Chat History
                      </Link> */}
                      <div className="flex justify-center px-4 py-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full text-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="primary" size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="h-6 w-6"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden transform transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-800">
          <NavLink 
            to="/review" 
            className={({ isActive }) => 
              `block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md ${
                isActive ? 'bg-gray-800 text-white' : ''
              }`
            }
            onClick={closeMenu}
          >
            Review
          </NavLink>
          <NavLink 
            to="/enhance" 
            className={({ isActive }) => 
              `block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md ${
                isActive ? 'bg-gray-800 text-white' : ''
              }`
            }
            onClick={closeMenu}
          >
            Enhance
          </NavLink>
          <NavLink 
            to="/snapshot" 
            className={({ isActive }) => 
              `block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md ${
                isActive ? 'bg-gray-800 text-white' : ''
              }`
            }
            onClick={closeMenu}
          >
            Snapshot
          </NavLink>
          <NavLink 
            to="/translate" 
            className={({ isActive }) => 
              `block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md ${
                isActive ? 'bg-gray-800 text-white' : ''
              }`
            }
            onClick={closeMenu}
          >
            Translate
          </NavLink>
          {currentUser && (
            <NavLink 
              to="/history" 
              className={({ isActive }) => 
                `block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md ${
                  isActive ? 'bg-gray-800 text-white' : ''
                }`
              }
              onClick={closeMenu}
            >
              History
            </NavLink>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-800">
          {currentUser ? (
            <div className="px-4 py-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-white">
                    {getUserInitial()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="px-2 space-y-2">
              <Link to="/login" onClick={closeMenu}>
                <Button variant="outline" fullWidth>Sign In</Button>
              </Link>
              <Link to="/signup" onClick={closeMenu}>
                <Button variant="primary" fullWidth>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 