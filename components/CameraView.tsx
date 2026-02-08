import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Student } from '../types';
import { SpinnerIcon, SwitchCameraIcon } from './icons';
import { replaceBackgroundWithWhite } from '../utils/backgroundRemover';
import CropModal from './CropModal';

interface CameraViewProps {
  student: Student;
  onClose: () => void;
  onSave: (studentId: number, photoDataUrl: string) => Promise<void>;
}

const CameraView: React.FC<CameraViewProps> = ({ student, onClose, onSave }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shutterSoundRef = useRef<HTMLAudioElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null); // From camera, for cropping
  const [imageForProcessing, setImageForProcessing] = useState<string | null>(null); // After cropping
  const [finalImage, setFinalImage] = useState<string | null>(null); // Final result for display/save
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFeedback, setProcessingFeedback] = useState<string | null>(null);
  const [tilt, setTilt] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      handleRetake();
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(`لا يمكن الوصول للكاميرا (${mode === 'environment' ? 'الخلفية' : 'الأمامية'}).`);
      }
  }, [stream]);
  
  useEffect(() => {
    shutterSoundRef.current = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAIV1RYWlhAAAAAAAASW5mbwAAAA8AAABBAAAAAAAAAABoamgAAAAAAP//uQxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAMIghAABp4Q0AqGgAAABNjb250ZW50X3R5cGUAYmFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbQBkYXRhX3NvdXJjZQBzcmVjb3JkZWQ6c291cmNlAG1ldGFkYXRhX2V4cG9ydF92ZXJzaW9uATESAAAAAAAAAAAA//uQxAADASEBCAFqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq-');
    shutterSoundRef.current.volume = 0.6;

    startCamera(facingMode);
    const handleOrientation = (event: DeviceOrientationEvent) => setTilt(event.gamma ?? 0);
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [facingMode]);

  useEffect(() => {
    if (!imageForProcessing) return;

    const process = async () => {
      setIsProcessing(true);
      setProcessingFeedback('جاري معالجة الخلفية...');
      let hasError = false;

      try {
        const processedImage = await replaceBackgroundWithWhite(imageForProcessing);
        setFinalImage(processedImage);
      } catch (error: any) {
        hasError = true;
        console.error("Error during background processing:", error);
        setFinalImage(imageForProcessing); // Fallback to cropped image
        setProcessingFeedback(`فشل معالجة الخلفية: ${error.message}. سيتم استخدام الصورة المقصوصة.`);
      } finally {
        setIsProcessing(false);
        if (!hasError) {
            setProcessingFeedback(null);
        }
      }
    };

    process();

  }, [imageForProcessing]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      if (shutterSoundRef.current) {
        shutterSoundRef.current.currentTime = 0;
        shutterSoundRef.current.play();
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setOriginalImage(imageDataUrl);
      }
    }
  };
  
  const handleCropConfirm = async (croppedImageDataUrl: string) => {
    setOriginalImage(null);
    setImageForProcessing(croppedImageDataUrl);
  };

  const handleRetake = () => {
    setOriginalImage(null);
    setImageForProcessing(null);
    setFinalImage(null);
    setProcessingFeedback(null);
  };
  
  const handleSave = async () => {
    if (finalImage) {
      setIsSaving(true);
      await onSave(student.id, finalImage);
      setIsSaving(false);
    }
  };

  const handleToggleCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  const isLevel = Math.abs(tilt) < 3;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center p-4">
      <div className="absolute top-4 right-4 text-white font-bold text-xl sm:text-2xl z-20">{student.name}</div>
      <div className="absolute top-12 right-4 text-white/80 text-sm sm:text-lg z-20 text-center max-w-[90vw]">
        {!finalImage && !originalImage && <p>ضع الوجه داخل الإطار وحاذِ العينين مع الخط الأفقي</p>}
        <p className={isLevel ? 'text-green-400' : 'text-yellow-400'}>{isLevel ? 'الجهاز مستقيم' : 'حافظ على استقامة الجهاز'}</p>
      </div>

      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-gray-800 p-4 text-center">{error}</div>}
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${finalImage || originalImage ? 'hidden' : 'block'}`} />
        {finalImage && <img src={finalImage} alt="Captured" className="w-full h-full object-contain" />}
        <canvas ref={canvasRef} className="hidden" />

        {!finalImage && !originalImage && stream && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34%] h-4/5 text-white/40" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 20 400 L 20 300 C 20 250, 70 200, 90 170 C 60 120, 100 20, 150 20 C 200 20, 240 120, 210 170 C 230 200, 280 250, 280 300 L 280 400" stroke="currentColor" strokeWidth="4" strokeDasharray="10 8"/>
                <line x1="80" y1="120" x2="220" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5"/>
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1">
              <div className={`absolute w-full h-px top-1/2 ${isLevel ? 'bg-green-500/80' : 'bg-white/50'}`}></div>
              <div className={`absolute w-full h-px top-1/2 transition-transform duration-100 ${isLevel ? 'bg-green-400' : 'bg-white'}`} style={{ transform: `rotate(${tilt}deg)`}}/>
            </div>
          </div>
        )}
        
        {!stream && !error && !finalImage && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
            <SpinnerIcon className="w-10 h-10" /><span className="ml-4 text-lg">جاري تشغيل الكاميرا...</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-80 z-30 overflow-hidden">
            <SpinnerIcon className="w-12 h-12" />
            <p className="mt-4 text-lg">{processingFeedback || 'جاري معالجة الخلفية...'}</p>
          </div>
        )}
         {processingFeedback && !isProcessing && (
          <div className={`absolute bottom-4 right-4 left-4 bg-yellow-800/80 text-white p-3 rounded-lg z-30 text-center`}>
            <p>{processingFeedback}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-col items-center justify-center z-20">
        <div className="flex flex-wrap justify-center items-center gap-4 min-h-[4rem]">
          <button onClick={onClose} className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">إغلاق</button>
          {!imageForProcessing && !originalImage ? (
            <>
              <button onClick={handleToggleCamera} className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition disabled:bg-gray-500" title="تبديل الكاميرا" aria-label="تبديل الكاميرا"><SwitchCameraIcon className="w-6 h-6" /></button>
              <button onClick={handleCapture} disabled={!stream} className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white rounded-full text-lg font-bold hover:bg-red-700 transition disabled:bg-gray-400 flex items-center justify-center min-w-[120px]">التقاط</button>
            </>
          ) : !originalImage ? (
            <>
              <button onClick={handleRetake} disabled={isProcessing || isSaving} className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:bg-gray-400">إعادة التصوير</button>
              <button onClick={handleSave} disabled={isSaving || isProcessing || !finalImage} className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition disabled:bg-gray-400 flex items-center gap-2">
                {isSaving && <SpinnerIcon className="w-5 h-5"/>}
                {isSaving ? 'جاري الحفظ...' : 'حفظ الصورة'}
              </button>
            </>
          ) : null }
        </div>
      </div>
       {originalImage && (
        <CropModal imageSrc={originalImage} onConfirm={handleCropConfirm} onCancel={handleRetake} />
      )}
    </div>
  );
};

export default CameraView;