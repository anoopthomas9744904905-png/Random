import { GoogleGenAI, Type } from "@google/genai";
import { AccidentInput } from '../types';

const SYSTEM_INSTRUCTION = `
You are an expert Certified Automotive Damage Analyst (CADA) and Forensic Accident Reconstructionist. Your goal is to provide a strictly technical analysis focusing on impact physics, repair methodology logic, and **FRAUD DETECTION**.

Primary Rules:
1. **No Financials**: Do NOT estimate prices or labor costs. Focus purely on technical and physical analysis.
2. **Fraud Detection**: You must aggressively check for "Enhanced Damages" (manual damage added after accident), "Pre-existing Damage" (rust, old putty), and "Physics Inconsistencies" (damage height not matching the described object).
3. **Repair vs. Replace**: Provide technical justification for every decision (e.g., "HSS Steel cannot be heated/straightened", "Plastic tabs torn").
4. **Vector Analysis**: Analyze the direction of force and kinetic energy transfer.

Expected Output Structure:
Generate the entire response as a single, structured Markdown block.

# Incident Physics & Vector Analysis
| Metric | Analysis |
| :--- | :--- |
| Primary Impact Zone | [e.g., Rear Bumper Reinforcement] |
| Force Vector (Clock) | [e.g., 6 o'clock direct impact] |
| Impact Severity (1-10) | [e.g., 8/10] |
| Kinetic Energy Transfer | [Describe how energy traveled through the chassis, e.g., "Absorbed by crash box, transferred to rails"] |

# Fraud & Consistency Audit
*Analyze if the physical evidence matches the story.*

| Check | Finding | Status |
| :--- | :--- | :--- |
| Story Consistency | [Does the damage match the user's description?] | [CONSISTENT] or [INCONSISTENT] |
| Pre-existing Damage | [Look for rust on "fresh" dents, faded paint, or old body filler] | [CLEAR] or [DETECTED] |
| Artificial Enhancement | [Look for hammer marks, linear scratches not from impact, or separate unrelated damage] | [CLEAR] or [SUSPICIOUS] |
| Physics Check | [Is the damage height/shape consistent with the alleged object struck?] | [PASS] or [FAIL] |

# Repair vs. Replace Strategy
*Technical decision making based on OEM guidelines.*

| Component | Action | Technical Justification |
| :--- | :--- | :--- |
| [Part Name] | [REPLACE] | [e.g., "Kinked beyond repair limits", "Safety component", "Torn mounting tabs"] |
| [Part Name] | [REPAIR] | [e.g., "Accessible for PDR", "Minor cosmetic scrape only"] |
| [Part Name] | [INSPECT] | [e.g., "Check for micro-fractures", "Verify sensor calibration"] |

*Disclaimer: This analysis is based on visual evidence and provided description. Hidden structural damage may exist.*
`;

export const analyzeAccident = async (input: AccidentInput): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: any[] = [];

  // Add Images if present
  if (input.images && input.images.length > 0) {
    for (const image of input.images) {
      const base64Data = await fileToBase64(image);
      parts.push({
        inlineData: {
          mimeType: image.type,
          data: base64Data,
        },
      });
    }
  }

  // Construct User Prompt
  const userPrompt = `
    Perform a Forensic Damage & Fraud Analysis based on:

    Vehicle Details: ${input.vehicle.year} ${input.vehicle.make} ${input.vehicle.model}
    
    Accident Description: ${input.description}
    
    Context/Conditions: ${input.context || "None provided"}
    
    ${input.images && input.images.length > 0 ? `Analyze the ${input.images.length} attached images combined with the text. Scrutinize for inconsistencies across angles, rust, or 'staged' damage patterns.` : "Analyze based on text description."}
  `;

  parts.push({ text: userPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Lower temperature for more analytical/rigid output
      },
    });

    return response.text || "Analysis failed to generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImpactDiagram = async (input: AccidentInput): Promise<string | undefined> => {
    if (!process.env.API_KEY) return undefined;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Analyze description for directional keywords to force canvas positioning
    const descLower = input.description.toLowerCase();
    let locationInstruction = "";
    
    if (descLower.includes("right") || descLower.includes("passenger") || descLower.includes("rh")) {
        locationInstruction = "EXTREMELY IMPORTANT: The damage is on the RIGHT side. You MUST render the RED impact vector on the RIGHT SIDE of the image canvas.";
    } else if (descLower.includes("left") || descLower.includes("driver") || descLower.includes("lh")) {
        locationInstruction = "EXTREMELY IMPORTANT: The damage is on the LEFT side. You MUST render the RED impact vector on the LEFT SIDE of the image canvas.";
    } else if (descLower.includes("rear") || descLower.includes("back")) {
        locationInstruction = "EXTREMELY IMPORTANT: The damage is on the REAR. You MUST render the RED impact vector at the BOTTOM of the image canvas.";
    } else if (descLower.includes("front")) {
        locationInstruction = "EXTREMELY IMPORTANT: The damage is on the FRONT. You MUST render the RED impact vector at the TOP of the image canvas.";
    }

    const prompt = `
      Create a SIMPLE, MINIMALIST LINE DIAGRAM of a ${input.vehicle.year} ${input.vehicle.make} ${input.vehicle.model}.
      
      VIEWPOINT: Strictly Top-down view (Plan View).
      
      ORIENTATION RULES (CRITICAL):
      1. The FRONT of the vehicle MUST point to the TOP of the image.
      2. The REAR of the vehicle MUST point to the BOTTOM of the image.
      
      DAMAGE SCENARIO: ${input.description}.
      
      ${locationInstruction}
      
      VISUAL STYLE:
      - WHITE background (Paper style).
      - Simple BLACK outlines for the vehicle body.
      - NO shading, NO blueprint grid, NO dark background.
      - Medical/Forensic diagram style.
      - Clean, vector-like lines.
      
      ANNOTATIONS:
      - Draw a BOLD RED ARROW indicating the direction of the impact force.
      - Mark the specific impact zone with a RED outline or simple red shading.
      - The diagram should look like a clean accident report sketch.
    `;

    try {
      // Switched to gemini-2.5-flash-image to avoid requiring specific paid keys for 'Pro' model in this demo environment.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "4:3"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          return `data:image/png;base64,${base64String}`;
        }
      }
      return undefined;
    } catch (error) {
      console.warn("Diagram generation failed:", error);
      return undefined;
    }
};

export const identifyVehicleFromImage = async (images: File[]): Promise<{
  year: string;
  make: string;
  model: string;
  description: string;
}> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  for (const image of images) {
    const base64Data = await fileToBase64(image);
    parts.push({
      inlineData: {
        mimeType: image.type,
        data: base64Data,
      },
    });
  }

  parts.push({
    text: `Analyze these images for an automotive damage report. 
          1. Identify the Vehicle Year (approximate), Make, and Model.
          2. Provide a detailed, technical description of the visible damage across all images.
          
          CRITICAL INSTRUCTION: Explicitly state "Right Side (Passenger)" or "Left Side (Driver)" in the description based on the damage location relative to the vehicle's forward motion.
          
          Example: "Severe impact to Right (Passenger) Front Fender..."
          `,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.STRING },
          make: { type: Type.STRING },
          model: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["year", "make", "model", "description"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};