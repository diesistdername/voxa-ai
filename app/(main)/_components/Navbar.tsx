"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { MenuIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Menu } from "./Menu";

interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

export const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const params = useParams();
  const document = useQuery(api.documents.getById, {
    documentId: params.documentId as Id<"documents">,
  });

  if (document === undefined) {
    return (
      <nav className="flex h-12 w-full items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
      </nav>
    );
  }

  if (document === null) {
    return null;
  }

  return (
    <nav className="flex h-12 w-full items-center gap-x-2 border-b border-border bg-background px-4">
      {isCollapsed && (
        <button
          aria-label="Menu"
          onClick={onResetWidth}
          className="rounded-sm transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MenuIcon className="text-muted-foreground h-6 w-6" />
        </button>
      )}
      <div className="ml-auto flex items-center gap-x-2">
        <Menu documentId={document._id} />
      </div>
    </nav>
  );
};
