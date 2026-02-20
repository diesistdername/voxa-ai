"use client";

import { ComponentRef, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import TextareaAutosize from "react-textarea-autosize";

interface ToolbarProps {
  initialData: Doc<"documents">;
  preview?: boolean;
}

export const Toolbar = ({ initialData, preview }: ToolbarProps) => {
  const inputRef = useRef<ComponentRef<"textarea">>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialData.title);

  const update = useMutation(api.documents.update);

  const disableInput = () => setIsEditing(false);

  useEffect(() => {
    if (!isEditing) {
      setValue(initialData.title);
    }
  }, [initialData.title, isEditing]);

  useEffect(() => {
    if (value === initialData.title) return;

    const timer = setTimeout(() => {
      update({ id: initialData._id, title: value || "Untitled" });
    }, 400);

    return () => clearTimeout(timer);
  }, [value, initialData._id, initialData.title, update]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      update({ id: initialData._id, title: value || "Untitled" });
      setTimeout(() => inputRef.current?.blur(), 400);
    }
  };

  return (
    <TextareaAutosize
      ref={inputRef}
      placeholder="Untitled"
      spellCheck="false"
      onBlur={disableInput}
      onFocus={() => setIsEditing(true)}
      onKeyDown={onKeyDown}
      value={value}
      disabled={preview}
      onChange={(e) => setValue(e.target.value)}
      className="w-full resize-none bg-transparent text-3xl font-bold wrap-break-word outline-hidden text-foreground placeholder:text-muted-foreground disabled:cursor-default mb-4"
    />
  );
};
