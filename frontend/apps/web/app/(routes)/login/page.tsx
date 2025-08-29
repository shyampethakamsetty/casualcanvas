"use client";
import { useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login"|"register">("login");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setMsg("Please enter both email and password.");
      return;
    }
    
    setIsLoading(true);
    try {
      const r = await api.post("/auth/login", { email, password });
      const accessToken = r.access_token;
      const refreshToken = r.refresh_token;
      
      if (accessToken && refreshToken) {
        // Use the auth context to login and redirect with both tokens
        await login(accessToken, refreshToken);
        setMsg("Login successful! Redirecting...");
      } else {
        setMsg("Invalid response from server.");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Login failed. Please try again.";
      setMsg(errorMsg);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setMsg("Please enter both email and password.");
      return;
    }
    
    setIsLoading(true);
    try {
      const requestData: any = { email, password };
      if (name.trim()) {
        requestData.name = name.trim();
      }
      
      const r = await api.post("/auth/register", requestData);
      const accessToken = r.access_token;
      const refreshToken = r.refresh_token;
      
      if (accessToken && refreshToken) {
        // Use the auth context to login and redirect with both tokens
        await login(accessToken, refreshToken);
        setMsg("Account created successfully! Redirecting...");
      } else {
        setMsg("Invalid response from server.");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Registration failed. Please try again.";
      setMsg(errorMsg);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-100 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-accent-200/15 rounded-full blur-2xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Login/Register Card with Enhanced Boundary */}
        <div className="relative group">
          {/* Outer glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-400 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
          
          {/* Main card with beautiful boundary */}
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-primary-500/10 p-8 animate-fade-in hover:shadow-3xl hover:shadow-primary-500/15 transition-all duration-300">
            {/* Inner border gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10 p-px">
              <div className="w-full h-full bg-white/80 rounded-2xl"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                {/* Logo/Brand with enhanced styling */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur-md opacity-30"></div>
                  <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/25 border border-primary-400/20">
                    <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary-800 via-primary-700 to-secondary-700 bg-clip-text text-transparent mb-3">
                  AI Workflow Builder
                </h1>
                <p className="text-secondary-600 font-medium">
                  {mode === "login" ? "Welcome back! Sign in to your account" : "Create your account to get started"}
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-5">
                  <div className="input-group">
                    <label className="label font-semibold text-secondary-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <input 
                        className="input pl-12 bg-white/70 border-secondary-200/60 focus:border-primary-400 focus:ring-primary-400/20 focus:bg-white transition-all duration-200 shadow-sm" 
                        type="email"
                        placeholder="you@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label className="label font-semibold text-secondary-700">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        className="input pl-12 bg-white/70 border-secondary-200/60 focus:border-primary-400 focus:ring-primary-400/20 focus:bg-white transition-all duration-200 shadow-sm" 
                        type="password"
                        placeholder="Enter your password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {mode === "register" && (
                    <div className="input-group">
                      <label className="label font-semibold text-secondary-700">
                        Name <span className="text-secondary-500 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input 
                          className="input pl-12 bg-white/70 border-secondary-200/60 focus:border-primary-400 focus:ring-primary-400/20 focus:bg-white transition-all duration-200 shadow-sm" 
                          type="text"
                          placeholder="Your full name" 
                          value={name} 
                          onChange={e => setName(e.target.value)}
                          disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  className="btn-primary w-full relative overflow-hidden group shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                  onClick={mode === "login" ? handleLogin : handleRegister}
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {mode === "login" ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mode === "login" ? "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
                        </svg>
                        {mode === "login" ? "Sign In" : "Create Account"}
                      </>
                    )}
                  </div>
                </button>
                
                <div className="text-center">
                  <button 
                    className="text-sm text-secondary-600 hover:text-primary-600 transition-colors duration-200 underline decoration-secondary-300 hover:decoration-primary-400 underline-offset-4"
                    onClick={() => {
                      setMode(mode === "login" ? "register" : "login");
                      setMsg("");
                      setPassword("");
                      setName("");
                    }}
                    disabled={isLoading}
                  >
                    {mode === "login" 
                      ? "Don't have an account? Create one" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>
                
                {msg && (
                  <div className={`p-4 rounded-xl border-2 text-sm shadow-lg ${
                    msg.includes("successful") 
                      ? "bg-gradient-to-r from-success-50 to-success-100 text-success-800 border-success-200/60 shadow-success-500/10" 
                      : "bg-gradient-to-r from-accent-50 to-accent-100 text-accent-800 border-accent-200/60 shadow-accent-500/10"
                  }`}>
                    <div className="flex items-center gap-3">
                      {msg.includes("successful") ? (
                        <div className="flex-shrink-0 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium">{msg}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-secondary-500/80 font-medium">
            Professional no-code AI workflow automation platform
          </p>
        </div>
      </div>
    </div>
  );
}
