import React, { useState } from 'react';
import { Menu, Search, Bell, Settings, HelpCircle, ChevronDown } from 'lucide-react';

export default function Topbar({ setIsOpen }) {
  const [focus, setFocus] = useState(false);

  return (
    <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-gray-200">
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
          className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all ${
            focus
              ? 'bg-white border-2 border-blue-500 shadow-sm'
              : 'bg-gray-50 border-2 border-gray-100'
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
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-lg">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Help Button */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings Button */}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* Notification Button */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-2"></div>

        {/* User Profile */}
        <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 hover:bg-gray-50 rounded-xl transition-colors group">
          <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-lg flex items-center justify-center font-semibold text-sm shadow-sm">
            AU
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Barangay Secretary</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </div>
    </header>
  );
}