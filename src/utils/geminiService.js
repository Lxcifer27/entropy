import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Configures a Gemini model with specific parameters
 * @param {string} modelName - The model name to use
 * @param {Object} params - Configuration parameters
 * @returns {object} - Configured model
 */
const configureModel = (modelName = "gemini-1.5-pro", params = {}) => {
  const model = genAI.getGenerativeModel({ model: modelName });
  
  // Set default configuration if not provided
  const defaultConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  };
  
  // Merge default with provided params
  const generationConfig = { ...defaultConfig, ...params };
  
  return { model, generationConfig };
};

/**
 * Generate a code review using Gemini AI
 * @param {string} code - The code to review
 * @param {string} language - The programming language
 * @returns {Promise<string>} - The review in markdown format
 */
export const generateCodeReview = async (code, language) => {
  try {
    const { model, generationConfig } = configureModel("gemini-1.5-pro", {
      temperature: 0.2, // Lower temperature for more consistent reviews
    });
    
    const prompt = `You are an expert code reviewer with extensive experience in multiple programming languages. Please review the following ${language} code and provide a detailed, professional analysis:

CODE TO REVIEW:
\`\`\`${language}
${code}
\`\`\`

Please provide a comprehensive review that includes:

1. A high-level overview of the code's purpose and structure
2. Code quality assessment (with a score out of 100)
3. Analysis of:
   - Complexity and readability
   - Error handling and edge cases
   - Performance considerations
   - Security implications
   - Best practices adherence
4. Specific recommendations for improvement
5. Code examples for suggested improvements
6. Testing recommendations

Format the response in Markdown with clear sections, emojis for visual appeal, and code blocks for examples. Make it visually appealing and easy to read.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating code review with Gemini:", error);
    throw error;
  }
};

/**
 * Enhance code using Gemini AI
 * @param {string} code - The code to enhance
 * @param {string} language - The programming language
 * @param {string[]} enhancements - Types of enhancements to apply
 * @returns {Promise<string>} - The enhanced code
 */
export const enhanceCode = async (code, language, enhancements) => {
  try {
    const { model, generationConfig } = configureModel("gemini-1.5-pro", {
      temperature: 0.3,
    });
    
    // Create a detailed description of the enhancements requested
    const enhancementDescriptions = {
      format: "Clean up formatting, indentation, and apply style conventions",
      optimize: "Improve efficiency and optimize code execution",
      document: "Generate comments and documentation for the code",
      security: "Find and fix potential security vulnerabilities"
    };
    
    const requestedEnhancements = enhancements
      .map(e => `- ${e}: ${enhancementDescriptions[e] || e}`)
      .join('\n');
    
    const prompt = `You are an expert programmer specializing in code improvements. Enhance the following ${language} code by applying these specific enhancements:

${requestedEnhancements}

CODE TO ENHANCE:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the enhanced code, nothing else. Make sure to preserve the core functionality while applying the requested enhancements.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const enhancedCode = response.text().trim();
    
    // Strip any markdown code blocks if they exist
    return enhancedCode.replace(/^```[\w]*\n/, '').replace(/```$/, '');
  } catch (error) {
    console.error("Error enhancing code with Gemini:", error);
    throw error;
  }
};

/**
 * Translate code from one language to another using Gemini AI
 * @param {string} sourceCode - The code to translate
 * @param {string} sourceLanguage - Source programming language
 * @param {string} targetLanguage - Target programming language
 * @returns {Promise<string>} - The translated code
 */
export const translateCode = async (sourceCode, sourceLanguage, targetLanguage) => {
  try {
    const { model, generationConfig } = configureModel("gemini-1.5-pro", {
      temperature: 0.2,
    });
    
    const prompt = `You are an expert polyglot programmer with deep knowledge of multiple programming languages. Translate the following ${sourceLanguage} code to ${targetLanguage} while preserving its functionality, style, and purpose:

SOURCE CODE (${sourceLanguage}):
\`\`\`${sourceLanguage}
${sourceCode}
\`\`\`

Return ONLY the translated ${targetLanguage} code, nothing else. Ensure you:
1. Maintain the same functionality
2. Use idiomatic ${targetLanguage} patterns and best practices
3. Preserve comments (but translate them)
4. Handle language-specific differences appropriately`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const translatedCode = response.text().trim();
    
    // Strip any markdown code blocks if they exist
    return translatedCode.replace(/^```[\w]*\n/, '').replace(/```$/, '');
  } catch (error) {
    console.error("Error translating code with Gemini:", error);
    throw error;
  }
}; 