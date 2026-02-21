import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeFoodImage = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: "Analyze this food image and estimate the calories. Return a JSON object with 'food_name' and 'calories' (integer). If multiple items, provide a summary name and total calories.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          food_name: { type: Type.STRING },
          calories: { type: Type.INTEGER },
        },
        required: ["food_name", "calories"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const getHealthAdvice = async (query: string, userContext: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: query,
    config: {
      systemInstruction: `You are a helpful health and nutrition assistant. 
      User context: ${JSON.stringify(userContext)}. 
      Provide concise, encouraging, and scientifically accurate advice.`,
    },
  });

  return response.text;
};
