import { useEffect, useState, useCallback, memo, useRef, useMemo } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Import core language components only
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";

// Cache for loaded languages
const loadedLanguages = new Set(['javascript', 'jsx', 'typescript', 'python']);

// Debounce function for performance
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Lazy load additional language components
const loadLanguage = async (language) => {
  if (loadedLanguages.has(language)) return true;
  
  try {
    switch(language) {
      case 'java':
        await import("prismjs/components/prism-java");
        loadedLanguages.add('java');
        break;
      case 'csharp':
        await import("prismjs/components/prism-csharp");
        loadedLanguages.add('csharp');
        break;
      case 'cpp':
        await import("prismjs/components/prism-cpp");
        loadedLanguages.add('cpp');
        break;
      default:
        break;
    }
    return true;
  } catch (error) {
    console.warn(`Failed to load language: ${language}`, error);
    return false;
  }
};

const CodeEditor = ({
  value,
  onChange,
  language = "javascript",
  minHeight = "300px",
  placeholder = "// Enter your code here...",
  readOnly = false,
  showCopyButton = true,
}) => {
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const editorRef = useRef(null);
  const lastLanguage = useRef(language);

  // Memoize highlight function
  const highlightCode = useMemo(() => {
    return (code) => {
      if (!code) return '';
      try {
        return Prism.highlight(code, Prism.languages[language] || Prism.languages.javascript, language);
      } catch (error) {
        console.warn(`Highlighting failed for language: ${language}`);
        return code;
      }
    };
  }, [language]);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    debounce((value) => {
      onChange(value);
    }, 150),
    [onChange]
  );

  // Load language support
  useEffect(() => {
    if (language !== lastLanguage.current) {
      setIsLanguageLoading(true);
      loadLanguage(language).finally(() => {
        setIsLanguageLoading(false);
        lastLanguage.current = language;
      });
    }
  }, [language]);

  // Optimize copy to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [value]);

  // Handle editor focus
  const handleEditorFocus = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.style.outline = 'none';
      editorRef.current.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
    }
  }, []);

  // Handle editor blur
  const handleEditorBlur = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.style.boxShadow = 'none';
    }
  }, []);

  return (
    <div className="code-editor-wrapper h-full w-full rounded-md overflow-auto bg-gray-950 border border-gray-800 relative">
      {isLanguageLoading && (
        <div className="absolute top-2 left-2 bg-gray-800 text-xs text-cyan-400 py-1 px-2 rounded-md z-10 opacity-90">
          <div className="flex items-center">
            <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading syntax...
          </div>
        </div>
      )}
      
      {showCopyButton && (
        <button 
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white p-1.5 rounded-md z-10 opacity-80 hover:opacity-100 transition-opacity"
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copySuccess ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          )}
        </button>
      )}
      
      <Editor
        ref={editorRef}
        value={value}
        onValueChange={readOnly ? () => {} : debouncedOnChange}
        highlight={highlightCode}
        padding={16}
        placeholder={placeholder}
        className="code-editor h-full w-full"
        onFocus={handleEditorFocus}
        onBlur={handleEditorBlur}
        style={{
          fontFamily: '"Fira Code", "Fira Mono", monospace',
          fontSize: 15,
          minHeight: minHeight,
          height: "100%",
          backgroundColor: "transparent",
          caretColor: "#fff",
          overflow: "auto",
          contain: 'content',
          willChange: 'transform'
        }}
        textareaClassName={`focus:outline-none focus:ring-0 ${readOnly ? 'read-only' : ''}`}
        readOnly={readOnly}
        tabSize={2}
        insertSpaces={true}
      />
    </div>
  );
};

// Memoize the entire component with custom comparison
export default memo(CodeEditor, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.language === nextProps.language &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.showCopyButton === nextProps.showCopyButton
  );
}); 