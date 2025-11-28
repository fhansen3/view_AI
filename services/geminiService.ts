import { GoogleGenAI, Type } from "@google/genai";
import { DetailedAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "Common name of the identified object.",
    },
    scientificName: {
      type: Type.STRING,
      description: "Scientific name if living (e.g., plants, animals), or technical name if inanimate.",
      nullable: true,
    },
    category: {
      type: Type.STRING,
      description: "General category (e.g., Plant, Electronic, Furniture, Tool).",
    },
    description: {
      type: Type.STRING,
      description: "A detailed and engaging description of the object, explaining what it is and its primary function or characteristics.",
    },
    funFacts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 interesting or surprising facts about the object.",
    },
    attributes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Attribute name (e.g., 'Lifespan', 'Origin', 'Ecological Role')." },
          value: { type: Type.STRING, description: "Value of the attribute." },
        },
      },
      description: "Key attributes. For living things include lifespan, habitat, ecological importance. For objects include material, usage, history.",
    },
  },
  required: ["name", "category", "description", "funFacts", "attributes"],
};

export async function analyzeImage(base64Image: string): Promise<DetailedAnalysis> {
  // Remove data URL prefix if present to get raw base64
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: "Identify the main object in this image. Provide a detailed analysis including its name, description, interesting facts, and key attributes (like lifespan/ecology for nature, or materials/utility for objects).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert biologist, engineer, and historian. Your goal is to identify objects and provide educational, detailed, and accurate information about them.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    return JSON.parse(text) as DetailedAnalysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}
