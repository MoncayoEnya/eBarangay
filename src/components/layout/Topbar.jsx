import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Search, Bell, Settings, HelpCircle, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

import '../../styles/Topbar.css';

export default function Topbar({ setIsOpen }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [focus, setFocus] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (currentUser?.profile?.name) {
      const names = currentUser.profile.name.split(' ');
      return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'AU';
  };

  return (
    <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-gray-200 shadow-sm">
      <div className="flex items-center flex-1 max-w-2xl gap-4">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Box */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg transition-all ${
            focus
              ? 'bg-white border-2 border-blue-500 shadow-md'
              : 'bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <Search className={`w-4 h-4 transition-colors ${focus ? 'text-blue-600' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search residents, documents, incidents..."
            className="bg-transparent border-none outline-none flex-1 text-sm text-gray-700 placeholder:text-gray-400"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded shadow-sm">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Help Button */}
        <button 
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings Button */}
        <button 
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Notification Button */}
        <button className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            className="flex items-center gap-3 pl-2 pr-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center font-semibold text-sm shadow-sm">
              {getUserInitials()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900">
                {currentUser?.profile?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser?.profile?.role || 'Barangay Secretary'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              ></div>
              
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.profile?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {currentUser?.email || 'admin@barangay.com'}
                  </p>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span>Profile Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Account Settings</span>
                  </button>
                </div>
                
                {/* Logout */}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}