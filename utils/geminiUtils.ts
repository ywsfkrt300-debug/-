import { GoogleGenAI, Type } from "@google/genai";
import { getApiKey } from './apiKeyManager';

interface AnalysisResult {
    isGood: boolean;
    feedback: string;
}

let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI | null {
    // If the instance exists, return it
    if (ai) return ai;
    
    // Otherwise, try to create it
    const apiKey = getApiKey();
    if (apiKey) {
        try {
            ai = new GoogleGenAI({ apiKey });
            return ai;
        } catch (error) {
            console.error("Failed to initialize GoogleGenAI, likely an invalid API key format.", error);
            return null;
        }
    }
    
    console.warn("Gemini API key is not set in localStorage. AI features are disabled.");
    return null;
}

function dataUrlToGeminiPart(dataUrl: string) {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) throw new Error('Invalid data URL format');
    
    const mimeTypeMatch = parts[0].match(/:(.*?);/);
    if (!mimeTypeMatch) throw new Error('Could not determine MIME type from data URL');
    const mimeType = mimeTypeMatch[1];
    
    const base64Data = parts[1];
    return {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };
}

export async function analyzeStudentPhoto(imageDataUrl: string): Promise<AnalysisResult> {
    const currentAi = getAiInstance();
    if (!currentAi) {
        return { isGood: true, feedback: 'تم تخطي التحليل. يرجى إعداد مفتاح API لاستخدام هذه الميزة.' };
    }
    
    try {
        const imagePart = dataUrlToGeminiPart(imageDataUrl);
        const textPart = {
            text: `أنت مساعد ذكي وسريع للمصور المدرسي. هدفك هو المساعدة في التقاط صورة جيدة بسرعة، وليس البحث عن العيوب الصغيرة. كن متساهلاً في تقييمك.

            حلل هذه الصورة بسرعة (خلال ثانيتين إن أمكن) وقرر ما إذا كانت مقبولة بشكل عام.
            فقط ارفض الصورة إذا كانت هناك مشكلة كبيرة وواضحة جداً مثل:
            1. الوجه غير واضح أو خارج نطاق التركيز.
            2. العينان مغلقتان تماماً.
            3. ميلان حاد جداً في الرأس.
            4. ظلال قوية جداً تخفي ملامح الوجه.
            
            تجاوز عن العيوب البسيطة مثل الابتسامة الخفيفة أو الميلان الطفيف.`
        };

        const response = await currentAi.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isGood: { type: Type.BOOLEAN, description: "هل الصورة مقبولة بشكل عام؟" },
                        feedback: { type: Type.STRING, description: "إذا كانت الصورة غير جيدة، قدم ملاحظة قصيرة وواضحة جداً باللغة العربية. اتركها فارغة إذا كانت جيدة." }
                    },
                    required: ["isGood", "feedback"]
                },
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        
        return {
            isGood: jsonResponse.isGood,
            feedback: jsonResponse.feedback || (jsonResponse.isGood ? "الصورة ممتازة!" : "الصورة غير مطابقة للمواصفات."),
        };

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        return { isGood: false, feedback: 'فشل تحليل الصورة. قد يكون مفتاح API غير صالح أو أنك بحاجة لإعداد الفوترة لمشروعك.' };
    }
}

export async function removeBackgroundImage(imageDataUrl: string): Promise<string> {
    const currentAi = getAiInstance();
    if (!currentAi) {
        console.warn("Skipping background removal because API key is not set.");
        return imageDataUrl;
    }

    try {
        const imagePart = dataUrlToGeminiPart(imageDataUrl);
        const textPart = {
            text: "Remove the background from this portrait photo and replace it with a solid white background. The subject is a person. The result should be a clean portrait on a white background, suitable for a school ID. Keep the subject intact."
        };

        const response = await currentAi.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] }
        });

        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts) {
             for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    return `data:${mimeType};base64,${base64Data}`;
                }
            }
        }
        
        throw new Error("No image data returned from background removal API call.");

    } catch (error) {
        console.error("Error removing background with Gemini:", error);
        throw error;
    }
}
