import type { Student } from '../types';

/**
 * Creates a cropped image from a source image and crop pixel data.
 * @param imageSrc The base64 data URL of the source image.
 * @param pixelCrop The crop data (x, y, width, height).
 * @returns A promise that resolves with the cropped image as a base64 data URL.
 */
export const getCroppedImg = (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number; }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous"; // Important for loading images from Supabase Storage
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = (error) => reject(error);
  });
};

/**
 * Adds a name to an image.
 * @param imageDataUrl The base64 data URL of the image.
 * @param name The name to add to the image.
 * @returns A promise that resolves with the new image data URL.
 */
export const addNameToImage = (imageDataUrl: string, name: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(24, Math.round(img.height / 20));
      ctx.font = `bold ${fontSize}px Cairo`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const textPadding = fontSize / 2;
      const textMetrics = ctx.measureText(name);
      const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      const rectHeight = textHeight + textPadding;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, canvas.height - rectHeight - textPadding, canvas.width, rectHeight + textPadding);

      ctx.fillStyle = 'white';
      ctx.fillText(name, canvas.width / 2, canvas.height - textPadding);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

/**
 * Creates a zip file of student photos and triggers a download.
 * @param students The list of students with photos.
 * @param withNames Whether to add names to the photos.
 * @param className The name of the class for the zip file.
 */
export const downloadImagesAsZip = async (students: Student[], withNames: boolean, className: string): Promise<void> => {
  const zip = new window.JSZip();
  const folderName = withNames ? `${className} - بالأسماء` : `${className} - بدون أسماء`;
  const folder = zip.folder(folderName);
  if (!folder) return;

  for (const student of students.filter(s => s.photo_url)) {
    try {
      const response = await fetch(student.photo_url!);
      const blob = await response.blob();
      
      let imageToAdd = blob;
      if (withNames) {
        const dataUrl = await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        const namedImage = await addNameToImage(dataUrl, student.name);
        const res = await fetch(namedImage);
        imageToAdd = await res.blob();
      }
      folder.file(`${student.name}.jpg`, imageToAdd);
    } catch (error) {
      console.error(`Failed to process image for ${student.name}:`, error);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${folderName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Converts a base64 data URL to a File object.
 * @param dataurl The base64 data URL.
 * @param filename The desired filename for the new File object.
 * @returns A File object.
 */
export function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
}