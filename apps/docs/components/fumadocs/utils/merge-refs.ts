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

import type * as React from "react";

export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    });
  };
}
