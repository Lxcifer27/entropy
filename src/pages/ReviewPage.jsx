import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useLoading } from "../context/LoadingContext";
import { useAuth } from "../context/AuthContext";
import { saveChatHistory } from "../utils/firestoreService";
import { memoize, debounce } from "../utils/perfUtils";
import { generateCodeReview, preloadModel } from "../utils/geminiService";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import CodeEditor from "../components/CodeEditor";
import FeedbackDisplay from "../components/FeedbackDisplay";
import SectionHeader from "../components/ui/SectionHeader";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "typescript", label: "TypeScript" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
];

const DEFAULT_CODE = {
  javascript: `function sum(a, b) {
  return a + b;
}`,
  python: `def sum(a, b):
    return a + b`,
  java: `public int sum(int a, int b) {
    return a + b;
}`,
  typescript: `function sum(a: number, b: number): number {
  return a + b;
}`,
  csharp: `public int Sum(int a, int b) 
{
    return a + b;
}`,
  cpp: `int sum(int a, int b) {
    return a + b;
}`,
};

// Memoized function to extract function name from code
const extractFunctionName = memoize((code, lang) => {
  let functionNameMatch;
  
  if (lang === "javascript" || lang === "typescript") {
    functionNameMatch = code.match(/function\s+(\w+)/);
  } else if (lang === "python") {
    functionNameMatch = code.match(/def\s+(\w+)/);
  } else if (lang === "java" || lang === "csharp" || lang === "cpp") {
    functionNameMatch = code.match(/(?:public|private|protected)?\s+\w+\s+(\w+)\s*\(/);
  }
  
  return functionNameMatch ? functionNameMatch[1] : "your function";
});

const ReviewPage = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE[language]);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [historySaved, setHistorySaved] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { startLoading, stopLoading } = useLoading();
  const { currentUser } = useAuth();
  const editorContainerRef = useRef(null);

  // Preload resources and initialize page
  useEffect(() => {
    const preloadResources = async () => {
      try {
        // Explicitly preload the Gemini model to reduce initial lag
        const preloadPromise = Promise.all([
          // Preload the Gemini model
          preloadModel(),
          // Wait for the editor to initialize
          new Promise(resolve => setTimeout(resolve, 300))
        ]);
        
        await preloadPromise;
      } catch (error) {
        console.error("Error preloading resources:", error);
      } finally {
        setPageLoading(false);
      }
    };

    preloadResources();
  }, []);

  // Resize observer for editor container
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (editorContainerRef.current) {
        const height = editorContainerRef.current.offsetHeight;
        editorContainerRef.current.style.height = `${height}px`;
      }
    });

    resizeObserver.observe(editorContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Memoize the language change handler for better performance
  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setReview("");
    setError("");
  }, []);

  // Create a debounced code change handler
  const handleCodeChange = useCallback(
    debounce((value) => {
      setCode(value);
      // Clear review when code changes
      if (review) setReview("");
      if (error) setError("");
    }, 100),
    [review, error]
  );

  // Function to generate AI review using Entropy
  const generateAIReview = async (codeInput, lang) => {
    try {
      // Use Gemini API for code review
      return await generateCodeReview(codeInput, lang);
    } catch (error) {
      console.error("Error with Gemini review:", error);
      
      // Fall back to the original implementation if Gemini fails
      // Extract code metrics
      const functionName = extractFunctionName(codeInput, lang);
      const hasComments = codeInput.includes('//') || codeInput.includes('/*') || codeInput.includes('#');
      const hasLoops = codeInput.includes('for') || codeInput.includes('while');
      const hasConditions = codeInput.includes('if') || codeInput.includes('switch');
      const hasErrorHandling = codeInput.includes('try') || codeInput.includes('catch') || codeInput.includes('throw');
      const hasReturnStatement = codeInput.includes('return');
      const isSimple = codeInput.split('\n').length < 5;

      // Calculate code score
      let codeScore = 70; // Base score
      if (hasComments) codeScore += 10;
      if (hasErrorHandling) codeScore += 10;
      if (hasReturnStatement) codeScore += 5;
      if (!isSimple) codeScore += 5;
      codeScore = Math.min(98, Math.max(50, codeScore));

      // Generate detailed review with beautiful formatting
      return `# 🔍 Code Review: ${functionName}

## 📊 Quality Score: ${codeScore}/100

<div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 my-4 border border-gray-700">
  <div class="flex items-center justify-between mb-4">
    <span class="text-xl font-semibold">Overall Assessment</span>
    <span class="text-2xl">${codeScore >= 90 ? "🏆" : codeScore >= 80 ? "🌟" : codeScore >= 70 ? "👍" : "💪"}</span>
  </div>
  <div class="w-full bg-gray-700 rounded-full h-4">
    <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500" style="width: ${codeScore}%"></div>
  </div>
</div>

## 🎯 Overview

${isSimple ? 
  `This is a concise ${lang} function that demonstrates a clear, focused purpose. The implementation is straightforward and easy to understand.` :
  `The code implements a more complex ${lang} function with multiple operations and control structures. The implementation shows thoughtful organization.`}

## 💡 Code Analysis

### Complexity and Readability ${hasLoops || hasConditions ? "🔄" : "✨"}
- Complexity Level: ${hasLoops && hasConditions ? "Moderate to High" : hasLoops || hasConditions ? "Moderate" : "Low"}
- Structure: ${isSimple ? "Clean and concise" : "Well-organized with clear logic flow"}
- Documentation: ${hasComments ? "✅ Well-documented" : "❌ Could benefit from additional comments"}

### Error Handling and Safety 🛡️
${hasErrorHandling ? `
✅ Implements error handling
✅ Shows consideration for edge cases` : `
❌ No explicit error handling
⚠️ Consider adding input validation and error checks`}

### Performance Optimization ⚡
${hasLoops ? `
- Loop optimization opportunities identified
- Consider using built-in methods for better performance` : `
- Current implementation is performant
- No significant optimization needed`}

## 🚀 Recommendations

### 1. Code Structure
\`\`\`${lang}
// Add input validation
${lang === "typescript" ? 
  `function ${functionName}(input: number): number {
  if (typeof input !== 'number') {
    throw new TypeError('Invalid input type');
  }
  // Your logic here
  return result;
}` :
  `function ${functionName}(input) {
  if (typeof input !== 'number') {
    throw new TypeError('Invalid input type');
  }
  // Your logic here
  return result;
}`}
\`\`\`

### 2. Documentation
\`\`\`${lang}
/**
 * ${functionName} - Brief description
 * @param {${lang === "typescript" ? "number" : "any"}} input - Parameter description
 * @returns {${lang === "typescript" ? "number" : "any"}} Description of return value
 * @throws {Error} Description of error cases
 */
\`\`\`

### 3. Testing Strategy 🧪

<div class="bg-gray-800 rounded-lg p-4 my-4 border border-gray-700">
  <h4 class="font-semibold mb-2">Recommended Test Cases:</h4>
  <ul class="list-disc list-inside space-y-2">
    <li>✅ Valid input scenarios</li>
    <li>✅ Edge cases and boundary values</li>
    <li>✅ Error handling verification</li>
    <li>✅ Performance benchmarks</li>
  </ul>
</div>

## 🎯 Best Practices Checklist

<div class="grid grid-cols-1 gap-4 my-4">
  <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <h4 class="font-semibold mb-2">Strengths ✨</h4>
    <ul class="list-none space-y-2">
      ${hasReturnStatement ? '<li>✅ Clear return values</li>' : ''}
      ${hasComments ? '<li>✅ Good documentation</li>' : ''}
      ${hasErrorHandling ? '<li>✅ Error handling</li>' : ''}
      ${isSimple ? '<li>✅ Clean implementation</li>' : '<li>✅ Well-structured code</li>'}
    </ul>
  </div>
  <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <h4 class="font-semibold mb-2">Improvement Areas 🎯</h4>
    <ul class="list-none space-y-2">
      ${!hasComments ? '<li>📝 Add documentation</li>' : ''}
      ${!hasErrorHandling ? '<li>🛡️ Add error handling</li>' : ''}
      ${isSimple ? '<li>🔄 Consider edge cases</li>' : ''}
      <li>✨ Optimize performance</li>
    </ul>
  </div>
</div>

## 💫 Final Thoughts

${codeScore >= 90 ? 
  "Excellent work! The code demonstrates high quality and adherence to best practices." :
  codeScore >= 80 ?
  "Very good implementation with room for minor improvements." :
  "Good foundation with opportunities for enhancement."}

Keep up the great work! 🚀`;
    }
  };

  // Handle the review action
  const reviewCode = useCallback(async () => {
    try {
      if (!code.trim()) {
        setError("Please enter some code to analyze");
        return;
      }
      
      setError("");
      setReview("");
      setHistorySaved(false);
      
      startLoading("Analyzing your code with Entropy AI...");
      const analysis = await generateCodeReview(code, language);
      setReview(analysis);
      
      // Save to chat history if user is logged in
      if (currentUser) {
        try {
          await saveChatHistory(
            currentUser.uid,
            'review',
            code,
            analysis
          );
          setHistorySaved(true);
        } catch (saveError) {
          console.error("Error saving chat history:", saveError);
        }
      }
    } catch (error) {
      setError(error.message || "An unexpected error occurred");
      setReview("");
    } finally {
      stopLoading();
    }
  }, [code, language, startLoading, stopLoading, currentUser]);

  if (pageLoading) {
    return (
      <div className="content-wrapper">
        <div className="page-container py-8 px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Code Review & Analysis"
            subtitle="Get professional insights and improvement suggestions powered by Entropy AI"
            className="animate-fade-in"
          />
          <div className="flex flex-col items-center justify-center h-64 mt-8">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-400">Initializing code review...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="page-container py-8 px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Code Review & Analysis"
          subtitle="Get professional insights and improvement suggestions powered by Entropy AI"
          className="animate-fade-in"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Input Section */}
          <div className="animate-slide-up card-container" style={{ animationDelay: '100ms' }}>
            <Card 
              title="Your Code" 
              subtitle="Paste your code to review"
              className="h-full"
            >
              <div className="mb-4">
                <label htmlFor="language-select" className="block text-sm text-gray-400 mb-2">
                  Select Language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="code-editor-container">
                <CodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  language={language}
                  minHeight="100%"
                  showCopyButton={true}
                />
              </div>

              <div className="mt-4">
                <Button 
                  onClick={reviewCode}
                  disabled={!code.trim()}
                  className="w-full py-3"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Analyze with Entropy AI
                  </span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Output Section */}
          <div className="animate-slide-up card-container" style={{ animationDelay: '200ms' }}>
            <Card 
              title="AI Feedback" 
              subtitle="Detailed analysis and suggestions from Entropy AI"
              className="h-full"
            >
              <div className="card-content custom-scrollbar">
                {error && (
                  <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                {review ? (
                  <>
                    <FeedbackDisplay feedback={review} />
                    {historySaved && (
                      <div className="mt-4 bg-cyan-900/20 border border-cyan-500/30 rounded-md p-3 flex items-center text-sm">
                        <svg className="h-5 w-5 text-cyan-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-cyan-400">
                          Saved to your chat history
                        </span>
                        <Link to="/history" className="ml-auto text-cyan-500 hover:text-cyan-400 underline">
                          View History
                        </Link>
                      </div>
                    )}
                    {!currentUser && (
                      <div className="mt-4 bg-gray-800 border border-gray-700 rounded-md p-3 flex items-center text-sm">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">
                          Sign in to save this review to your history
                        </span>
                        <Link to="/login" className="ml-auto text-cyan-500 hover:text-cyan-400 underline">
                          Sign In
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                    <div className="text-cyan-500 mb-3">
                      <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76zm-9.3-5.66 4.96 4.96M14 21l-5 1 1-5m10.24-2.76L14 21" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Ready to Review Your Code
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      Enter your code and click "Analyze with Entropy AI" to receive a detailed analysis with insights and optimization suggestions.
                    </p>
                    {currentUser && (
                      <p className="text-cyan-400 text-sm mt-4">
                        <svg className="inline-block h-4 w-4 mr-1 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Your analysis will be saved to your chat history
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage; 