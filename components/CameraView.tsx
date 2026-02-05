import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Student } from '../types';
import { SpinnerIcon, SwitchCameraIcon } from './icons';
import { analyzeStudentPhoto, removeBackgroundImage } from '../utils/geminiUtils';
import CropModal from './CropModal';

interface CameraViewProps {
  student: Student;
  onClose: () => void;
  onSave: (studentId: number, photoDataUrl: string) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ student, onClose, onSave }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null);
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

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
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
  
  const processCroppedImage = async (croppedImageDataUrl: string) => {
    setOriginalImage(null);
    setCapturedImage(croppedImageDataUrl);
    setAnalysisFeedback(null);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeStudentPhoto(croppedImageDataUrl);
      setIsAnalyzing(false);
      if (!analysis.isGood) {
        setAnalysisFeedback(analysis.feedback);
        return;
      }
      setAnalysisFeedback('الصورة ممتازة! جاري إزالة الخلفية...');
      setIsProcessing(true);
      const processedImage = await removeBackgroundImage(croppedImageDataUrl);
      setCapturedImage(processedImage);
      setAnalysisFeedback(null);
    } catch (error) {
      console.error("Error during AI processing:", error);
      setAnalysisFeedback('حدث خطأ أثناء المعالجة، سيتم استخدام الصورة الأصلية.');
    } finally {
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setOriginalImage(null);
    setCapturedImage(null);
    setAnalysisFeedback(null);
  };
  
  const handleSave = async () => {
    if (capturedImage) {
      setIsSaving(true);
      await onSave(student.id, capturedImage);
      setIsSaving(false);
    }
  };

  const handleToggleCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  const isLevel = Math.abs(tilt) < 3;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center p-4">
      <div className="absolute top-4 right-4 text-white font-bold text-xl sm:text-2xl z-20">{student.name}</div>
      <div className="absolute top-12 right-4 text-white/80 text-sm sm:text-lg z-20 text-center max-w-[90vw]">
        {!capturedImage && !originalImage && <p>ضع الوجه داخل الإطار وحاذِ العينين مع الخط الأفقي</p>}
        <p className={isLevel ? 'text-green-400' : 'text-yellow-400'}>{isLevel ? 'الجهاز مستقيم' : 'حافظ على استقامة الجهاز'}</p>
      </div>

      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-gray-800 p-4 text-center">{error}</div>}
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${capturedImage || originalImage ? 'hidden' : 'block'}`} />
        {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />}
        <canvas ref={canvasRef} className="hidden" />

        {!capturedImage && !originalImage && stream && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5 h-4/5 text-white/40" viewBox="0 0 150 200" fill="none">
              <path d="M75 50 C 40 50, 20 70, 20 100 L 20 190 H 130 L 130 100 C 130 70, 110 50, 75 50 Z" stroke="currentColor" strokeWidth="4" strokeDasharray="8 6"/>
              <circle cx="75" cy="70" r="30" stroke="currentColor" strokeWidth="4" strokeDasharray="8 6" />
              <line x1="50" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="75" y1="55" x2="75" y2="100" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1">
              <div className={`absolute w-full h-px top-1/2 ${isLevel ? 'bg-green-500/80' : 'bg-white/50'}`}></div>
              <div className={`absolute w-full h-px top-1/2 transition-transform duration-100 ${isLevel ? 'bg-green-400' : 'bg-white'}`} style={{ transform: `rotate(${tilt}deg)`}}/>
            </div>
          </div>
        )}
        
        {!stream && !error && !capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
            <SpinnerIcon className="w-10 h-10" /><span className="ml-4 text-lg">جاري تشغيل الكاميرا...</span>
          </div>
        )}
        
        {(isAnalyzing || isProcessing) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-80 z-30 overflow-hidden">
            {isAnalyzing && <div className="absolute inset-0"><div className="scan-line" /></div>}
            <SpinnerIcon className="w-12 h-12" />
            <p className="mt-4 text-lg">{isAnalyzing ? 'جاري فحص جودة الصورة...' : 'جاري معالجة الخلفية...'}</p>
          </div>
        )}
        {analysisFeedback && !isAnalyzing && (
          <div className={`absolute bottom-4 right-4 left-4 ${analysisFeedback.startsWith('الصورة ممتازة') ? 'bg-green-800/80' : 'bg-red-800/80'} text-white p-3 rounded-lg z-30 text-center`}>
            <p className="font-bold">ملاحظة:</p>
            <p>{analysisFeedback}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-col items-center justify-center z-20 min-h-[6rem]">
        <div className="flex flex-wrap justify-center items-center gap-4">
          <button onClick={onClose} className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">إغلاق</button>
          {!capturedImage && !originalImage ? (
            <>
              <button onClick={handleToggleCamera} className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition disabled:bg-gray-500" disabled={!stream} title="تبديل الكاميرا" aria-label="تبديل الكاميرا"><SwitchCameraIcon className="w-6 h-6" /></button>
              <button onClick={handleCapture} disabled={!stream} className="px-6 sm:px-8 py-3 sm:py-4 bg-red-600 text-white rounded-full text-lg font-bold hover:bg-red-700 transition disabled:bg-gray-400 flex items-center justify-center min-w-[120px]">التقاط</button>
            </>
          ) : !originalImage ? (
            <>
              <button onClick={handleRetake} disabled={isAnalyzing || isProcessing || isSaving} className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:bg-gray-400">إعادة التصوير</button>
              <button onClick={handleSave} disabled={isSaving || isAnalyzing || isProcessing || (!!analysisFeedback && !analysisFeedback.startsWith('الصورة ممتازة'))} className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition disabled:bg-gray-400 flex items-center gap-2">
                {isSaving && <SpinnerIcon className="w-5 h-5"/>}
                {isSaving ? 'جاري الحفظ...' : 'حفظ الصورة'}
              </button>
            </>
          ) : null }
        </div>
      </div>
       {originalImage && (
        <CropModal imageSrc={originalImage} onConfirm={processCroppedImage} onCancel={handleRetake} />
      )}
    </div>
  );
};

export default CameraView;