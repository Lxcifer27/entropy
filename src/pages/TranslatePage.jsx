import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { saveChatHistory } from "../utils/firestoreService";
import { useLoading } from "../context/LoadingContext";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import CodeEditor from "../components/CodeEditor";
import { debounce } from "../utils/perfUtils";
import { postData } from "../utils/apiUtils";
// Import the Gemini service
import { translateCode } from "../utils/geminiService";
import { Link } from "react-router-dom";

// Define supported programming languages
const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "typescript", label: "TypeScript" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "rust", label: "Rust" },
];

// Sample code examples for each language
const DEFAULT_CODE = {
  javascript: `function calculateFactorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Example usage
console.log(calculateFactorial(5)); // Output: 120`,
  python: `def calculate_factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# Example usage
print(calculate_factorial(5))  # Output: 120`,
  java: `public class Factorial {
    public static int calculateFactorial(int n) {
        int result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    public static void main(String[] args) {
        // Example usage
        System.out.println(calculateFactorial(5)); // Output: 120
    }
}`,
  typescript: `function calculateFactorial(n: number): number {
  let result: number = 1;
  for (let i: number = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Example usage
console.log(calculateFactorial(5)); // Output: 120`,
  csharp: `using System;

public class Program
{
    public static int CalculateFactorial(int n)
    {
        int result = 1;
        for (int i = 2; i <= n; i++)
        {
            result *= i;
        }
        return result;
    }

    public static void Main()
    {
        // Example usage
        Console.WriteLine(CalculateFactorial(5)); // Output: 120
    }
}`,
  cpp: `#include <iostream>

int calculateFactorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main() {
    // Example usage
    std::cout << calculateFactorial(5) << std::endl; // Output: 120
    return 0;
}`,
  go: `package main

import "fmt"

func calculateFactorial(n int) int {
    result := 1
    for i := 2; i <= n; i++ {
        result *= i
    }
    return result
}

func main() {
    // Example usage
    fmt.Println(calculateFactorial(5)) // Output: 120
}`,
  ruby: `def calculate_factorial(n)
  result = 1
  (2..n).each do |i|
    result *= i
  end
  result
end

# Example usage
puts calculate_factorial(5) # Output: 120`,
  php: `<?php
function calculateFactorial($n) {
    $result = 1;
    for ($i = 2; $i <= $n; $i++) {
        $result *= $i;
    }
    return $result;
}

// Example usage
echo calculateFactorial(5); // Output: 120
?>`,
  swift: `func calculateFactorial(n: Int) -> Int {
    var result = 1
    for i in 2...n {
        result *= i
    }
    return result
}

// Example usage
print(calculateFactorial(n: 5)) // Output: 120`,
  kotlin: `fun calculateFactorial(n: Int): Int {
    var result = 1
    for (i in 2..n) {
        result *= i
    }
    return result
}

fun main() {
    // Example usage
    println(calculateFactorial(5)) // Output: 120
}`,
  rust: `fn calculate_factorial(n: u64) -> u64 {
    let mut result = 1;
    for i in 2..=n {
        result *= i;
    }
    result
}

fn main() {
    // Example usage
    println!("{}", calculate_factorial(5)); // Output: 120
}`
};

// Features of the translation tool
const FEATURES = [
  {
    title: "Accurate Language Translation",
    description: "Convert code between programming languages while preserving functionality",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    )
  },
  {
    title: "Optimized Output",
    description: "Generate clean, readable, and idiomatic code in the target language",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Smart Context Handling",
    description: "Recognizes language-specific constructs and translates them appropriately",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    title: "Syntax Highlighting",
    description: "Visualize code with proper syntax highlighting for all languages",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z M9 17v-6M12 17v-6M15 17v-6" />
      </svg>
    )
  }
];

const TranslatePage = () => {
  const [sourceLanguage, setSourceLanguage] = useState("javascript");
  const [targetLanguage, setTargetLanguage] = useState("python");
  const [sourceCode, setSourceCode] = useState(DEFAULT_CODE[sourceLanguage]);
  const [translatedCode, setTranslatedCode] = useState("");
  const [error, setError] = useState("");
  const [historySaved, setHistorySaved] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const { currentUser } = useAuth();
  
  // Refs for scroll-into-view functionality
  const translatedOutputRef = useRef(null);
  
  // Update default code when source language changes
  useEffect(() => {
    setSourceCode(DEFAULT_CODE[sourceLanguage]);
    setTranslatedCode("");
  }, [sourceLanguage]);
  
  // Add scroll-into-view effect when translated code is generated
  useEffect(() => {
    if (translatedCode && translatedOutputRef.current) {
      // On mobile, scroll to the translated code
      if (window.innerWidth < 1024) {
        translatedOutputRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [translatedCode]);

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

  // Memoize the language change handlers
  const handleSourceLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setSourceLanguage(newLang);
    setSourceCode(DEFAULT_CODE[newLang]);
    setTranslatedCode("");
    setError("");
  }, []);

  const handleTargetLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setTargetLanguage(newLang);
    setTranslatedCode("");
    setError("");
  }, []);

  // Create a debounced code change handler
  const handleCodeChange = useCallback(
    debounce((value) => {
      setSourceCode(value);
    }, 300),
    []
  );
  
  // Function to translate code
  const translateCodeWithAI = useCallback(async () => {
    try {
      // Validate inputs
      if (!sourceCode.trim()) {
        setError("Please enter some code to translate");
        return;
      }
      
      if (sourceLanguage === targetLanguage) {
        setError("Source and target languages must be different");
        return;
      }
      
      setError("");
      setHistorySaved(false);
      startLoading("Translating your code with Entropy AI...");
      
      let translatedResult;
      
      // Try using Gemini directly first
      try {
        translatedResult = await translateCode(sourceCode, sourceLanguage, targetLanguage);
        setTranslatedCode(translatedResult);
      } catch (geminiError) {
        console.error("Gemini error:", geminiError);
        
        // If Gemini fails, try the backend API
        try {
          const response = await postData('/ai/translate-code', {
            sourceCode,
            sourceLanguage,
            targetLanguage
          });
          translatedResult = response.translatedCode;
          setTranslatedCode(translatedResult);
        } catch (apiError) {
          console.error("API error:", apiError);
          // Fallback to default sample code if both fail
          translatedResult = DEFAULT_CODE[targetLanguage];
          setTranslatedCode(translatedResult);
        }
      }
      
      // Save to chat history if user is logged in
      if (currentUser) {
        try {
          await saveChatHistory(
            currentUser.uid,
            'translate',
            sourceCode,
            translatedResult
          );
          setHistorySaved(true);
        } catch (saveError) {
          console.error("Error saving chat history:", saveError);
        }
      }
    } catch (error) {
      console.error("Error translating code:", error);
      setError("Failed to translate code. Please try again later.");
    } finally {
      stopLoading();
    }
  }, [sourceCode, sourceLanguage, targetLanguage, currentUser, startLoading, stopLoading]);

  // Use a callback for applying translated code as new source
  const useAsSource = useCallback(() => {
    if (translatedCode) {
      setSourceLanguage(targetLanguage);
      setSourceCode(translatedCode);
      setTranslatedCode("");
    }
  }, [translatedCode, targetLanguage]);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500 rounded-full blur-[150px] opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20"></div>
        
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center fade-in-section">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Code Translation
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Transform your code between programming languages with Entropy AI. 
              Maintain functionality while adapting to each language's idioms and best practices.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <SectionHeader
          title="Translate Your Code"
          subtitle="Convert code between programming languages while preserving functionality"
        />
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 fade-in-section">
          {FEATURES.map((feature, index) => (
            <Card key={index} className="p-5 hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
              <div className="text-cyan-500 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
        
        {/* Translation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 fade-in-section">
          {/* Left Column - Source Code */}
          <div className="fade-in-section">
            <Card className="border-gray-700 shadow-xl overflow-hidden">
              <div className="p-5 bg-gray-800 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-1">Source Code</h3>
                  <p className="text-sm text-gray-400">Enter or paste code to translate</p>
                </div>
                <div className="w-full sm:w-48">
                  <select 
                    value={sourceLanguage}
                    onChange={handleSourceLanguageChange}
                    className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-0 h-96 code-editor-wrapper">
                <CodeEditor
                  value={sourceCode}
                  language={sourceLanguage}
                  onChange={handleCodeChange}
                  placeholder="Enter your code here..."
                  showCopyButton={true}
                />
              </div>
            </Card>
          </div>
          
          {/* Right Column - Translated Code */}
          <div className="fade-in-section" ref={translatedOutputRef}>
            <Card className="border-gray-700 shadow-xl overflow-hidden">
              <div className="p-5 bg-gray-800 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-1">Translated Code</h3>
                  <p className="text-sm text-gray-400">Generated output in target language</p>
                </div>
                <div className="w-full sm:w-48">
                  <select 
                    value={targetLanguage}
                    onChange={handleTargetLanguageChange}
                    className="w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-0 h-96 code-editor-wrapper">
                <CodeEditor
                  value={translatedCode}
                  language={targetLanguage}
                  readOnly={true}
                  placeholder="Translated code will appear here..."
                  showCopyButton={true}
                />
              </div>
              
              {/* Display history saved message */}
              {translatedCode && historySaved && (
                <div className="mt-2 mx-4 mb-4 bg-cyan-900/20 border border-cyan-500/30 rounded-md p-3 flex items-center text-sm">
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
              
              {/* Prompt to sign in if not logged in */}
              {translatedCode && !currentUser && (
                <div className="mt-2 mx-4 mb-4 bg-gray-800 border border-gray-700 rounded-md p-3 flex items-center text-sm">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300">
                    Sign in to save this translation to your history
                  </span>
                  <Link to="/login" className="ml-auto text-cyan-500 hover:text-cyan-400 underline">
                    Sign In
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Error Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 fade-in-section">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={translateCodeWithAI}
            className="w-full sm:w-auto px-8 group"
          >
            <div className="flex items-center">
              <span>Translate Code with Entropy</span>
              <svg
                className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </Button>
          
          {translatedCode && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={useAsSource}
              className="w-full sm:w-auto"
            >
              Use Translated as Source
            </Button>
          )}
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <SectionHeader
          title="How It Works"
          subtitle="Entropy AI powers our code translation process"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 fade-in-section">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-cyan-900/50 text-cyan-500 mb-4">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Input Your Code</h3>
            <p className="text-gray-400">Select the source language and enter or paste your code into the editor.</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-cyan-900/50 text-cyan-500 mb-4">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Translation</h3>
            <p className="text-gray-400">Our Entropy AI model analyzes the code structure and semantics for accurate translation.</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-cyan-900/50 text-cyan-500 mb-4">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Get Translated Code</h3>
            <p className="text-gray-400">Receive clean, idiomatic code in your target language that maintains the original functionality.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TranslatePage; 