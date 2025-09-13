// Lazy loading service for Gemini AI SDK
let geminiModule: any = null;
let geminiModel: any = null;

// Dynamic import of Gemini SDK
const loadGemini = async () => {
  if (!geminiModule) {
    geminiModule = await import('@google/genai');
  }
  return geminiModule;
};

// Initialize Gemini model lazily
const initializeGemini = async () => {
  if (!geminiModel) {
    const { GoogleGenerativeAI } = await loadGemini();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set GEMINI_API_KEY in your .env.local file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }
  
  return geminiModel;
};

// Send message to Gemini with lazy loading
export const sendMessage = async (prompt: string): Promise<string> => {
  try {
    const model = await initializeGemini();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key in .env.local');
      }
      throw new Error(`Gemini API error: ${error.message}`);
    }
    
    throw new Error('Failed to send message to Gemini');
  }
};

// Preload the Gemini module (optional, can be called on app startup)
export const preloadGemini = () => {
  loadGemini().catch(console.error);
};