import React, { useState, useEffect } from 'react';
import type { SchoolClass } from './types';
import ClassManager from './components/ClassManager';
import StudentManager from './components/StudentManager';
import Header from './components/Header';
import Auth from './components/Auth';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { preloadBackgroundRemover } from './utils/backgroundRemover';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    preloadBackgroundRemover();
    
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
          setSelectedClass(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleBackToClasses = () => {
    setSelectedClass(null);
  };
  
  if (loading) {
      return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col">
      <Header 
        session={session}
        className={selectedClass?.name} 
        onBack={selectedClass && session ? handleBackToClasses : undefined} 
      />
      <main className="p-4 sm:p-6 md:p-8 flex-grow">
        {!session ? (
          <Auth />
        ) : selectedClass ? (
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