import React, { useState } from 'react';
import { supabase } from '../supabase';
import { SpinnerIcon } from './icons';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setMessage('الرجاء إدخال عنوان بريد إلكتروني صالح.');
        setLoading(false);
        return;
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setMessage('تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني. يرجى التحقق منه!');
    } catch (error: any) {
        console.error('Error logging in:', error);
        let userMessage = 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';
        if (typeof error.message === 'string') {
            if (error.message.toLowerCase().includes('rate limit')) {
                userMessage = 'لقد حاولت تسجيل الدخول عدة مرات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.';
            } else if (error.message.toLowerCase().includes('check your email')) {
                userMessage = 'تم إرسال رابط بالفعل. يرجى التحقق من بريدك الإلكتروني أو الانتظار قبل طلب رابط جديد.';
            }
        }
        setMessage(userMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">مرحباً بك في صوّرني</h1>
        <p className="mt-2 text-gray-600">
            سجل الدخول للمتابعة
        </p>
      </div>
      <form onSubmit={handleLogin} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            البريد الإلكتروني
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400"
          >
            {loading ? <SpinnerIcon className="w-5 h-5"/> : 'إرسال رابط تسجيل الدخول'}
          </button>
        </div>
      </form>
       {message && (
        <div className={`mt-4 text-center p-3 rounded-md text-sm ${message.startsWith('فشل') || message.includes('صالح') || message.includes('الانتظار') || message.includes('بالفعل') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
        </div>
      )}
    </div>
  );
};

export default Auth;