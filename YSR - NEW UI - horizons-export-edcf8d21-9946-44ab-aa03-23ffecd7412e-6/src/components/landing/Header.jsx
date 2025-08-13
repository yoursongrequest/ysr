
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = user ? (
    <>
      <Link to="/admin" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md flex items-center">
        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
      </Link>
      <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-red-400 hover:bg-gray-800 rounded-md flex items-center">
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md">Sign In</Link>
      <Link to="/signup" className="block mt-2">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">Sign Up</Button>
      </Link>
    </>
  );

  return (
    <header className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)' }}>
          YSR
        </Link>
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/admin">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 bg-gray-900/80 backdrop-blur-lg rounded-lg p-4 border border-gray-700"
          >
            <nav className="flex flex-col space-y-2">
              {menuItems}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
