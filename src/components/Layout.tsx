import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import UserIndicator from "@/components/UserIndicator";
import { HelpFloatingButton } from "@/components/help/HelpFloatingButton";
import { useCrispIntegration } from "@/hooks/useCrispIntegration";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Initialize enhanced Crisp integration
  useCrispIntegration();

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b border-border bg-card flex items-center px-4">
              <SidebarTrigger />
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-foreground">AutoPriceLabs</h1>
              </div>
              <div className="ml-auto">
                <UserIndicator />
              </div>
            </header>
            
            <main className="flex-1 overflow-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </div>
        
        <HelpFloatingButton />
        <Toaster />
        <Sonner />
      </SidebarProvider>
    </ErrorBoundary>
  );
}