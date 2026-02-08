// This file uses the MediaPipe SelfieSegmentation library, which is loaded via a script tag in index.html.
// We declare the global variable here to satisfy TypeScript.
declare const SelfieSegmentation: any;

/**
 * Removes the background from an image data URL and replaces it with a solid color background.
 * This function works entirely on the client-side, offline.
 * It creates a new segmenter instance for each call to prevent state corruption from concurrent requests.
 * @param imageDataUrl The base64 data URL of the image to process.
 * @param backgroundColor The hex code of the color to use for the background.
 * @returns A promise that resolves with the new image data URL with the specified background color.
 */
export const removeBackgroundOffline = (imageDataUrl: string, backgroundColor: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Create a new instance for each operation to ensure isolation and prevent race conditions.
        const segmenter = new SelfieSegmentation({
            locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
        });

        segmenter.setOptions({
            modelSelection: 1, // Optimized for landscape photos.
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            segmenter.close(); // Clean up resources
            return reject(new Error('Could not get canvas context'));
        }
        
        const image = new Image();
        image.onload = async () => {
            canvas.width = image.width;
            canvas.height = image.height;
            
            segmenter.onResults((results: any) => {
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'source-in';
                ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'source-atop';
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
                ctx.restore();
                
                // IMPORTANT: Close the segmenter to free up WebAssembly memory and resources.
                segmenter.close();
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            });
            
            try {
                await segmenter.send({ image: image });
            } catch (error) {
                segmenter.close(); // Clean up on error
                reject(error);
            }
        };
        
        image.onerror = (err) => {
            segmenter.close(); // Clean up on error
            reject(err);
        };
        image.src = imageDataUrl;
    });
};