// Since this is loaded via script tag in index.html, we declare it for TypeScript
declare const SelfieSegmentation: any;

let segmentation: any = null;

/**
 * Initializes the MediaPipe SelfieSegmentation model.
 * This is called automatically by the processing function.
 */
const initializeModel = async () => {
    if (segmentation) return;

    segmentation = new SelfieSegmentation({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });

    // Model 0 is faster, Model 1 is more accurate. For portraits, 1 is better.
    segmentation.setOptions({
        modelSelection: 1,
    });

    await segmentation.initialize();
};

/**
 * Replaces the background of an image with white using MediaPipe Selfie Segmentation.
 * This is an offline operation that runs in the browser.
 * @param imageDataUrl The base64 data URL of the image to process.
 * @returns A promise that resolves with the new image data URL with a white background.
 */
export const replaceBackgroundWithWhite = async (imageDataUrl: string): Promise<string> => {
    // Ensure the model is loaded before proceeding
    await initializeModel();

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
            // The onResults callback needs to be set before calling send()
            segmentation.onResults((results: any) => {
                if (!results.segmentationMask) {
                    return reject(new Error('Failed to get segmentation mask.'));
                }

                // Temporary canvas to isolate the person
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = image.width;
                tempCanvas.height = image.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) return reject(new Error('Could not get temp canvas context.'));

                tempCtx.drawImage(results.segmentationMask, 0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.drawImage(results.image, 0, 0, tempCanvas.width, tempCanvas.height);

                // Final canvas to add the white background
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = image.width;
                finalCanvas.height = image.height;
                const finalCtx = finalCanvas.getContext('2d');
                if (!finalCtx) return reject(new Error('Could not get final canvas context.'));

                finalCtx.fillStyle = '#FFFFFF';
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
                finalCtx.drawImage(tempCanvas, 0, 0);

                resolve(finalCanvas.toDataURL('image/png'));
            });

            // Process the image
            segmentation.send({ image });
        };

        image.onerror = (error) => reject(error);
        image.src = imageDataUrl;
    });
};
