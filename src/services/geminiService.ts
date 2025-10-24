import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import type { UserProfile, Plan, ChatMessage, Exercise } from '../types';

// FIX: Initialize the GoogleGenAI client using process.env.API_KEY as required by the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const planSchema = {
  type: Type.OBJECT,
  properties: {
    nutritionPlan: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        dailyPlans: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              totalCalories: { type: Type.NUMBER },
              totalProtein: { type: Type.NUMBER },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    time: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    recipe: { type: Type.ARRAY, items: { type: Type.STRING } },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            },
          },
        },
      },
    },
    workoutPlan: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        schedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              day: { type: Type.STRING },
              focus: { type: Type.STRING },
              duration: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    sets: { type: Type.STRING },
                    reps: { type: Type.STRING },
                    rest: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const getPlanPrompt = (profile: UserProfile, language: 'en' | 'es'): string => {
    let equipmentInfo = '';
    const hasEquipment = profile.equipment && profile.equipment.length > 0;

    if (profile.workoutLocation === 'Home') {
        const equipmentList = hasEquipment ? profile.equipment.join(', ') : (language === 'es' ? 'Ninguno (solo peso corporal)' : 'None (bodyweight only)');
        if (language === 'es') {
            equipmentInfo = `\n- Equipamiento en Casa Disponible: ${equipmentList}. El plan de entrenamiento DEBE incorporar este equipamiento si está disponible.`;
        } else {
            equipmentInfo = `\n- Available Home Equipment: ${equipmentList}. The workout plan MUST incorporate this equipment if available.`;
        }
    }
    
    let measurementsInfo = '';
    const { measurements } = profile;
    if (measurements && (measurements.chest || measurements.waist || measurements.hips)) {
        const chest = measurements.chest ? `${measurements.chest} cm` : 'N/A';
        const waist = measurements.waist ? `${measurements.waist} cm` : 'N/A';
        const hips = measurements.hips ? `${measurements.hips} cm` : 'N/A';
        if (language === 'es') {
            measurementsInfo = `\n- Medidas (cm): Pecho: ${chest}, Cintura: ${waist}, Cadera: ${hips}. Usa estas medidas para personalizar aún más las recomendaciones.`;
        } else {
            measurementsInfo = `\n- Measurements (cm): Chest: ${chest}, Waist: ${waist}, Hips: ${hips}. Use these measurements to further customize recommendations.`;
        }
    }

    const workoutDaysText = profile.workoutDays.join(', ');

    if (language === 'es') {
        return `
    Crea un plan de fitness y nutrición completo y personalizado de 7 días para el siguiente usuario. La respuesta DEBE estar en español. Para cada comida y ejercicio, genera un 'id' único usando crypto.randomUUID().
    Perfil de Usuario:
    - Género: ${profile.gender}
    - Edad: ${profile.age}
    - Peso: ${profile.weight} kg
    - Altura: ${profile.height} cm${measurementsInfo}
    - Nivel de Actividad: ${profile.activityLevel}
    - Objetivo Principal: ${profile.goal}
    - Lugar de Entrenamiento: ${profile.workoutLocation}${equipmentInfo}
    - Días de entrenamiento seleccionados: ${workoutDaysText}. El plan DEBE usar estos días exactos.

    Instrucciones Clave:
    - **Inteligencia del Horario**: Analiza la distribución de los días de entrenamiento (si son consecutivos o espaciados) para crear una división (split) óptima que gestione la fatiga y maximice la recuperación. Por ejemplo, 3 días consecutivos (L-M-X) deberían tener un split de tipo Empuje/Tirón/Pierna. 3 días espaciados (L-X-V) podrían ser entrenamientos de Cuerpo Completo.

    Instrucciones Detalladas:
    1.  **Plan de Nutrición**: Crea un plan de comidas detallado para 7 días.
        - Calcula el TDEE del usuario y establece un objetivo de calorías y macronutrientes apropiado para su meta.
        - Para cada día, proporciona desayuno, comida, cena y dos snacks.
        - Para cada comida, lista los ingredientes, una receta simple, las calorías y proteínas estimadas, y un 'id' único.
        - Usa ingredientes comunes que se encuentran en supermercados españoles como Mercadona o Aldi.
        - Los nombres de los días (day) deben ser "Lunes", "Martes", etc.
    2.  **Plan de Entrenamiento**: Crea un programa de entrenamiento estructurado para los días seleccionados (${workoutDaysText}).
        - El plan debe adaptarse al lugar del usuario (${profile.workoutLocation}) y al equipamiento disponible. Incluye un 'id' único para cada día de entrenamiento.
        - Para cada día de entrenamiento, especifica el enfoque (ej. 'Empuje', 'Tirón', 'Piernas', 'Cuerpo Completo') basado en la distribución inteligente de días.
        - **IMPORTANTE**: Incluye una sección de **Calentamiento** al principio de cada día de entrenamiento con 2-3 ejercicios de estiramiento dinámico. Etiqueta claramente estos ejercicios añadiendo "(Calentamiento)" al final de su nombre. El tiempo de 'rest' para los ejercicios de calentamiento DEBE ser "0s".
        - Después del calentamiento, lista 5-6 ejercicios principales. Para cada ejercicio, especifica un 'id' único, nombre, series, repeticiones y tiempo de descanso.
        - Proporciona una 'description' (descripción) clara y concisa para CADA ejercicio, explicando la forma correcta.
    3.  **Resúmenes**: Proporciona un breve resumen tanto para el plan de nutrición como para el de entrenamiento, explicando la estrategia.
    4.  **Salida JSON**: La salida final DEBE ser un objeto JSON que se adhiera estrictamente al esquema proporcionado.
    `;
    }
    return `
    Create a comprehensive and personalized 7-day fitness and nutrition plan for the following user. The response MUST be in English. For each meal and exercise, generate a unique 'id' using crypto.randomUUID().
    User Profile:
    - Gender: ${profile.gender}
    - Age: ${profile.age}
    - Weight: ${profile.weight} kg
    - Height: ${profile.height} cm${measurementsInfo}
    - Activity Level: ${profile.activityLevel}
    - Main Goal: ${profile.goal}
    - Workout Location: ${profile.workoutLocation}${equipmentInfo}
    - Selected workout days: ${workoutDaysText}. The plan MUST use these exact days.

    Key Instructions:
    - **Schedule Intelligence**: Analyze the distribution of the workout days (whether they are consecutive or spaced out) to create an optimal training split that manages fatigue and maximizes recovery. For example, 3 consecutive days (Mon-Tue-Wed) should have a Push/Pull/Legs type of split. 3 spaced-out days (Mon-Wed-Fri) could be Full Body workouts.

    Detailed Instructions:
    1.  **Nutrition Plan**: Create a detailed 7-day meal plan.
        - Calculate the user's TDEE and set an appropriate calorie and macronutrient target for their goal.
        - For each day, provide a breakfast, lunch, dinner, and two snacks.
        - For each meal, list the ingredients, a simple recipe, the estimated calories and protein, and a unique 'id'.
        - Use common ingredients found in supermarkets.
        - The day names must be "Monday", "Tuesday", etc.
    2.  **Workout Plan**: Create a structured workout schedule for the selected days (${workoutDaysText}).
        - The plan should be tailored to the user's location (${profile.workoutLocation}) and available equipment. Include a unique 'id' for each workout day.
        - For each workout day, specify the focus (e.g., 'Push', 'Pull', 'Legs', 'Full Body') based on the intelligent day distribution.
        - **IMPORTANT**: Include a **Warm-up** section at the start of each workout day with 2-3 dynamic stretching exercises. Clearly label these exercises by adding "(Warm-up)" to the end of their name. The 'rest' time for warm-up exercises MUST be "0s".
        - Following the warm-up, list 5-6 main exercises per workout. For each exercise, specify a unique 'id', name, sets, reps, and rest time.
        - Provide a clear and concise 'description' for EVERY exercise, explaining the correct form.
    3.  **Summaries**: Provide a brief summary for both the nutrition and workout plans, explaining the strategy.
    4.  **JSON Output**: The final output MUST be a JSON object that strictly adheres to the provided schema.
    `;
};


export const generateInitialPlan = async (profile: UserProfile, language: 'en' | 'es'): Promise<Plan> => {
  const prompt = getPlanPrompt(profile, language);
  const TIMEOUT = 180000; // Increased to 180 seconds (3 minutes)
  const MAX_RETRIES = 2; // Allows for 1 initial call + 2 retries

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using a faster model for this complex task
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: planSchema,
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API_CALL_TIMEOUT')), TIMEOUT)
      );

      // Using 'any' to handle the race condition type
      const response: any = await Promise.race([apiCall, timeoutPromise]);

      if (!response || !response.text) {
          console.error("Gemini response was empty or invalid.", response);
          throw new Error("AI response was empty.");
      }

      let jsonText = response.text.trim();
      
      const startIndex = jsonText.indexOf('{');
      const endIndex = jsonText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex > startIndex) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
      } else {
        console.error("Could not find a valid JSON object in the model's response.", {
            rawText: response.text,
            candidates: response.candidates,
        });
        throw new Error("AI response did not contain a valid JSON object.");
      }
      
      try {
        return JSON.parse(jsonText) as Plan;
      } catch(e) {
          console.error("Error parsing JSON from Gemini:", e);
          console.error("Cleaned response text that failed parsing:", jsonText);
          throw new Error("Failed to parse the plan from the AI response.");
      }
    } catch (error) {
        console.error(`Plan generation attempt ${attempt + 1} failed:`, error);
        if (attempt === MAX_RETRIES) {
            console.error("All plan generation attempts have failed.");
            throw error;
        }
        await new Promise(res => setTimeout(res, 2000));
    }
  }

  throw new Error("Failed to generate plan after all retries.");
};

export const analyzeImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType
        }
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] }
    });

    return response.text;
};

const updateMealIngredientFunctionDeclaration: FunctionDeclaration = {
    name: 'updateMealIngredient',
    description: "Updates a meal in the user's nutrition plan by replacing one ingredient with another. Can also update the meal's name.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            day: {
                type: Type.STRING,
                description: "The day of the week for the meal to update, e.g., 'Lunes', 'Tuesday'. Must match a day in the user's plan.",
            },
            mealName: {
                type: Type.STRING,
                description: "The original name of the meal to be updated, e.g., 'Yogur con almendras', 'Chicken Salad'.",
            },
            oldIngredient: {
                type: Type.STRING,
                description: "The exact name of the ingredient to be replaced from the ingredients list.",
            },
            newIngredient: {
                type: Type.STRING,
                description: "The new ingredient to add to the ingredients list.",
            },
            newMealName: {
                type: Type.STRING,
                description: "Optional. The new name for the meal after the ingredient change, e.g., 'Yogur con nueces'.",
            }
        },
        required: ['day', 'mealName', 'oldIngredient', 'newIngredient'],
    },
};

export const getChatbot = (language: 'en' | 'es') => {
    const systemInstruction = language === 'es' 
        ? `Eres FitLife AI, un asistente de nutrición experto. Tu objetivo es ayudar a los usuarios a ajustar su plan de comidas.
- El usuario te proporcionará su plan de nutrición actual como CONTEXTO en cada mensaje. Utiliza SIEMPRE este contexto para identificar las comidas y los ingredientes.
- Si un usuario quiere cambiar un ingrediente, primero, encuéntralo en el CONTEXTO.
- Luego, sugiere 1-2 alternativas que sean nutricionalmente similares (en calorías y proteínas). Explica brevemente por qué es un buen sustituto.
- PREGUNTA al usuario si quiere proceder con el cambio. NO uses la herramienta sin confirmación explícita.
- Si el usuario confirma, utiliza la herramienta \`updateMealIngredient\` con los argumentos exactos del CONTEXTO y la conversación.
- Responde de forma conversacional y amigable. Informa al usuario después de una actualización exitosa. Responde siempre en español.`
        : `You are FitLife AI, an expert nutrition assistant. Your goal is to help users adjust their meal plan.
- The user will provide their current nutrition plan as CONTEXT in each message. ALWAYS use this context to identify meals and ingredients.
- If a user wants to change an ingredient, first, find it in the CONTEXT.
- Then, suggest 1-2 alternatives that are nutritionally similar (in calories and protein). Briefly explain why it's a good substitute.
- ASK the user if they want to proceed with the change. DO NOT use the tool without explicit confirmation.
- If the user confirms, use the \`updateMealIngredient\` tool with the exact arguments from the CONTEXT and the conversation.
- Respond in a conversational and friendly manner. Inform the user after a successful update. Always respond in English.`;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [updateMealIngredientFunctionDeclaration] }],
        },
    });
}

export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    return base64Audio;
};


export const getGroundedResponse = async (query: string, language: 'en' | 'es'): Promise<{ text: string, sources: any[] }> => {
    const fullQuery = language === 'es' ? `${query} (responde en español)` : `${query} (respond in English)`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullQuery,
        config: {
          tools: [{googleSearch: {}}],
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
};

export const getMapsResponse = async (query: string, location: {latitude: number, longitude: number}, language: 'en' | 'es'): Promise<{text: string, sources: any[]}> => {
    const fullQuery = language === 'es' ? `${query} (responde en español)` : `${query} (respond in English)`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullQuery,
        config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                }
              }
            }
          },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a vibrant, motivational fitness-themed image. ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}

const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        sets: { type: Type.STRING },
        reps: { type: Type.STRING },
        rest: { type: Type.STRING },
        description: { type: Type.STRING },
    }
};


export const getExerciseSubstitution = async (exerciseToReplace: Exercise, context: { workoutFocus: string, equipment: string }, language: 'en' | 'es'): Promise<Exercise> => {
    const langPrompt = language === 'es' ?
        `Busca un ejercicio alternativo para '${exerciseToReplace.name}'. El enfoque del entrenamiento es '${context.workoutFocus}'. El equipamiento disponible es: '${context.equipment}'.
        El nuevo ejercicio debe trabajar músculos similares. Mantén las mismas series, repeticiones y descanso que el original.
        Genera un 'id' único para el nuevo ejercicio. Responde en español.` :
        `Find an alternative exercise for '${exerciseToReplace.name}'. The workout focus is '${context.workoutFocus}'. Available equipment: '${context.equipment}'.
        The new exercise should work similar muscles. Keep the same sets, reps, and rest as the original.
        Generate a unique 'id' for the new exercise. Respond in English.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: langPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: exerciseSchema,
        }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText) as Omit<Exercise, 'id'>;

    // Ensure the original sets/reps/rest are preserved and add a new ID
    return {
        ...parsed,
        id: crypto.randomUUID(),
        sets: exerciseToReplace.sets,
        reps: exerciseToReplace.reps,
        rest: exerciseToReplace.rest,
    };
};