/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChefHat, Heart, LogIn, LogOut, MessageCircle, PlusCircle } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { auth, signInWithGoogle } from '../lib/firebase';
import { motion } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onLoginClick }) => {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setActiveTab('explore')}
      >
        <div className="p-2 bg-orange-500 rounded-lg text-white">
          <ChefHat size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-800 hidden sm:block">Recipe Haven</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-4">
        <NavButton 
          active={activeTab === 'explore'} 
          onClick={() => setActiveTab('explore')}
          icon={<ChefHat size={20} />}
          label="Explore"
        />
        {user && (
          <>
            <NavButton 
              active={activeTab === 'favorites'} 
              onClick={() => setActiveTab('favorites')}
              icon={<Heart size={20} />}
              label="Favorites"
            />
            <NavButton 
              active={activeTab === 'create'} 
              onClick={() => setActiveTab('create')}
              icon={<PlusCircle size={20} />}
              label="Add"
            />
          </>
        )}
        <NavButton 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')}
          icon={<MessageCircle size={20} />}
          label="Community"
        />
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-orange-100 shadow-sm"
            />
            <button 
              onClick={() => auth.signOut()}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full font-medium shadow-md shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95"
          >
            <LogIn size={18} />
            <span>Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        active ? 'text-orange-600 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="hidden md:block text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </button>
  );
};
