import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useEffect, useRef } from "react";

const FeedbackDisplay = ({ feedback, className = "" }) => {
  const feedbackRef = useRef(null);

  useEffect(() => {
    // Add smooth animation when feedback changes
    if (feedbackRef.current && feedback) {
      feedbackRef.current.classList.add("opacity-0");
      setTimeout(() => {
        feedbackRef.current.classList.remove("opacity-0");
      }, 50);
    }
    
    // Apply custom styles for progress bars and other elements if feedback exists
    if (feedback) {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .prose .bg-gradient-to-r {
          background-image: linear-gradient(to right, var(--tw-gradient-stops));
        }
        
        .prose .from-gray-800 {
          --tw-gradient-from: rgb(31, 41, 55);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(31, 41, 55 / 0));
        }
        
        .prose .to-gray-900 {
          --tw-gradient-to: rgb(17, 24, 39);
        }
        
        .prose .border-gray-700 {
          border-color: rgb(55, 65, 81);
        }
        
        .prose .bg-gray-800 {
          background-color: rgb(31, 41, 55);
        }
        
        .prose .bg-gray-700 {
          background-color: rgb(55, 65, 81);
        }
        
        .prose .from-cyan-500 {
          --tw-gradient-from: rgb(6, 182, 212);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(6, 182, 212 / 0));
        }
        
        .prose .to-blue-500 {
          --tw-gradient-to: rgb(59, 130, 246);
        }
        
        .prose .flex {
          display: flex;
        }
        
        .prose .items-center {
          align-items: center;
        }
        
        .prose .justify-between {
          justify-content: space-between;
        }
        
        .prose .mb-4 {
          margin-bottom: 1rem;
        }
        
        .prose .rounded-lg {
          border-radius: 0.5rem;
        }
        
        .prose .p-6 {
          padding: 1.5rem;
        }
        
        .prose .my-4 {
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        
        .prose .border {
          border-width: 1px;
        }
        
        .prose .text-xl {
          font-size: 1.25rem;
          line-height: 1.75rem;
        }
        
        .prose .text-2xl {
          font-size: 1.5rem;
          line-height: 2rem;
        }
        
        .prose .font-semibold {
          font-weight: 600;
        }
        
        .prose .w-full {
          width: 100%;
        }
        
        .prose .h-4 {
          height: 1rem;
        }
        
        .prose .rounded-full {
          border-radius: 9999px;
        }
        
        .prose .transition-all {
          transition-property: all;
        }
        
        .prose .duration-500 {
          transition-duration: 500ms;
        }
      `;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div 
      ref={feedbackRef}
      className={`transition-opacity duration-300 h-full overflow-auto ${className}`}
    >
      <div className="prose prose-invert prose-cyan max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : 'javascript';
              
              // For inline code - simple span-based element that can go inside paragraphs
              if (inline) {
                return (
                  <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200" {...props}>
                    {children}
                  </code>
                );
              }
              
              // For code blocks - rendered as a standalone block
              const codeBlock = (
                <SyntaxHighlighter
                  language={language}
                  style={{
                    ...vscDarkPlus,
                    'code[class*="language-"]': {
                      ...vscDarkPlus['code[class*="language-"]'],
                      background: 'transparent'
                    },
                    'pre[class*="language-"]': {
                      ...vscDarkPlus['pre[class*="language-"]'],
                      background: 'transparent'
                    }
                  }}
                  PreTag="div"
                  CodeTag="code"
                  customStyle={{
                    margin: '0',
                    padding: '1em',
                    borderRadius: '0.5em',
                    backgroundColor: 'rgb(30, 41, 59)',
                    background: 'rgb(30, 41, 59)'
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
              
              // Return the code block wrapped in a fragment to avoid nesting issues
              return (
                <>
                  <div className="not-prose relative group my-4">
                    <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                        }}
                        className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        Copy
                      </button>
                    </div>
                    {codeBlock}
                  </div>
                </>
              );
            },
            // Style tables
            table({ node, ...props }) {
              return (
                <div className="overflow-x-auto my-8">
                  <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg" {...props} />
                </div>
              );
            },
            thead({ node, ...props }) {
              return <thead className="bg-gray-800" {...props} />;
            },
            th({ node, ...props }) {
              return <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300" {...props} />;
            },
            td({ node, ...props }) {
              return <td className="px-4 py-3 text-sm border-t border-gray-700" {...props} />;
            },
            // Style blockquotes
            blockquote({ node, ...props }) {
              return (
                <blockquote 
                  className="border-l-4 border-cyan-500 pl-4 my-4 italic text-gray-400"
                  {...props}
                />
              );
            },
            // Style headings
            h1({ node, ...props }) {
              return <h1 className="text-3xl font-bold mb-4 text-white" {...props} />;
            },
            h2({ node, ...props }) {
              return <h2 className="text-2xl font-semibold mt-8 mb-4 text-white" {...props} />;
            },
            h3({ node, ...props }) {
              return <h3 className="text-xl font-semibold mt-6 mb-3 text-white" {...props} />;
            },
            // Style lists
            ul({ node, ...props }) {
              return <ul className="list-disc list-inside space-y-2 my-4" {...props} />;
            },
            ol({ node, ...props }) {
              return <ol className="list-decimal list-inside space-y-2 my-4" {...props} />;
            },
            // Style paragraphs - simplified to avoid nesting issues
            p({ children, ...props }) {
              return (
                <div className="my-4 text-gray-300 leading-relaxed" {...props}>
                  {children}
                </div>
              );
            },
            // Style links
            a({ node, ...props }) {
              return (
                <a
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              );
            },
            // Style divs (for custom containers)
            div({ node, className, ...props }) {
              // Preserve HTML classes in divs
              return <div className={className} {...props} />;
            },
            // Handle pre tags to avoid nesting issues
            pre({ node, ...props }) {
              // Use a div instead of pre directly to avoid nesting issues
              return <div className="pre-wrapper" {...props} />;
            },
          }}
        >
          {feedback}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default FeedbackDisplay; 