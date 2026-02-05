import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '../utils/imageUtils';
import { SpinnerIcon } from './icons';

interface CropModalProps {
  imageSrc: string;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (croppedAreaPixels) {
      setIsCropping(true);
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        onConfirm(croppedImage);
      } catch (e) {
        console.error(e);
      } finally {
        setIsCropping(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex flex-col items-center justify-center p-4">
      <div className="relative w-full h-4/6 max-w-4xl">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="w-full max-w-sm p-4">
        <label htmlFor="zoom-slider" className="block mb-2 text-sm font-medium text-white">تكبير/تصغير</label>
        <input
          id="zoom-slider"
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <button onClick={onCancel} className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">إلغاء</button>
        <button 
          onClick={handleCrop} 
          disabled={isCropping}
          className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition disabled:bg-gray-400 flex items-center gap-2"
        >
          {isCropping && <SpinnerIcon className="w-5 h-5"/>}
          {isCropping ? 'جاري القص...' : 'تأكيد القص'}
        </button>
      </div>
    </div>
  );
};

export default CropModal;