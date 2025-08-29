"use client";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Full-screen layout for workflow editor (but still with header)
  const isWorkflowEditor = pathname?.includes('/workflows/') && pathname !== '/workflows';
  
  return (
    <div className="h-full flex flex-col">
      {/* Header - Always present on every page */}
      <Header />
      
      {/* Main content area */}
      {isWorkflowEditor ? (
        // Workflow editor gets remaining space without footer
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      ) : (
        // Regular pages get normal layout with footer
        <>
          <main className="flex-1 overflow-auto">
            <div className="h-full">
              {children}
            </div>
          </main>
          
          {/* Footer for non-workflow pages */}
          <footer className="bg-white/80 backdrop-blur-sm border-t border-secondary-200/50 py-4 flex-shrink-0">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between text-sm text-secondary-600">
                <p>© 2025 AI Workflow Builder. Professional automation platform.</p>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    System Online
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
} 