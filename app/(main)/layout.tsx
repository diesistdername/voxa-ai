"use client";

import { Spinner } from "@/components/spinner";
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Navigation from "./_components/Navigation";
import { SearchCommand } from "@/components/search-command";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();

  // Clerk hasn't resolved yet
  if (!isClerkLoaded) {
    return (
      <div className="dark:bg-dark flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  // Clerk says not signed in — redirect immediately, no need to wait for Convex
  if (!isSignedIn) {
    return redirect("/");
  }

  // Convex is still handshaking — show spinner, don't redirect
  if (isConvexLoading) {
    return (
      <div className="dark:bg-dark flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="dark:bg-dark flex h-full">
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};
export default MainLayout;
