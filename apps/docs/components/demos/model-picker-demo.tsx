"use client"

import { useState } from "react"
import { ModelPicker, type Model } from "@fern-ui/model-picker"

/**
 * Real models, so the block is exercised against the names and mark shapes it
 * will actually meet — invented ones hide the problems worth finding.
 *
 * The package ships no catalogue: one goes stale in weeks, and a wrong price in
 * a component library is worse than no price. These figures are published list
 * prices per million input tokens at the time of writing, here to make the
 * layout honest rather than to be quoted.
 */
const mark = (slug: string) => `https://cdn.simpleicons.org/${slug}`

/**
 * Two marks are served from `public/`, where the country picker's flags live.
 *
 * ChatGPT because OpenAI's mark was pulled from the simple-icons CDN — the
 * failure any real catalogue eventually hits. The Wikimedia file is the full
 * green tile, so it needs no `logoBackground`. Gemini because its mark is a
 * white spark, illegible without the brand gradient behind it.
 */
const CHATGPT = "/model-logos/chatgpt.svg"
const GEMINI = "/model-logos/gemini.svg"
/** Gemini's own blue-to-red sweep, which is the mark's whole identity. */
const GEMINI_TILE = "linear-gradient(135deg, #4285F4 0%, #9B72CB 50%, #D96570 100%)"

const MODELS: Model[] = [
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    logo: mark("claude"),
    group: "Frontier",
    badge: "New",
    description:
      "Anthropic's most capable model. Holds a plan across long agentic runs without losing the thread.",
    tags: ["vision", "reasoning", "tools", "long context"],
    strengths: ["Long-horizon agentic work", "Careful with tools", "Strong at code"],
    limitations: ["The most expensive option here", "Slower to first token"],
    price: { amount: 5, symbol: "$", per: "1M" },
    speed: 2,
    quality: 5,
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "Anthropic",
    logo: mark("claude"),
    group: "Frontier",
    description:
      "Most of Opus's judgement at a fraction of the latency. The one to start from.",
    tags: ["vision", "reasoning", "tools", "long context"],
    strengths: ["Fast enough for an interactive loop", "Strong at extraction"],
    limitations: ["Gives up earlier than Opus on hard reasoning"],
    price: { amount: 3, symbol: "$", per: "1M" },
    speed: 4,
    quality: 4,
  },
  {
    id: "gpt-5-1",
    name: "GPT-5.1",
    provider: "OpenAI",
    logo: CHATGPT,
    group: "Frontier",
    description: "OpenAI's flagship, with adjustable reasoning effort.",
    tags: ["vision", "reasoning", "tools"],
    strengths: ["Reasoning effort is tunable per call", "Broad tool ecosystem"],
    limitations: ["Latency climbs sharply at high effort"],
    price: { amount: 1.25, symbol: "$", per: "1M" },
    speed: 3,
    quality: 5,
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "Google",
    logo: GEMINI,
    logoBackground: GEMINI_TILE,
    group: "Frontier",
    description:
      "The widest context window on offer, and native audio and video input.",
    tags: ["vision", "reasoning", "tools", "long context"],
    strengths: ["1M token context", "Handles audio and video natively"],
    limitations: ["Slows noticeably past a few hundred thousand tokens"],
    price: { amount: 2, symbol: "$", per: "1M" },
    speed: 3,
    quality: 4,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    logo: mark("claude"),
    group: "Fast and cheap",
    description:
      "Built for classification, routing, and anything you run a million times.",
    tags: ["vision", "tools", "fast"],
    strengths: ["Very low latency", "Cheap enough to run per request"],
    limitations: ["Loses the thread on long multi-step work"],
    price: { amount: 1, symbol: "$", per: "1M" },
    speed: 5,
    quality: 3,
  },
  {
    id: "gpt-5-1-mini",
    name: "GPT-5.1 mini",
    provider: "OpenAI",
    logo: CHATGPT,
    group: "Fast and cheap",
    description: "The small tier of GPT-5.1, for high-volume work.",
    tags: ["vision", "tools", "fast"],
    strengths: ["Cheapest hosted option here", "Reliable structured output"],
    limitations: ["Weak on open-ended reasoning"],
    price: { amount: 0.25, symbol: "$", per: "1M" },
    speed: 5,
    quality: 2,
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    provider: "DeepSeek",
    logo: mark("deepseek"),
    group: "Open weights",
    description: "Open weights, self-hostable, and strong at code for the price.",
    tags: ["reasoning", "tools", "open weights"],
    strengths: ["Runs on your own hardware", "Predictable cost at volume"],
    limitations: ["No vision", "Shorter context than the frontier models"],
    price: { amount: 0.28, symbol: "$", per: "1M" },
    speed: 3,
    quality: 3,
  },
  {
    id: "llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    logo: mark("meta"),
    group: "Open weights",
    description: "Meta's open-weight multimodal model, widely mirrored by hosts.",
    tags: ["vision", "tools", "open weights"],
    strengths: ["Permissive licence", "Available from many providers"],
    limitations: ["Behind the frontier on hard reasoning"],
    price: { amount: 0.35, symbol: "$", per: "1M" },
    speed: 4,
    quality: 2,
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    logo: mark("mistralai"),
    group: "Open weights",
    description: "European-hosted, with strong multilingual coverage.",
    tags: ["reasoning", "tools"],
    strengths: ["EU data residency", "Even across European languages"],
    limitations: ["No vision"],
    price: { amount: 2, symbol: "$", per: "1M" },
    speed: 3,
    quality: 3,
  },
  {
    id: "o3-pro",
    name: "o3-pro",
    provider: "OpenAI",
    logo: CHATGPT,
    group: "Frontier",
    description:
      "Extended deliberate reasoning, for problems where being right matters more than being quick.",
    tags: ["reasoning", "tools"],
    strengths: ["Best results on hard proofs and long refactors"],
    limitations: ["Can spend minutes before answering"],
    price: { amount: 20, symbol: "$", per: "1M", from: true },
    speed: 1,
    quality: 5,
    disabled: true,
    disabledReason: "Available on the Scale plan. Your workspace is on Team.",
  },
]

export function ModelPickerDemo() {
  const [model, setModel] = useState("claude-sonnet-5")
  return <ModelPicker models={MODELS} value={model} onChange={setModel} />
}

/** `showPrice` brings the figures back, on the rows and on the trigger. */
export function ModelPickerPrices() {
  const [model, setModel] = useState("gpt-5-1")
  return (
    <ModelPicker models={MODELS} value={model} onChange={setModel} showPrice />
  )
}

/** The compact trigger, as it would sit in a row of config controls. */
export function ModelPickerPill() {
  const [model, setModel] = useState("gemini-3-pro")
  return (
    <ModelPicker
      models={MODELS}
      value={model}
      onChange={setModel}
      variant="pill"
    />
  )
}

/** Recents pinned above the catalogue, and no capability chips. */
export function ModelPickerRecent() {
  const [model, setModel] = useState("claude-haiku-4-5")
  const [recent, setRecent] = useState(["claude-haiku-4-5", "gpt-5-1"])

  return (
    <ModelPicker
      models={MODELS}
      value={model}
      recent={recent}
      onChange={(id) => {
        setModel(id)
        // Short: a "recent" section long enough to scroll is the catalogue
        // again.
        setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 3))
      }}
      filterable={false}
    />
  )
}

/** A short list: no search field, no chips, no detail column. */
export function ModelPickerMinimal() {
  const [model, setModel] = useState("claude-haiku-4-5")
  return (
    <ModelPicker
      models={MODELS.slice(4, 7)}
      value={model}
      onChange={setModel}
      showDetails={false}
    />
  )
}
