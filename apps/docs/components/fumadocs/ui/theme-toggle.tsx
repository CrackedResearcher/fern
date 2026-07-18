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

import type {ComponentProps} from "react";

import {useTheme} from "next-themes";
import {tv} from "tailwind-variants";

import {Airplay, Moon, Sun} from "@/components/fumadocs/ui/icons";
import {useIsMounted} from "@/hooks/use-is-mounted";
import {cn} from "@/utils/cn";

const itemVariants = tv({
  base: "text-fd-muted-foreground size-6.5 rounded-full p-1.5",
  variants: {
    active: {
      false: "text-fd-muted-foreground",
      true: "bg-fd-accent text-fd-accent-foreground",
    },
  },
});

const full = [["light", Sun] as const, ["dark", Moon] as const, ["system", Airplay] as const];

export function ThemeToggle({
  className,
  mode = "light-dark",
  ...props
}: ComponentProps<"div"> & {
  mode?: "light-dark" | "light-dark-system";
}) {
  const {resolvedTheme, setTheme, theme} = useTheme();
  const mounted = useIsMounted();

  const container = cn(
    "inline-flex cursor-(--cursor-interactive) items-center rounded-full border p-1",
    className,
  );

  if (mode === "light-dark") {
    const value = mounted ? resolvedTheme : null;

    return (
      <button
        aria-label="Toggle Theme"
        className={container}
        data-theme-toggle=""
        onClick={() => setTheme(value === "light" ? "dark" : "light")}
      >
        {full.map(([key, Icon]) => {
          if (key === "system") return;

          return (
            <Icon
              key={key}
              className={cn(itemVariants({active: value === key}))}
              fill="currentColor"
            />
          );
        })}
      </button>
    );
  }

  const value = mounted ? theme : null;

  return (
    <div className={container} data-theme-toggle="" {...props}>
      {full.map(([key, Icon]) => (
        <button
          key={key}
          aria-label={key}
          className={cn(itemVariants({active: value === key}))}
          onClick={() => setTheme(key)}
        >
          <Icon className="size-full" fill="currentColor" />
        </button>
      ))}
    </div>
  );
}
