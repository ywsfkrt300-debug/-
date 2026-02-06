import React, { useState, useEffect } from 'react';
import type { SchoolClass } from './types';
import ClassManager from './components/ClassManager';
import StudentManager from './components/StudentManager';
import Header from './components/Header';
import { preloadBackgroundRemover } from './utils/backgroundRemover';
import ApiKeyModal from './components/ApiKeyModal';
import { getApiKey } from './utils/apiKeyManager';

const App: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(getApiKey());

  useEffect(() => {
    // Preload the offline background remover model on app start
    // to ensure it's ready when needed without delay.
    preloadBackgroundRemover();
    
    // Check for API key on initial load
    const storedKey = getApiKey();
    setApiKey(storedKey);
    if (!storedKey) {
        setIsApiKeyModalOpen(true);
    }
  }, []);


  const handleBackToClasses = () => {
    setSelectedClass(null);
  };
  
  const handleCloseApiKeyModal = () => {
    setApiKey(getApiKey());
    setIsApiKeyModalOpen(false);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col">
      <Header 
        className={selectedClass?.name} 
        onBack={selectedClass ? handleBackToClasses : undefined} 
        onShowSettings={() => setIsApiKeyModalOpen(true)}
      />
      <main className="p-4 sm:p-6 md:p-8 flex-grow">
        {selectedClass ? (
          <StudentManager schoolClass={selectedClass} />
        ) : (
          <ClassManager onClassSelect={setSelectedClass} />
        )}
      </main>
      <footer className="text-center p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm text-sm text-gray-600 dark:text-gray-400">
        <p>صمم من اجل الاستاذ المحترم يوسف سباهي</p>
        <p>النسخة حصرية لمدرسة الهدى ح٢</p>
        <p>&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
       <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={handleCloseApiKeyModal}
        initialKey={apiKey || ''}
      />
    </div>
  );
};

export default App;
