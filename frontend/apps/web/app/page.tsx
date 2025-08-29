"use client";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to workflows page
    if (user && !isLoading) {
      router.push("/workflows");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-16">
          <div className="animate-spin mx-auto h-8 w-8 text-primary-600 mb-4">
            <svg fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-16">
          <div className="animate-spin mx-auto h-8 w-8 text-primary-600 mb-4">
            <svg fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted">Redirecting to workflows...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-accent-200/15 rounded-full blur-2xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Logo Animation with Enhanced Boundary */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-400 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 animate-pulse-glow transition-all duration-500"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 border-2 border-white/20 backdrop-blur-sm group-hover:scale-110 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                  <svg className="w-12 h-12 text-white drop-shadow-2xl relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-secondary-800 via-primary-700 to-secondary-700 bg-clip-text text-transparent mb-6 tracking-tight drop-shadow-lg">
              AI Workflow Builder
        </h1>
            
            <p className="text-2xl text-secondary-700 mb-4 font-medium drop-shadow-sm">
              End-to-End No-Code AI Automation Platform
            </p>
            
            <p className="text-xl text-secondary-600 mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-sm">
              Build, run, and scale AI-powered pipelines visually. Drag-and-drop workflow builder with 
              RAG Q&A, vector search, integrations, and production-grade scalability.
            </p>
            
            {/* Demo Video Section - Moved to Top */}
            <div className="mb-12">
              <div className="max-w-4xl mx-auto">
                <div className="relative group">
                  {/* Video Container with Enhanced Boundaries */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary-300 via-primary-400 to-secondary-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative bg-white/90 backdrop-blur-xl border-2 border-white/50 rounded-3xl p-3 shadow-2xl shadow-primary-500/10 hover:shadow-3xl hover:shadow-primary-500/15 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-transparent rounded-3xl"></div>
                    
                    <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl">
                      <video 
                        className="w-full h-auto rounded-2xl bg-secondary-100"
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        controls
                        onError={(e) => {
                          // Fallback if video fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      >
                        <source src="/AI_Workflow_Builder_Demo_Video.mp4" type="video/mp4" />
                      </video>
                      
                      {/* Fallback Content */}
                      <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-2xl p-8 text-center hidden">
                        <div className="max-w-md mx-auto">
                          <div className="relative group mb-4">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full blur opacity-20"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-6-10h.01M12 5V3m8 8h-2m-8 8h.01M3 12h2m8 8v-2" />
                              </svg>
                            </div>
                          </div>
                          <h4 className="text-lg font-bold text-secondary-900 mb-2">Platform Demo</h4>
                          <p className="text-secondary-600 text-sm">
                            See how easy it is to build AI workflows with drag-and-drop simplicity.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">Live Demo</span>
                    </div>
                  </div>
                </div>
                
                {/* Video Description */}
                <div className="text-center mt-4">
                  <p className="text-secondary-600 text-sm max-w-2xl mx-auto">
                    Watch how to build, connect, and execute AI workflows in minutes
                  </p>
                </div>
              </div>
            </div>
            
            {/* Clean CTA Buttons Section */}
            <div className="mb-16">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                <div className="relative group w-full sm:w-auto">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl blur-sm opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <Link href="/login" className="relative flex items-center justify-center w-full sm:w-auto btn-primary text-lg px-8 py-4 rounded-xl shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transition-all duration-300 border border-primary-300/30 backdrop-blur-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Start Building Now
          </Link>
                </div>
                
                <div className="relative group w-full sm:w-auto">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary-300 to-secondary-400 rounded-xl blur-sm opacity-15 group-hover:opacity-25 transition-opacity duration-300"></div>
                  <Link href="#features" className="relative flex items-center justify-center w-full sm:w-auto bg-white/90 backdrop-blur-sm text-secondary-700 text-lg px-8 py-4 border border-secondary-300/50 rounded-xl hover:border-primary-400/50 hover:bg-white/95 transition-all duration-300 shadow-lg shadow-secondary-500/10 hover:shadow-xl hover:shadow-primary-500/15">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Explore Features
          </Link>
        </div>
              </div>
            </div>

            {/* Clean Technology Stack Badges */}
            <div className="border-t border-secondary-200/30 pt-12">
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-secondary-500 uppercase tracking-wider">Built with industry-leading technologies</p>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto">
                {[
                  { name: 'React Flow', color: 'from-blue-500 to-blue-600' },
                  { name: 'FastAPI', color: 'from-green-500 to-green-600' },
                  { name: 'MongoDB', color: 'from-green-600 to-green-700' },
                  { name: 'Redis', color: 'from-red-500 to-red-600' },
                  { name: 'Qdrant', color: 'from-purple-500 to-purple-600' },
                  { name: 'OpenAI', color: 'from-gray-700 to-gray-800' },
                  { name: 'LangChain', color: 'from-yellow-500 to-yellow-600' },
                  { name: 'Docker', color: 'from-blue-600 to-blue-700' },
                  { name: 'Next.js', color: 'from-gray-800 to-gray-900' },
                  { name: 'Tailwind', color: 'from-cyan-500 to-cyan-600' }
                ].map((tech, index) => (
                  <div key={`tech-${index}-${tech.name}`} className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${tech.color} rounded-full blur-sm opacity-0 group-hover:opacity-20 transition-opacity duration-200`}></div>
                    <span className="relative inline-block px-4 py-2 bg-white/70 backdrop-blur-sm border border-secondary-200/40 rounded-full text-secondary-700 font-medium text-sm shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 hover:scale-105">
                      {tech.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section with Enhanced Boundaries */}
      <section id="features" className="py-20 relative">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-y border-white/30"></div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-2xl blur opacity-20"></div>
              <h2 className="relative text-4xl font-bold text-secondary-900 mb-6 px-8 py-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg">
                AI-First Workflow Automation
              </h2>
            </div>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-md">
              Professional no-code platform for building sophisticated AI workflows at enterprise scale
            </p>
      </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Workflow Builder with Enhanced Boundary */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary-200 via-primary-300 to-primary-400 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-xl border-2 border-white/50 rounded-3xl p-8 shadow-2xl shadow-primary-500/10 hover:shadow-3xl hover:shadow-primary-500/20 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="card-header">
                    <div className="relative group/icon">
                      <div className="absolute -inset-2 bg-gradient-to-br from-primary-300 to-primary-500 rounded-2xl blur opacity-40"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30 border border-primary-300/50 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-4">Visual Workflow Builder</h3>
                  </div>
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    Drag-and-drop interface powered by React Flow. Build complex AI pipelines with 
                    data ingestion, processing, and output nodes.
                  </p>
                  <ul className="space-y-3 text-sm text-secondary-600">
                    {['PDF, URL, Webhook data sources', 'Real-time visual pipeline design', 'Version control & collaboration'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 p-2 bg-primary-50/50 rounded-lg border border-primary-100/50">
                        <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-sm"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* AI-Native Nodes with Enhanced Boundary */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-success-200 via-success-300 to-success-400 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-xl border-2 border-white/50 rounded-3xl p-8 shadow-2xl shadow-success-500/10 hover:shadow-3xl hover:shadow-success-500/20 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-success-50/50 to-transparent rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="card-header">
                    <div className="relative group/icon">
                      <div className="absolute -inset-2 bg-gradient-to-br from-success-300 to-success-500 rounded-2xl blur opacity-40"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-success-400 to-success-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-success-500/30 border border-success-300/50 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-4">AI-Native Processing</h3>
                  </div>
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    Powered by OpenAI and LangChain. RAG Q&A, summarization, classification, 
                    and semantic search with vector databases.
                  </p>
                  <ul className="space-y-3 text-sm text-secondary-600">
                    {['RAG Q&A with embeddings', 'Qdrant/Chroma vector search', 'Advanced prompt engineering'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 p-2 bg-success-50/50 rounded-lg border border-success-100/50">
                        <div className="w-2 h-2 bg-gradient-to-r from-success-500 to-success-600 rounded-full shadow-sm"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Integrations with Enhanced Boundary */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-accent-200 via-accent-300 to-accent-400 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-xl border-2 border-white/50 rounded-3xl p-8 shadow-2xl shadow-accent-500/10 hover:shadow-3xl hover:shadow-accent-500/20 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-50/50 to-transparent rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="card-header">
                    <div className="relative group/icon">
                      <div className="absolute -inset-2 bg-gradient-to-br from-accent-300 to-accent-500 rounded-2xl blur opacity-40"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-accent-500/30 border border-accent-300/50 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 mb-4">Enterprise Integrations</h3>
                  </div>
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    Connect to your existing tools and services. Output to Slack, Google Sheets, 
                    Email, Notion, Twilio, and custom webhooks.
                  </p>
                  <ul className="space-y-3 text-sm text-secondary-600">
                    {['Slack, Email, SMS notifications', 'Google Sheets, Notion APIs', 'Custom webhooks & REST APIs'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 p-2 bg-accent-50/50 rounded-lg border border-accent-100/50">
                        <div className="w-2 h-2 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full shadow-sm"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack with Enhanced Boundaries */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/80 to-primary-50/80 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <div className="absolute -inset-3 bg-gradient-to-r from-secondary-300 to-primary-300 rounded-3xl blur-lg opacity-20"></div>
              <h2 className="relative text-4xl font-bold text-secondary-900 mb-6 px-10 py-6 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-white/50 shadow-xl">
                Modern Technology Stack
              </h2>
            </div>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/40 shadow-lg">
              Built with cutting-edge technologies for performance, scalability, and reliability
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                category: "Frontend",
                technologies: ["React", "Next.js", "Tailwind CSS", "React Flow"],
                icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                color: "from-blue-400 to-blue-600",
                borderColor: "border-blue-200/60",
                bgColor: "from-blue-50/50"
              },
              {
                category: "Backend",
                technologies: ["Python", "FastAPI", "Dramatiq", "Async Workers"],
                icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2",
                color: "from-green-400 to-green-600",
                borderColor: "border-green-200/60",
                bgColor: "from-green-50/50"
              },
              {
                category: "Data Layer",
                technologies: ["MongoDB", "Redis", "Qdrant", "Vector Search"],
                icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
                color: "from-purple-400 to-purple-600",
                borderColor: "border-purple-200/60",
                bgColor: "from-purple-50/50"
              },
              {
                category: "Infrastructure",
                technologies: ["Docker", "Nginx", "CI/CD", "Monitoring"],
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                color: "from-orange-400 to-orange-600",
                borderColor: "border-orange-200/60",
                bgColor: "from-orange-50/50"
              }
            ].map((stack, index) => (
              <div key={index} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-br ${stack.color} rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300`}></div>
                <div className={`relative bg-white/90 backdrop-blur-xl border-2 ${stack.borderColor} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${stack.bgColor} to-transparent rounded-3xl`}></div>
                  <div className="relative z-10 text-center">
                    <div className="relative group/tech-icon">
                      <div className={`absolute -inset-1 bg-gradient-to-br ${stack.color} rounded-2xl blur opacity-30`}></div>
                      <div className={`relative w-14 h-14 bg-gradient-to-br ${stack.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/30 group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stack.icon} />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 mb-6">{stack.category}</h3>
                    <div className="space-y-3">
                      {stack.technologies.map((tech) => (
                        <div key={tech} className="relative group/tag">
                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${stack.color} rounded-xl blur opacity-20 group-hover/tag:opacity-40 transition-opacity duration-200`}></div>
                          <div className={`relative px-4 py-2 bg-gradient-to-r ${stack.bgColor} to-white/60 rounded-xl text-sm text-secondary-700 font-medium border ${stack.borderColor} shadow-sm hover:shadow-md transition-all duration-200`}>
                            {tech}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features with Enhanced Dark Boundaries */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-900 via-primary-900 to-secondary-800"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-900/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="relative inline-block">
              <div className="absolute -inset-3 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-3xl blur-xl opacity-30"></div>
              <h2 className="relative text-4xl font-bold text-white mb-6 px-10 py-6 bg-white/10 backdrop-blur-xl rounded-3xl border-2 border-white/20 shadow-2xl">
                Enterprise Features
              </h2>
            </div>
            <p className="text-xl text-secondary-200 max-w-3xl mx-auto bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg">
              Production-ready features for scalable, reliable workflow automation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Workflow Execution Engine",
                description: "FastAPI + Redis Queue workers with scheduling, retries, and feedback loops",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                gradient: "from-primary-400 to-primary-600"
              },
              {
                title: "Observability & Metrics",
                description: "Prometheus/Grafana integration with detailed run logs and performance monitoring",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                gradient: "from-success-400 to-success-600"
              },
              {
                title: "Security & SSL",
                description: "Let's Encrypt SSL, secure API authentication, and enterprise-grade security",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                gradient: "from-accent-400 to-accent-600"
              },
              {
                title: "Auto-scaling",
                description: "Container orchestration with Docker and horizontal scaling capabilities",
                icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
                gradient: "from-warning-400 to-warning-600"
              },
              {
                title: "CI/CD Pipeline",
                description: "GitHub Actions automated deployment with testing and quality gates",
                icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                gradient: "from-blue-400 to-blue-600"
              },
              {
                title: "API Management",
                description: "RESTful APIs, rate limiting, authentication, and comprehensive documentation",
                icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                gradient: "from-purple-400 to-purple-600"
              }
            ].map((feature, index) => (
              <div key={index} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300`}></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                  <div className="relative z-10">
                    <div className="relative group/enterprise-icon">
                      <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} rounded-2xl blur opacity-40`}></div>
                      <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/20 group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-secondary-200 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Clean & Professional */}
      <section className="py-16 bg-gradient-to-br from-secondary-50 to-primary-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 border border-secondary-200/50 shadow-lg">
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">
              Ready to Build AI Workflows?
            </h2>
            <p className="text-lg text-secondary-600 mb-8 max-w-2xl mx-auto">
              Join the future of no-code AI automation. Start building sophisticated workflows today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
              <Link 
                href="/login" 
                className="flex items-center justify-center btn-primary text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Free Trial
              </Link>
              
              <Link 
                href="#" 
                className="flex items-center justify-center bg-white text-secondary-700 text-lg px-8 py-3 border border-secondary-300 rounded-xl hover:border-primary-400 hover:bg-secondary-50 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
  );
}
