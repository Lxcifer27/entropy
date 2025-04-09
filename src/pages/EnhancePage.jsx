import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import CodeEditor from "../components/CodeEditor";
import { debounce } from "../utils/perfUtils";
import { postData } from "../utils/apiUtils";
// Import the Gemini service
import { enhanceCode } from "../utils/geminiService";

// Define enhancement types
const ENHANCEMENT_TYPES = [
  {
    id: "format",
    title: "Format & Style",
    description: "Clean up formatting, indentation, and apply style conventions",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6V4M12 6V8M12 6H8M16 6H20M4 10H20M8 14H4M8 14V18M8 14H16M16 14H20M16 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: "optimize",
    title: "Optimize Performance",
    description: "Improve efficiency and optimize code execution",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: "document",
    title: "Add Documentation",
    description: "Generate comments and documentation for your code",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: "security",
    title: "Security Fixes",
    description: "Find and fix potential security vulnerabilities",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15V17M12 7V13M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
];

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "typescript", label: "TypeScript" },
];

const DEFAULT_CODE = {
  javascript: `function calculateSum(arr) {
  var sum = 0;
  for (var i = 0; i < arr.length; i++) {
    sum = sum + arr[i];
  }
  return sum;
}`,
  python: `def calculate_sum(arr):
    sum = 0
    for i in range(len(arr)):
        sum = sum + arr[i]
    return sum`,
  java: `public int calculateSum(int[] arr) {
    int sum = 0;
    for (int i = 0; i < arr.length; i++) {
        sum = sum + arr[i];
    }
    return sum;
}`,
  typescript: `function calculateSum(arr: number[]): number {
  var sum = 0;
  for (var i = 0; i < arr.length; i++) {
    sum = sum + arr[i];
  }
  return sum;
}`,
};

// Use an environment variable with a fallback for the API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const EnhancePage = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE[language]);
  const [enhancedCode, setEnhancedCode] = useState("");
  const [selectedEnhancements, setSelectedEnhancements] = useState(["format"]);
  const [error, setError] = useState("");
  const { startLoading, stopLoading } = useLoading();
  
  // Refs for scroll-into-view functionality
  const enhancedOutputRef = useRef(null);
  
  // Add scroll-into-view effect when enhanced code is generated
  useEffect(() => {
    if (enhancedCode && enhancedOutputRef.current) {
      // On mobile, scroll to the enhanced code
      if (window.innerWidth < 1024) {
        enhancedOutputRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [enhancedCode]);

  // Setup scroll animations for sections
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);
    
    // Observe all sections that should fade in
    document.querySelectorAll('.fade-in-section').forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      // Cleanup observer on component unmount
      document.querySelectorAll('.fade-in-section').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  // Memoize the language change handler
  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setEnhancedCode("");
    setError("");
  }, []);

  // Memoize the enhancement toggle function
  const toggleEnhancement = useCallback((id) => {
    setSelectedEnhancements(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Create a debounced code change handler
  const handleCodeChange = useCallback(
    debounce((value) => {
      setCode(value);
    }, 300),
    []
  );

  // Include the generateEnhancedCode function
  const generateEnhancedCode = useMemo(() => {
    // Original implementation remains unchanged
    // This would be your existing implementation
    return (codeInput, lang, enhancements) => {
      // Get the function name if present
      const functionNameMatch = codeInput.match(/function\s+(\w+)/);
      const functionName = functionNameMatch ? functionNameMatch[1] : "yourFunction";
      
      // Get parameter info
      const paramsMatch = codeInput.match(/\(([^)]*)\)/);
      const params = paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()) : [];
      
      // Extract function body
      const bodyMatch = codeInput.match(/\{([^]*)\}/);
      const functionBody = bodyMatch ? bodyMatch[1].trim() : "";
      
      // Format code differently based on language
      if (lang === "javascript" || lang === "typescript") {
        // Apply formatting
        let enhanced = "";
        
        // Add documentation if selected
        if (enhancements.includes("document")) {
          enhanced += `/**
 * ${functionName.charAt(0).toUpperCase() + functionName.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}
 *${params.map(p => `\n * @param {any} ${p} - Description of ${p}`).join('')}
 * @returns {any} The result
 */\n`;
        }
        
        // Add function definition with parameters
        if (lang === "typescript") {
          enhanced += `function ${functionName}(${params.map(p => `${p}: any`).join(', ')}): any {\n`;
        } else {
          enhanced += `function ${functionName}(${params.join(', ')}) {\n`;
        }
        
        // Add input validation if security enhancement is selected
        if (enhancements.includes("security") && params.length > 0) {
          enhanced += `  // Input validation\n`;
          params.forEach(p => {
            enhanced += `  if (${p} === undefined) {\n    throw new Error("${p} parameter is required");\n  }\n`;
          });
          enhanced += '\n';
        }
        
        // Add optimized function body if optimization is selected
        if (enhancements.includes("optimize") && functionBody.includes("for")) {
          enhanced += "  // Using more efficient approach\n";
          if (functionBody.includes("sum") && functionBody.includes("arr")) {
            enhanced += "  return Array.isArray(arr) ? arr.reduce((sum, current) => sum + current, 0) : 0;\n";
          } else {
            // If we can't determine specific optimization, just format the original code
            enhanced += functionBody.split('\n')
              .map(line => '  ' + line.trim())
              .join('\n') + '\n';
          }
        } else {
          // Just format the existing body with proper indentation
          enhanced += functionBody.split('\n')
            .map(line => '  ' + line.trim())
            .join('\n') + '\n';
        }
        
        enhanced += "}";
        return enhanced;
        
      } else if (lang === "python") {
        // Python enhancement logic
        let enhanced = "";
        
        // Add function definition
        enhanced += `def ${functionName}(${params.join(', ')}):\n`;
        
        // Add docstring if documentation is selected
        if (enhancements.includes("document")) {
          enhanced += `    """\n    ${functionName.replace(/_/g, ' ')} function\n`;
          params.forEach(p => {
            enhanced += `    \n    Args:\n        ${p}: Description of ${p}\n`;
          });
          enhanced += `    \n    Returns:\n        The result\n    """\n`;
        }
        
        // Add input validation if security is selected
        if (enhancements.includes("security") && params.length > 0) {
          enhanced += `    # Input validation\n`;
          params.forEach(p => {
            enhanced += `    if ${p} is None:\n        raise ValueError("${p} parameter is required")\n`;
          });
          enhanced += '\n';
        }
        
        // Add optimized function body if optimization is selected
        if (enhancements.includes("optimize") && functionBody.includes("for") && functionBody.includes("sum")) {
          enhanced += "    # Using built-in sum function for better performance\n";
          enhanced += "    return sum(arr) if isinstance(arr, list) else 0\n";
        } else {
          // Just format the existing body with proper indentation
          const bodyLines = functionBody.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
          
          bodyLines.forEach(line => {
            enhanced += `    ${line}\n`;
          });
        }
        
        return enhanced;
        
      } else if (lang === "java") {
        // Java enhancement logic
        let enhanced = "";
        
        // Add documentation if selected
        if (enhancements.includes("document")) {
          enhanced += `/**\n * ${functionName.charAt(0).toUpperCase() + functionName.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()}\n`;
          params.forEach(p => {
            const paramName = p.split(' ').pop();
            enhanced += ` * @param ${paramName} Description of ${paramName}\n`;
          });
          enhanced += ` * @return The result\n */\n`;
        }
        
        // Extract method signature from code
        const signatureMatch = codeInput.match(/(public|private|protected)?\s+\w+\s+\w+\s*\([^)]*\)/);
        const signature = signatureMatch ? signatureMatch[0] : `public int ${functionName}(int[] arr)`;
        
        enhanced += `${signature} {\n`;
        
        // Add input validation if security enhancement is selected
        if (enhancements.includes("security")) {
          enhanced += "    // Input validation\n";
          enhanced += "    if (arr == null) {\n";
          enhanced += "        throw new IllegalArgumentException(\"Input array cannot be null\");\n";
          enhanced += "    }\n\n";
        }
        
        // Add optimized function body if optimization is selected
        if (enhancements.includes("optimize") && functionBody.includes("for") && functionBody.includes("sum")) {
          enhanced += "    // Using Java streams for better performance and readability\n";
          enhanced += "    return java.util.Arrays.stream(arr).sum();\n";
        } else {
          // Just format the existing body with proper indentation
          enhanced += functionBody.split('\n')
            .map(line => '    ' + line.trim())
            .join('\n') + '\n';
        }
        
        enhanced += "}";
        return enhanced;
      }
      
      // Default fallback - just return the original code
      return codeInput;
    };
  }, []);
  
  // Memoize the enhancement logic to avoid unnecessary recalculations
  const enhanceCodeWithAPI = useCallback(async () => {
    try {
      setError("");
      startLoading("Enhancing your code with Entropy AI...");
      
      try {
        // Try using Gemini directly first
        const enhancedResult = await enhanceCode(code, language, selectedEnhancements);
        setEnhancedCode(enhancedResult);
      } catch (geminiError) {
        console.error("Gemini error:", geminiError);
        
        // If Gemini fails, try the backend API
        try {
          const response = await postData('/ai/enhance-code', {
            code,
            language,
            enhancements: selectedEnhancements
          });
          setEnhancedCode(response.enhancedCode);
        } catch (apiError) {
          console.error("API error:", apiError);
          // Fallback to a simple formatted version if both fail
          const enhanced = generateEnhancedCode(code, language, selectedEnhancements);
          setEnhancedCode(enhanced);
        }
      }
    } catch (error) {
      console.error("Error enhancing code:", error);
      setError("Failed to enhance code. Please try again later.");
    } finally {
      stopLoading();
    }
  }, [code, language, selectedEnhancements, startLoading, stopLoading, generateEnhancedCode]);

  // Use a callback for applying enhanced code
  const applyEnhanced = useCallback(() => {
    if (enhancedCode) {
      setCode(enhancedCode);
      setEnhancedCode("");
    }
  }, [enhancedCode]);

  // Memoize the enhancement options to avoid re-renders
  const enhancementOptions = useMemo(() => {
    return ENHANCEMENT_TYPES.map(enhancement => (
      <div
        key={enhancement.id}
        onClick={() => toggleEnhancement(enhancement.id)}
        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
          selectedEnhancements.includes(enhancement.id)
            ? "bg-cyan-900/30 border border-cyan-500 shadow-lg shadow-cyan-900/20"
            : "border border-gray-700 hover:border-gray-600"
        }`}
      >
        <div className={`mt-0.5 text-cyan-500 flex-shrink-0`}>
          {enhancement.icon}
        </div>
        <div>
          <h3 className="font-medium text-white">{enhancement.title}</h3>
          <p className="text-sm text-gray-400">{enhancement.description}</p>
        </div>
      </div>
    ));
  }, [selectedEnhancements, toggleEnhancement]);

  return (
    <div className="content-wrapper page-wrapper">
      {/* Page Header with animation */}
      <div className="page-container py-8 px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Enhance Your Code"
          subtitle="Improve, optimize, and clean up your code with AI assistance"
        />
      </div>

      {/* Enhancement Options Section - Full Width */}
      <div className="mb-10 fade-in-section" style={{ animationDelay: '100ms' }}>
        <Card title="Enhancement Options" subtitle="Select the enhancements you want to apply" className="card-hover">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {enhancementOptions}
          </div>
        </Card>
      </div>

      {/* Code Editor Sections with sticky height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Input Section */}
        <div className="fade-in-section" style={{ animationDelay: '200ms' }}>
          <Card 
            title="Your Code" 
            subtitle="Paste your code to enhance"
            className="card-hover h-full flex flex-col"
          >
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex-grow">
                <label htmlFor="language-select" className="block text-sm text-gray-400 mb-2">
                  Select Language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-grow relative h-[calc(100vh-30rem)] min-h-[350px]">
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
                onClick={enhanceCodeWithAPI} 
                disabled={!code.trim() || selectedEnhancements.length === 0}
                className="w-full py-3 text-base font-medium"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 5H18.5M18.5 5H21.5M18.5 5V2M18.5 5V8M8.5 19H5.5M5.5 19H2.5M5.5 19V22M5.5 19V16M12 12L21 3M12 12L12.5 16.5L16.5 18.5L21 3M12 12L3 21M12 12L7.5 11L3 3L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Enhance Code
                </span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Output Section */}
        <div className="fade-in-section" style={{ animationDelay: '300ms' }} ref={enhancedOutputRef}>
          <Card 
            title="Enhanced Code" 
            subtitle="Review and apply the enhanced version"
            className="card-hover h-full flex flex-col"
            footerContent={
              enhancedCode ? (
                <div className="flex gap-3">
                  <Button 
                    onClick={applyEnhanced} 
                    variant="secondary"
                    className="flex-1 py-3 text-base font-medium"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Apply Changes
                    </span>
                  </Button>
                  <Button 
                    onClick={() => setEnhancedCode("")}
                    variant="outline"
                    className="py-3 text-base font-medium"
                  >
                    Discard
                  </Button>
                </div>
              ) : null
            }
          >
            <div className="flex-grow flex flex-col">
              {error && (
                <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded mb-4 animate-fadeIn">
                  {error}
                </div>
              )}
              
              {enhancedCode ? (
                <div className="h-[calc(100vh-30rem)] min-h-[350px] animate-fadeIn">
                  <CodeEditor
                    value={enhancedCode}
                    onChange={() => {}}
                    language={language}
                    minHeight="100%"
                    readOnly
                    showCopyButton={true}
                  />
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 min-h-[350px]">
                  <div className="text-cyan-500 mb-3">
                    <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 14.5L12.5 17.5L22 8M8.5 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.71569 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.0799 20 5.2 20H12M19 8V4M19 4H15M19 4L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No Enhanced Code Yet
                  </h3>
                  <p className="text-gray-400">
                    Enter your code, select enhancement options, and click "Enhance Code" to generate an improved version.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancePage; 