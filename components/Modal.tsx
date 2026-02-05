
import React from 'react';
import { SpinnerIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm"
      onClick={!isLoading ? onClose : undefined}
    >
      <div 
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          <button 
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 relative">
          {children}
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex items-center justify-center rounded-b-lg -m-6 mt-0">
                <SpinnerIcon className="w-8 h-8 text-teal-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;