/**
 * Helper function to convert data URL to Blob
 * @param dataurl The base64 data URL.
 * @returns A Blob object.
 */
const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


/**
 * Removes the background from an image data URL using the remove.bg API.
 * This is an online operation and requires an internet connection.
 * @param imageDataUrl The base64 data URL of the image to process.
 * @param backgroundColor The hex code of the color to use for the background.
 * @returns A promise that resolves with the new image data URL with the specified background color.
 */
export const removeBackground = async (imageDataUrl: string, backgroundColor: string): Promise<string> => {
    const apiKey = "eNkwhVq732chwvNB2Go5K329";
    const apiUrl = "https://api.remove.bg/v1.0/removebg";

    try {
        const imageBlob = dataURLtoBlob(imageDataUrl);

        const formData = new FormData();
        formData.append('image_file', imageBlob, 'student_photo.jpg');
        formData.append('size', 'auto');
        formData.append('format', 'json');
        
        // remove.bg uses transparent background if no color is specified.
        if (backgroundColor) {
            formData.append('bg_color', backgroundColor);
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            // Try to parse error from remove.bg for better feedback
            let errorMessage = `API request failed with status ${response.status}.`;
            try {
                const errorData = await response.json();
                if (errorData.errors && errorData.errors.length > 0) {
                    errorMessage = errorData.errors[0].title || errorMessage;
                }
            } catch (e) {
                // Could not parse JSON, use the status text.
                errorMessage = `${errorMessage} ${response.statusText}`;
            }
            console.error('remove.bg API error:', errorMessage);
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (result.data && result.data.result_b64) {
            return `data:image/png;base64,${result.data.result_b64}`;
        } else {
            throw new Error('Invalid response data from remove.bg API');
        }
    } catch (error) {
        console.error("Error calling remove.bg API:", error);
        throw error; // Re-throw to be handled by the calling component
    }
};
