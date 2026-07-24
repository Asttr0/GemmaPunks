import * as React from "react";
import { Sidebar, SidebarSpacer } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  title: string;
  description?: string;
  portalAccent?: "merchant" | "supplier";
  children: React.ReactNode;
}

export function AppLayout({
  title,
  description,
  portalAccent = "merchant",
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar portalAccent={portalAccent} />
      
      <div className="lg:pl-[240px]">
        <SidebarSpacer />
        <TopBar title={title} description={description} portalAccent={portalAccent} />
        
        <main className="p-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}