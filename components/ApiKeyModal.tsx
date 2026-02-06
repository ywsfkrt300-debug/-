import React, { useState } from 'react';
import Modal from './Modal';
import { saveApiKey } from '../utils/apiKeyManager';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, initialKey }) => {
  const [apiKey, setApiKey] = useState(initialKey || '');

  const handleSave = () => {
    if (!apiKey.trim()) return;
    saveApiKey(apiKey);
    // Reload the page to apply the new API key everywhere
    window.location.reload();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إعداد مفتاح Gemini API">
      <div className="space-y-4 text-gray-700 dark:text-gray-300">
        <p>
          لاستخدام ميزات الذكاء الاصطناعي (فحص الصور وإزالة الخلفية)، يجب توفير مفتاح Google Gemini API الخاص بك.
        </p>
        <div className="bg-yellow-100 dark:bg-yellow-900/50 border-r-4 border-yellow-500 p-3 rounded-md">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">هام:</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                قد يتطلب استخدام Gemini API تفعيل الفوترة في حساب Google Cloud الخاص بك.
            </p>
        </div>
        <p>
          يمكنك الحصول على مفتاح من{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">
            Google AI Studio
          </a>.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="أدخل مفتاح API هنا"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
        >
          <span>حفظ وإعادة تحميل التطبيق</span>
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          سيتم تخزين المفتاح بأمان في متصفحك فقط.
        </p>
      </div>
    </Modal>
  );
};

export default ApiKeyModal;
