// src/pages/public/general/FAQ.tsx

/**
 * @fileoverview DegenDuel FAQ page
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2024-03-14
 * @updated 2025-04-30
 */

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";

// FAQ page component
export const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("platform");
  const [openQuestions, setOpenQuestions] = useState<Record<string, number | null>>({
    platform: null,
    gettingStarted: null,
    contests: null,
    token: null
  });
  const [showMiniToc, setShowMiniToc] = useState<boolean>(false);
  
  // Refs for scroll functionality
  const platformRef = useRef<HTMLDivElement>(null);
  const gettingStartedRef = useRef<HTMLDivElement>(null);
  const contestsRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Helper function to get an array of refs guaranteed to have a current HTMLDivElement
  const getValidHookRefs = (
    refsList: React.RefObject<HTMLDivElement | null>[]
  ): React.RefObject<HTMLDivElement>[] => {
    return refsList.filter(
      (ref): ref is React.RefObject<HTMLDivElement> => ref.current !== null
    );
  };

  // Categories hierarchy for the TOC
  const categoryStructure = [
    {
      id: 'platform',
      title: 'Platform Basics',
      ref: platformRef,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      subcategories: [
        {
          id: 'gettingStarted',
          title: 'Getting Started',
          ref: gettingStartedRef,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
        },
        {
          id: 'contests',
          title: 'Contests',
          ref: contestsRef,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        }
      ]
    },
    {
      id: 'token',
      title: 'DUEL Token',
      ref: tokenRef,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      subcategories: []
    }
  ];

  // Categories and their FAQs
  const faqCategories = {
    
    platform: {
      title: "Platform Basics",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      questions: [
        {
          question: "What is DegenDuel?",
          answer: "DegenDuel is a competitive trading platform where you can test your trading skills against other players and AI agents in time-limited contests.",
        }
      ]
    },

    gettingStarted: {
      title: "Getting Started",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      questions: [
        {
          question: "How do I get started?",
          answer: "Simply connect your wallet, choose a contest that matches your skill level, and start trading! Check out our How It Works page for more details.",
        }
      ]
    },

    contests: {
      title: "Contests",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      questions: [
        {
          question: "How do contests work?",
          answer: "Each contest has a specific duration, entry fee, and prize pool. Players select tokens to create a portfolio and compete for the highest returns.",
        },
        {
          question: "What are the different difficulty levels?",
          answer: "We offer three difficulty levels: Guppy (beginner), Dolphin (intermediate), and Shark (advanced). Each level has different entry fees and prize pools.",
        },
        {
          question: "How are winners determined?",
          answer: "Winners are determined by their portfolio's percentage return at the end of the contest period. The higher your return, the better your ranking.",
        }
      ]
    },

    token: {
      title: "DUEL Token",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      questions: [
        {
          question: "What is the DUEL token?",
          answer: "The DUEL token is the native token of the DegenDuel platform that allows holders to receive a portion of the platform's profit.",
        }
      ]
    }
    
  };

  // Toggle question visibility within a category
  const toggleQuestion = (category: string, index: number) => {
    setOpenQuestions(prev => ({
      ...prev,
      [category]: prev[category] === index ? null : index
    }));
  };

  // Scroll to category section when sidebar item is clicked
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, category: string) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      setActiveCategory(category);
    }
  };

  // Show/hide mini TOC based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (tocRef.current && headerRef.current) {
        const tocBottom = tocRef.current.getBoundingClientRect().bottom;
        setShowMiniToc(tocBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Observe which section is in view for sidebar highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveCategory(id);
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = [
      { ref: platformRef, id: 'platform' },
      { ref: gettingStartedRef, id: 'gettingStarted' },
      { ref: contestsRef, id: 'contests' },
      { ref: tokenRef, id: 'token' }
    ];

    sections.forEach(section => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    return () => {
      sections.forEach(section => {
        if (section.ref.current) {
          observer.unobserve(section.ref.current);
        }
      });
    };
  }, []);

  // Render a category section header with alternating gradient styles for visual interest
  const renderSectionHeader = (category: string, index: number) => {
    const categoryInfo = faqCategories[category as keyof typeof faqCategories];
    
    // Create alternating gradient styles based on index
    const gradientClasses = [
      "from-brand-500/20 to-purple-600/20", // For even indices
      "from-blue-500/20 to-cyan-600/20"     // For odd indices
    ];
    
    return (
      <div className={`sticky top-0 z-10 -mt-6 pt-6 pb-3 px-4 -mx-4 backdrop-blur-md 
                       bg-gradient-to-r ${gradientClasses[index % 2]} 
                       border-b border-dark-300/70 transition-all duration-300`}>
        <div className="flex items-center">
          <span className="text-brand-400 mr-3">{categoryInfo.icon}</span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {categoryInfo.title}
          </h2>
          <div className="ml-auto text-xs text-gray-400 font-mono rounded-full px-2 py-0.5 bg-dark-800/40 border border-dark-700/40">
            Section {index + 1}/{Object.keys(faqCategories).length}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-16">
      {/* Header */}
      <div ref={headerRef} className="text-center mb-12 relative group max-w-4xl mx-auto px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <h1 className="text-4xl font-bold text-gray-100 relative">
          Frequently Asked Questions
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          Everything you need to know about DegenDuel
        </p>
      </div>

      {/* Floating mini TOC that appears when scrolling past the main TOC */}
      {showMiniToc && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-xl w-full px-4">
          <div className="bg-dark-200/90 backdrop-blur-md border border-dark-300 rounded-lg shadow-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-200 font-medium">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>Currently viewing: </span>
              <span className="text-brand-400">{faqCategories[activeCategory as keyof typeof faqCategories]?.title}</span>
            </div>
            <div className="flex space-x-2">
              {categoryStructure.map((category) => (
                <button
                  key={category.id}
                  onClick={() => scrollToSection(category.ref, category.id)}
                  className={`p-2 rounded-md transition-colors ${
                    activeCategory === category.id || category.subcategories.some(sub => activeCategory === sub.id)
                      ? 'bg-brand-500/20 text-brand-400' 
                      : 'text-gray-400 hover:bg-dark-300/50 hover:text-gray-200'
                  }`}
                  title={category.title}
                >
                  {category.icon}
                </button>
              ))}
              <button 
                onClick={() => tocRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="p-2 rounded-md text-gray-400 hover:bg-dark-300/50 hover:text-gray-200 transition-colors"
                title="Back to Table of Contents"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table of Contents */}
      <div ref={tocRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-dark-200/80 backdrop-blur-md border border-dark-300 rounded-lg p-6 relative overflow-hidden group">
          {/* Animated background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/10 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
          
          <h2 className="text-2xl font-bold text-gray-100 mb-6 relative">
            Table of Contents
            <div className="absolute bottom-0 left-0 w-20 h-0.5 bg-brand-400"></div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryStructure.map((category) => (
              <div key={category.id} className="relative">
                <button 
                  onClick={() => scrollToSection(category.ref, category.id)}
                  className={`flex items-center w-full text-left mb-3 group`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-dark-300 text-gray-400 group-hover:bg-brand-500/20 group-hover:text-brand-400'
                  }`}>
                    {category.icon}
                  </div>
                  <span className={`text-lg font-semibold transition-colors ${
                    activeCategory === category.id 
                      ? 'text-brand-400' 
                      : 'text-gray-200 group-hover:text-brand-400'
                  }`}>
                    {category.title}
                  </span>
                </button>
                
                {/* Subcategories */}
                {category.subcategories.length > 0 && (
                  <div className="pl-11 space-y-2">
                    {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        onClick={() => scrollToSection(subcategory.ref, subcategory.id)}
                        className={`flex items-center w-full text-left group`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 transition-colors ${
                          activeCategory === subcategory.id 
                            ? 'bg-brand-500/70 text-white' 
                            : 'bg-dark-300/70 text-gray-400 group-hover:bg-brand-500/20 group-hover:text-brand-400'
                        }`}>
                          {subcategory.icon}
                        </div>
                        <span className={`transition-colors ${
                          activeCategory === subcategory.id 
                            ? 'text-brand-400' 
                            : 'text-gray-400 group-hover:text-brand-400'
                        }`}>
                          {subcategory.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Connecting lines for visual hierarchy */}
                {category.subcategories.length > 0 && (
                  <div className="absolute left-4 top-11 bottom-0 w-0.5 bg-dark-300"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Quick jump to questions hint */}
          <div className="mt-6 pt-4 border-t border-dark-300 text-center">
            <p className="text-gray-400 flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
              </svg>
              Click any category to jump directly to its section
            </p>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar navigation */}
        <div className="hidden lg:block lg:w-1/4">
          <div className="sticky top-24 bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-100 mb-4 pb-2 border-b border-dark-300">Categories</h2>
            <nav className="space-y-2">
              {Object.entries(faqCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => scrollToSection(
                    key === 'platform' ? platformRef : 
                    key === 'gettingStarted' ? gettingStartedRef : 
                    key === 'contests' ? contestsRef : tokenRef, 
                    key
                  )}
                  className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${
                    activeCategory === key 
                      ? 'bg-brand-500/20 text-brand-400' 
                      : 'text-gray-400 hover:bg-dark-300/50 hover:text-gray-200'
                  }`}
                >
                  <span className="mr-3">{category.icon}</span>
                  <span>{category.title}</span>
                </button>
              ))}
            </nav>
            
            {/* Back to top button */}
            <div className="mt-6 pt-4 border-t border-dark-300">
              <button 
                onClick={() => tocRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center w-full px-3 py-2 rounded-md text-gray-400 hover:bg-dark-300/50 hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:w-3/4 space-y-12">
          {/* Platform Basics */}
          <div id="platform" ref={platformRef} className="scroll-mt-24">
            {renderSectionHeader('platform', 0)}
            <div className="space-y-4 mt-4">
              {faqCategories.platform.questions.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
                  onClick={() => toggleQuestion('platform', index)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100"
                    style={{ animationDelay: `${index * 150}ms` }}
                  />
                  <CardContent className="p-6 relative cursor-pointer">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:animate-glitch">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          openQuestions.platform === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div
                      className={`mt-4 text-gray-400 transition-all duration-300 ${
                        openQuestions.platform === index
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <p className="group-hover:text-brand-400 transition-colors">{faq.answer}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div id="gettingStarted" ref={gettingStartedRef} className="scroll-mt-24">
            {renderSectionHeader('gettingStarted', 1)}
            <div className="space-y-4 mt-4">
              {faqCategories.gettingStarted.questions.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
                  onClick={() => toggleQuestion('gettingStarted', index)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100"
                    style={{ animationDelay: `${index * 150}ms` }}
                  />
                  <CardContent className="p-6 relative cursor-pointer">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:animate-glitch">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          openQuestions.gettingStarted === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div
                      className={`mt-4 text-gray-400 transition-all duration-300 ${
                        openQuestions.gettingStarted === index
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <p className="group-hover:text-brand-400 transition-colors">{faq.answer}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contests */}
          <div id="contests" ref={contestsRef} className="scroll-mt-24">
            {renderSectionHeader('contests', 2)}
            <div className="space-y-4 mt-4">
              {faqCategories.contests.questions.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
                  onClick={() => toggleQuestion('contests', index)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100"
                    style={{ animationDelay: `${index * 150}ms` }}
                  />
                  <CardContent className="p-6 relative cursor-pointer">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:animate-glitch">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          openQuestions.contests === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div
                      className={`mt-4 text-gray-400 transition-all duration-300 ${
                        openQuestions.contests === index
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <p className="group-hover:text-brand-400 transition-colors">{faq.answer}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* DUEL Token */}
          <div id="token" ref={tokenRef} className="scroll-mt-24">
            {renderSectionHeader('token', 3)}
            <div className="space-y-4 mt-4">
              {faqCategories.token.questions.map((faq, index) => (
                <Card
                  key={index}
                  className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
                  onClick={() => toggleQuestion('token', index)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100"
                    style={{ animationDelay: `${index * 150}ms` }}
                  />
                  <CardContent className="p-6 relative cursor-pointer">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:animate-glitch">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          openQuestions.token === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div
                      className={`mt-4 text-gray-400 transition-all duration-300 ${
                        openQuestions.token === index
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0 overflow-hidden"
                      }`}
                    >
                      <p className="group-hover:text-brand-400 transition-colors">{faq.answer}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <h2 className="text-2xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
              Still have questions?
            </h2>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              <span className="relative flex items-center font-medium group-hover:animate-glitch">
                Contact Support
                <svg
                  className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
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
              </span>
            </a>
          </div>
          
          {/* Mobile quick navigation buttons */}
          <div className="fixed bottom-4 right-4 lg:hidden">
            <div className="bg-dark-200/90 backdrop-blur-md border border-dark-300 rounded-full shadow-xl p-2 flex items-center space-x-2">
              <button 
                onClick={() => tocRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                title="Back to Table of Contents"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
