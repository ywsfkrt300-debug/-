
import React from 'react';
import { BackArrowIcon } from './icons';

interface HeaderProps {
  className?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ className, onBack }) => {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 shadow-md sticky top-0 z-10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">صوّرني</h1>
            {className && (
              <>
                <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>
                <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">{className}</span>
              </>
            )}
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-i-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-teal-300 dark:hover:bg-gray-600 transition"
            >
              <BackArrowIcon className="w-5 h-5" />
              <span>العودة للشُعب</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;