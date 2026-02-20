"use client";

import { Navbar } from "./_components/Navbar";
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/spinner";

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated || (!isLoading && isSignedIn)) {
      router.replace("/documents");
    }
  }, [isAuthenticated, isLoading, isSignedIn, router]);

  if (!isClerkLoaded || isLoading || isAuthenticated || isSignedIn) {
    return (
      <div className="dark:bg-dark flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="dark:bg-dark h-full">
      <Navbar />
      <main className="h-full pt-20">{children}</main>
    </div>
  );
};
export default LandingLayout;
