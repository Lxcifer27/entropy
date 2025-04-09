import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FeatureCard = ({ icon, title, description, linkTo, delay = 0 }) => (
  <div 
    className="fade-in-section card-hover" 
    style={{ animationDelay: `${delay}ms` }}
  >
    <Card className="h-full flex flex-col">
      <div className="bg-cyan-900/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4 text-cyan-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4 flex-grow">{description}</p>
      <Link to={linkTo} className="mt-auto">
        <Button variant="outline" className="w-full">
          <span className="flex items-center justify-center gap-2">
            Try it now
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </Button>
      </Link>
    </Card>
  </div>
);

const HomePage = () => {
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  
  // Setup scroll animations
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
    
    // Hero animation
    setIsHeroVisible(true);
    
    return () => {
      // Cleanup observer on component unmount
      document.querySelectorAll('.fade-in-section').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-64 h-64 rounded-full bg-cyan-600 blur-3xl -top-10 -right-16 transform rotate-45"></div>
          <div className="absolute w-96 h-96 rounded-full bg-indigo-700 blur-3xl -bottom-20 -left-20 transform rotate-45"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 transform ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Elevate Your Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Quality</span> with AI
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Get instant code reviews, optimizations, and beautiful code snapshots powered by advanced AI technology.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/review">
                  <Button className="py-3 px-6 text-base font-medium">
                    Start Code Review
                  </Button>
                </Link>
                <Link to="/enhance">
                  <Button variant="outline" className="py-3 px-6 text-base font-medium">
                    Enhance My Code
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-300 transform ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
                <div className="p-2 bg-gray-900 border-b border-gray-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">main.js</div>
                </div>
                <div className="p-4 font-mono text-sm text-gray-300 overflow-hidden relative">
                  <pre className="whitespace-pre-wrap">
                    <code className="language-javascript">
                      <span className="text-blue-400">function</span> <span className="text-yellow-300">calculateTotal</span><span className="text-gray-400">(</span><span className="text-cyan-300">items</span><span className="text-gray-400">)</span> <span className="text-gray-400">{"{"}</span>
                      <br />
                      {"  "}<span className="text-blue-400">let</span> total <span className="text-gray-400">=</span> <span className="text-purple-400">0</span><span className="text-gray-400">;</span>
                      <br />
                      {"  "}<span className="text-blue-400">for</span> <span className="text-gray-400">(</span><span className="text-blue-400">let</span> i <span className="text-gray-400">=</span> <span className="text-purple-400">0</span><span className="text-gray-400">;</span> i <span className="text-gray-400">{"<"}</span> items<span className="text-gray-400">.</span>length<span className="text-gray-400">;</span> i<span className="text-gray-400">++)</span> <span className="text-gray-400">{"{"}</span>
                      <br />
                      {"    "}total <span className="text-gray-400">+=</span> items<span className="text-gray-400">[</span>i<span className="text-gray-400">].</span>price<span className="text-gray-400">;</span>
                      <br />
                      {"  "}<span className="text-gray-400">{"}"}</span>
                      <br />
                      {"  "}<span className="text-blue-400">return</span> total<span className="text-gray-400">;</span>
                      <br />
                      <span className="text-gray-400">{"}"}</span>
                    </code>
                  </pre>
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-70">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>Performance issue</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Documentation needed</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-900 border-t border-gray-800">
                  <div className="text-xs text-cyan-400 animate-pulse flex items-center">
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5v15m7.5-7.5h-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    AI analyzing your code...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in-section">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Enhance Your Development Workflow
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our AI-powered tools help you write better code, faster with intelligent feedback and optimizations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 14.5L12.5 17.5L22 8M8.5 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.71569 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.0799 20 5.2 20H12M19 8V4M19 4H15M19 4L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Code Review"
              description="Get expert-level code reviews instantly with detailed feedback on quality, performance, and security."
              linkTo="/review"
              delay={100}
            />
            
            <FeatureCard 
              icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Code Enhancement"
              description="Optimize your code automatically with AI-powered enhancements for better performance and readability."
              linkTo="/enhance"
              delay={200}
            />
            
            <FeatureCard 
              icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 7h1a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2h1M15 7V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2M15 7H9M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Code Snapshots"
              description="Create beautiful, shareable code images with syntax highlighting and professional styling."
              linkTo="/snapshot"
              delay={300}
            />
            
            <FeatureCard 
              icon={
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke="currentColor" />
                </svg>
              }
              title="Code Translation"
              description="Translate your code between programming languages using Entropy AI while preserving functionality."
              linkTo="/translate"
              delay={400}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-64 h-64 rounded-full bg-blue-600 blur-3xl top-20 right-20 transform rotate-45"></div>
          <div className="absolute w-64 h-64 rounded-full bg-cyan-700 blur-3xl bottom-10 left-20 transform rotate-45"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center fade-in-section">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Elevate Your Code?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are writing better code with our AI tools.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/review">
              <Button className="py-3 px-8 text-base font-medium">
                Get Started Now
              </Button>
            </Link>
            <Link to="/snapshot">
              <Button variant="outline" className="py-3 px-8 text-base font-medium">
                Try Code Snapshots
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 