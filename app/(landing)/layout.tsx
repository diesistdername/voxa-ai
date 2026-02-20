"use client";

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
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return <>{children}</>;
};
export default LandingLayout;
