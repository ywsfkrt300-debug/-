// This file uses the MediaPipe SelfieSegmentation library, which is loaded via a script tag in index.html.
// We declare the global variable here to satisfy TypeScript.
declare const SelfieSegmentation: any;

let segmenter: any = null;

/**
 * Gets the singleton instance of the SelfieSegmentation model.
 * Initializes it on the first call.
 */
const getSegmenter = () => {
    // Singleton pattern: if segmenter is already initialized, return it.
    if (!segmenter) {
        segmenter = new SelfieSegmentation({
            locateFile: (file: string) => {
                // Point to the CDN where the model files are located.
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
        });

        // Configure the segmenter for landscape images, which is common for cameras.
        // modelSelection: 1 is optimized for landscape.
        segmenter.setOptions({
            modelSelection: 1,
        });
    }
    return segmenter;
};

/**
 * Preloads the model and its dependencies by initializing the segmenter ahead of time.
 * Call this early in the app lifecycle to avoid delays during image processing.
 */
export const preloadBackgroundRemover = () => {
    getSegmenter();
};


/**
 * Removes the background from an image data URL and replaces it with a solid white background.
 * This function works entirely on the client-side, offline.
 * @param imageDataUrl The base64 data URL of the image to process.
 * @returns A promise that resolves with the new image data URL with a white background.
 */
export const removeBackgroundOffline = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Ensure the segmenter is initialized before use.
        const currentSegmenter = getSegmenter();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }
        
        const image = new Image();
        image.onload = async () => {
            canvas.width = image.width;
            canvas.height = image.height;
            
            // Set up the callback for when the segmentation is complete.
            currentSegmenter.onResults((results: any) => {
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 1. Fill the entire canvas with a solid white background.
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Draw the segmentation mask (the person) onto the canvas.
                // This mask defines where the original image will be drawn.
                ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

                // 3. Change the composite operation. 'source-in' means the new drawing
                // will only be visible where it overlaps with the existing content (the mask).
                ctx.globalCompositeOperation = 'source-in';
                
                // 4. Draw the original image. It will only appear where the mask was drawn.
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
                
                // Restore the context to its original state.
                ctx.restore();
                
                // Resolve the promise with the new image as a JPEG data URL.
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            });
            
            try {
                // Send the image to the segmenter to start processing.
                await currentSegmenter.send({ image: image });
            } catch (error) {
                reject(error);
            }
        };
        
        image.onerror = (err) => reject(err);
        image.src = imageDataUrl;
    });
};
