"use client";

import { useEffect } from "react";
import { Spinner } from "@/components/spinner";
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navigation from "./_components/Navigation";
import { SearchCommand } from "@/components/search-command";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();

  useEffect(() => {
    if (isClerkLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isClerkLoaded, isSignedIn, router]);

  if (!isClerkLoaded || !isSignedIn || isConvexLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};
export default MainLayout;
