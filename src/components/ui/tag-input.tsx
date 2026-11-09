"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";

/**
 * A short flat list built one value at a time: type into the input, click
 * Add (or press Enter) to append it as a removable label below. Used for
 * highlights/skills/prerequisites in place of a "one per line" textarea.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const tag = draft.trim();
    if (!tag || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((item) => item !== tag));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus className="size-4" aria-hidden="true" /> Add
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 rounded-md py-1 pl-2.5 pr-1 text-xs">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => remove(tag)}
                className="rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing added yet.</p>
      )}
    </div>
  );
}
