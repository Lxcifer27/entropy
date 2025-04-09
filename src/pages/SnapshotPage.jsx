import { useState, useRef, useEffect, useCallback } from "react";
import { useLoading } from "../context/LoadingContext";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import CodeEditor from "../components/CodeEditor";
// Dynamic import for performance
import { throttle } from "../utils/perfUtils";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "typescript", label: "TypeScript" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
];

const DEFAULT_CODE = {
  javascript: `function calculateSum(arr) {
  return arr.reduce((sum, current) => sum + current, 0);
}`,
  python: `def calculate_sum(arr):
    """Calculate the sum of all elements in an array"""
    return sum(arr)`,
  java: `public int calculateSum(int[] arr) {
    int sum = 0;
    for (int i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}`,
  typescript: `function calculateSum(arr: number[]): number {
  return arr.reduce((sum, current) => sum + current, 0);
}`,
  csharp: `public int CalculateSum(int[] arr) 
{
    return arr.Sum();
}`,
  cpp: `int calculateSum(std::vector<int> arr) {
    return std::accumulate(arr.begin(), arr.end(), 0);
}`,
};

const THEMES = [
  { id: "dark-cyan", name: "Dark Cyan", bgColor: "bg-gray-900", accentColor: "border-cyan-500", textColor: "text-cyan-400" },
  { id: "dark-purple", name: "Dark Purple", bgColor: "bg-gray-950", accentColor: "border-purple-500", textColor: "text-purple-400" },
  { id: "dark-green", name: "Dark Green", bgColor: "bg-gray-900", accentColor: "border-green-500", textColor: "text-green-400" },
  { id: "dark-orange", name: "Dark Orange", bgColor: "bg-gray-900", accentColor: "border-orange-500", textColor: "text-orange-400" },
  { id: "dark-pink", name: "Dark Pink", bgColor: "bg-gray-950", accentColor: "border-pink-500", textColor: "text-pink-400" },
  { id: "light-blue", name: "Light Blue", bgColor: "bg-white", accentColor: "border-blue-500", textColor: "text-blue-600" },
  { id: "light-gray", name: "Light Gray", bgColor: "bg-gray-100", accentColor: "border-gray-500", textColor: "text-gray-700" },
];

const SnapshotPage = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE[language]);
  const [title, setTitle] = useState("Code Snapshot");
  const [theme, setTheme] = useState(THEMES[0]);
  const [userName, setUserName] = useState("@yourusername");
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showFileName, setShowFileName] = useState(true);
  const [fileName, setFileName] = useState("script.js");
  const [includeCredit, setIncludeCredit] = useState(true);
  const [scale, setScale] = useState(2); // For high-quality export
  const [html2canvasModule, setHtml2canvasModule] = useState(null);
  
  const { startLoading, stopLoading } = useLoading();
  const snapshotRef = useRef(null);
  
  // Lazy load html2canvas
  useEffect(() => {
    const loadHtml2Canvas = async () => {
      try {
        startLoading("Loading snapshot capabilities...");
        // Import html2canvas dynamically
        const module = await import('html2canvas');
        setHtml2canvasModule(() => module.default);
        console.log("html2canvas loaded successfully");
      } catch (error) {
        console.error("Failed to load html2canvas:", error);
      } finally {
        stopLoading();
      }
    };
    
    loadHtml2Canvas();
  }, [startLoading, stopLoading]);
  
  // Update file extension when language changes
  useEffect(() => {
    const fileExtensions = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
      cpp: "cpp"
    };
    
    setFileName(`script.${fileExtensions[language] || "txt"}`);
  }, [language]);

  // Memoize the language change handler for better performance
  const handleLanguageChange = useCallback((e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
  }, []);
  
  // Memoize the theme change handler
  const handleThemeChange = useCallback((themeId) => {
    const selectedTheme = THEMES.find(t => t.id === themeId);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  }, []);
  
  // Throttle code updates to prevent excessive re-renders
  const handleCodeChange = useCallback(throttle((value) => {
    setCode(value);
  }, 300), []);
  
  const downloadSnapshot = async () => {
    if (!snapshotRef.current || !html2canvasModule) {
      console.error("Cannot create snapshot: missing reference or html2canvas module");
      return;
    }
    
    try {
      startLoading("Creating snapshot...");
      console.log("Starting snapshot creation");
      
      // Use html2canvas to capture the snapshot
      const canvas = await html2canvasModule(snapshotRef.current, {
        scale: scale,
        backgroundColor: theme.id.startsWith("dark") ? "#111827" : "#ffffff",
        logging: true,
        useCORS: true
      });
      
      console.log("Canvas created, converting to PNG");
      
      // Convert to blob
      const blob = await new Promise((resolve, reject) => {
        try {
          canvas.toBlob(resolve, "image/png");
        } catch (error) {
          reject(error);
        }
      });
      
      if (!blob) {
        throw new Error("Failed to create image blob");
      }
      
      console.log("PNG blob created, preparing download");
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_snapshot.png`;
      document.body.appendChild(link);
      
      console.log("Download link created, initiating download");
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("Download completed");
      
    } catch (error) {
      console.error("Error creating snapshot:", error);
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="content-wrapper page-wrapper">
      <div className="page-container py-8 px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Create Code Snapshots"
          subtitle="Generate beautiful code images for sharing on social media platforms"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Configuration Panel */}
          <Card
            title="Snapshot Configuration"
            subtitle="Customize your code snapshot"
            className="h-full flex flex-col"
          >
            <div className="flex flex-col gap-6">
              {/* Basic Settings */}
              <div>
                <h3 className="text-white font-medium mb-3">Basic Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm text-gray-400 mb-1">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm text-gray-400 mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="language-select" className="block text-sm text-gray-400 mb-1">
                      Language
                    </label>
                    <select
                      id="language-select"
                      value={language}
                      onChange={handleLanguageChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="filename" className="block text-sm text-gray-400 mb-1">
                      File Name
                    </label>
                    <input
                      id="filename"
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      disabled={!showFileName}
                    />
                  </div>
                </div>
              </div>
                
              {/* Theme Selection */}
              <div>
                <h3 className="text-white font-medium mb-3">Theme</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {THEMES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`${t.bgColor} cursor-pointer border-2 rounded h-12 flex items-center justify-center ${
                        theme.id === t.id ? `${t.accentColor} border-2` : "border-transparent hover:border-gray-600"
                      }`}
                    >
                      <span className={`text-xs font-medium ${t.id.startsWith("light") ? "text-gray-800" : "text-white"}`}>
                        {t.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Display Options */}
              <div>
                <h3 className="text-white font-medium mb-3">Display Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="show-line-numbers"
                      type="checkbox"
                      checked={showLineNumbers}
                      onChange={(e) => setShowLineNumbers(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                    />
                    <label htmlFor="show-line-numbers" className="ml-2 text-sm text-gray-300">
                      Show Line Numbers
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="show-filename"
                      type="checkbox"
                      checked={showFileName}
                      onChange={(e) => setShowFileName(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                    />
                    <label htmlFor="show-filename" className="ml-2 text-sm text-gray-300">
                      Show File Name
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="include-credit"
                      type="checkbox"
                      checked={includeCredit}
                      onChange={(e) => setIncludeCredit(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                    />
                    <label htmlFor="include-credit" className="ml-2 text-sm text-gray-300">
                      Include Username
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Snapshot Preview */}
          <div>
            <Card title="Snapshot Preview" subtitle="Real-time preview of your code snapshot" className="h-full">
              <div
                ref={snapshotRef}
                className={`rounded-lg overflow-hidden ${theme.bgColor} shadow-lg p-6 max-w-2xl mx-auto`}
                style={{ minHeight: "300px" }}
              >
                {/* Snapshot Header */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${theme.id.startsWith("light") ? "text-gray-800" : "text-white"}`}>
                      {title}
                    </h3>
                    {showFileName && (
                      <p className={`text-sm ${theme.id.startsWith("light") ? "text-gray-600" : "text-gray-400"}`}>
                        {fileName}
                      </p>
                    )}
                  </div>
                  {includeCredit && (
                    <div className={`text-sm font-medium ${theme.textColor}`}>
                      {userName}
                    </div>
                  )}
                </div>
                
                {/* Code Editor */}
                <div className={`rounded border ${theme.accentColor}`}>
                  <CodeEditor
                    value={code}
                    language={language}
                    onChange={handleCodeChange}
                    placeholder="Enter your code"
                    padding={16}
                    showLineNumbers={showLineNumbers}
                    highlight={true}
                    showCopyButton={false}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "14px",
                      backgroundColor: theme.id.startsWith("light") ? "#f8fafc" : "#1e293b",
                      color: theme.id.startsWith("light") ? "#334155" : "#e2e8f0"
                    }}
                  />
                </div>
              </div>
              
              {/* Download button */}
              <div className="flex-1 flex items-end mt-4">
                <Button 
                  onClick={downloadSnapshot}
                  disabled={!html2canvasModule}
                  className="w-full group relative overflow-hidden"
                  secondary
                >
                  <div className="relative z-10 flex items-center justify-center">
                    {!html2canvasModule ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading Download Capabilities...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 transition-transform group-hover:translate-y-0.5 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Download Snapshot
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotPage; 