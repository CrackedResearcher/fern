/**
 * Ported from HeroUI's documentation site.
 * https://github.com/heroui-inc/heroui/tree/v3/apps/docs/src/components/fumadocs
 *
 * Copyright (c) HeroUI. Licensed under the Apache License, Version 2.0.
 * See the NOTICE file at the repository root.
 *
 * MODIFIED by fern: import paths repointed at fern's tree, and
 * internationalisation removed (fern's docs are single-locale).
 *
 * This is a fork of Fumadocs' Notebook layout that HeroUI vendored and
 * modified. fern renders the same shell, so the honest thing is to consume
 * their fork rather than re-derive it from screenshots of the output.
 */

"use client";

import type {ButtonProps} from "fumadocs-ui/components/ui/button";
import type {ComponentProps} from "react";

import {buttonVariants} from "fumadocs-ui/components/ui/button";
import {useSearchContext} from "fumadocs-ui/contexts/search";

import {Search} from "@/components/fumadocs/ui/icons";
import {cn} from "@/utils/cn";

interface SearchToggleProps extends Omit<ComponentProps<"button">, "color">, ButtonProps {
  hideIfDisabled?: boolean;
}

export function SearchToggle({
  color = "ghost",
  hideIfDisabled,
  size = "icon-sm",
  ...props
}: SearchToggleProps) {
  const {enabled, setOpenSearch} = useSearchContext();

  if (hideIfDisabled && !enabled) return null;

  return (
    <button
      aria-label="Open Search"
      data-search=""
      type="button"
      className={cn(
        buttonVariants({
          color,
          size,
        }),
        props.className,
      )}
      onClick={() => {
        setOpenSearch(true);
      }}
    >
      <Search />
    </button>
  );
}

export function LargeSearchToggle({
  hideIfDisabled,
  ...props
}: ComponentProps<"button"> & {
  hideIfDisabled?: boolean;
}) {
  const {enabled, hotKey, setOpenSearch} = useSearchContext();

  if (hideIfDisabled && !enabled) return null;

  return (
    <button
      data-search-full=""
      type="button"
      {...props}
      className={cn(
        "bg-fd-secondary/50 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground inline-flex items-center gap-2 rounded-lg border p-1.5 ps-2 text-sm transition-colors",
        props.className,
      )}
      onClick={() => {
        setOpenSearch(true);
      }}
    >
      <Search className="size-4" />
      {"Search"}
      <div className="ms-auto inline-flex gap-0.5">
        {hotKey.map((k, i) => (
          <kbd key={i} className="bg-fd-background rounded-md border px-1.5">
            {k.display}
          </kbd>
        ))}
      </div>
    </button>
  );
}
