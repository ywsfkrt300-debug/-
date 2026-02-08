import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import type { SchoolClass } from './types';
import ClassManager from './components/ClassManager';
import StudentManager from './components/StudentManager';
import Header from './components/Header';
import Auth from './components/Auth';
import { SpinnerIcon } from './components/icons';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleBackToClasses = () => {
    setSelectedClass(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSelectedClass(null); // Reset state on sign out
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
        <SpinnerIcon className="w-12 h-12 text-teal-600" />
        <p className="mt-4 text-lg text-gray-700 drop-shadow">جاري التحميل...</p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col">
      <Header 
        className={selectedClass?.name} 
        onBack={selectedClass ? handleBackToClasses : undefined} 
        onSignOut={handleSignOut}
        userEmail={session.user.email}
      />
      <main className="p-4 sm:p-6 md:p-8 flex-grow">
        {selectedClass ? (
          <StudentManager schoolClass={selectedClass} />
        ) : (
          <ClassManager onClassSelect={setSelectedClass} />
        )}
      </main>
      <footer className="text-center p-4 bg-white/60 backdrop-blur-sm text-sm text-gray-600">
        <p>صمم من اجل الاستاذ المحترم يوسف سباهي</p>
        <p>النسخة حصرية لمدرسة الهدى ح٢</p>
        <p>&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default App;
