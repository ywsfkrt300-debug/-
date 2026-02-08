import React, { useState } from 'react';
import type { SchoolClass } from './types';
import ClassManager from './components/ClassManager';
import StudentManager from './components/StudentManager';
import Header from './components/Header';
import { useTheme } from './hooks/useTheme';

const App: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [theme, toggleTheme] = useTheme();

  const handleBackToClasses = () => {
    setSelectedClass(null);
  };
  
  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col">
      <Header 
        className={selectedClass?.name} 
        onBack={selectedClass ? handleBackToClasses : undefined} 
        theme={theme}
        toggleTheme={toggleTheme}
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
    </div>
  );
};

export default App;