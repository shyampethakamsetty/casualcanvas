"use client";
import { useAuth } from "../lib/auth";
import Link from "next/link";

export function Header() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <header className="bg-white/80 backdrop-blur-lg border-b border-secondary-200/50 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="heading-lg">CasualCanvas</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="animate-pulse bg-secondary-200 rounded-lg h-6 w-20"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-secondary-200/50 shadow-soft">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center group-hover:shadow-medium transition-shadow duration-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="heading-lg group-hover:text-primary-700 transition-colors duration-200">
        CasualCanvas
            </h1>
      </Link>
      
          <nav className="flex items-center space-x-6">
        {user ? (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  <Link href="/workflows" className="nav-link">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
              Workflows
            </Link>
                  <Link href="/uploads" className="nav-link">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
              Uploads
            </Link>
                </div>
                
                <div className="flex items-center space-x-4 pl-6 border-l border-secondary-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.email.charAt(0).toUpperCase()}
            </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-secondary-700">{user.email}</p>
                      <p className="text-xs text-secondary-500">Active</p>
                    </div>
                  </div>
                  
            <button
              onClick={logout}
                    className="btn-ghost text-accent-600 hover:text-accent-700 hover:bg-accent-50"
            >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
              Logout
            </button>
                </div>
              </div>
        ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="nav-link">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
            Login
          </Link>
                                <Link href={"/login" as any} className="btn-primary">
                Get Started
                </Link>
              </div>
        )}
      </nav>
        </div>
      </div>
    </header>
  );
} 