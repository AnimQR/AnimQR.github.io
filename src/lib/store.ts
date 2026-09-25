"use client";

import { create } from "zustand";
import { DEFAULT_CONFIG, parseUrlParams, sanitizeConfig, type QRConfig } from "./config";
import {
  buildContent,
  detectContentType,
  EMPTY_FIELDS,
  type ContentFields,
  type ContentType,
} from "./content";

const LAST_KEY = "animqr:last";

interface State {
  config: QRConfig;
  contentType: ContentType;
  fields: ContentFields;
  /** The current code came from URL parameters. */
  fromUrl: boolean;
  embed: boolean;
  urlWarnings: string[];
  syncUrl: boolean;
  hydrated: boolean;

  update(partial: Partial<QRConfig>): void;
  setContentType(type: ContentType): void;
  setFields<K extends keyof ContentFields>(key: K, value: ContentFields[K]): void;
  applyStyle(style: Partial<QRConfig>): void;
  setSyncUrl(on: boolean): void;
  hydrate(search: string): void;
  reset(): void;
}

function persist(state: Pick<State, "config" | "contentType" | "fields">) {
  try {
    // Uploaded logos can be large; keep them out of storage.
    const config = state.config.logo.startsWith("data:") ? { ...state.config, logo: "" } : state.config;
    localStorage.setItem(LAST_KEY, JSON.stringify({ config, contentType: state.contentType, fields: state.fields }));
  } catch {
    /* storage unavailable */
  }
}

function loadLast(): Pick<State, "config" | "contentType" | "fields"> | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      config: sanitizeConfig(parsed.config ?? {}),
      contentType: parsed.contentType in EMPTY_FIELDS ? parsed.contentType : "url",
      fields: { ...EMPTY_FIELDS, ...(parsed.fields ?? {}) },
    };
  } catch {
    return null;
  }
}

export const useStore = create<State>((set, get) => ({
  config: DEFAULT_CONFIG,
  contentType: "url",
  fields: EMPTY_FIELDS,
  fromUrl: false,
  embed: false,
  urlWarnings: [],
  syncUrl: false,
  hydrated: false,

  update(partial) {
    const config = sanitizeConfig(partial as Record<string, unknown>, get().config);
    set({ config });
    persist({ ...get(), config });
  },

  setContentType(contentType) {
    const data = buildContent(contentType, get().fields);
    const config = { ...get().config, data };
    set({ contentType, config });
    persist(get());
  },

  setFields(key, value) {
    const fields = { ...get().fields, [key]: value };
    const data = buildContent(get().contentType, fields);
    const config = sanitizeConfig({ data }, get().config);
    set({ fields, config, fromUrl: false });
    persist(get());
  },

  applyStyle(style) {
    const config = sanitizeConfig({ ...style, data: get().config.data, logo: get().config.logo }, get().config);
    set({ config });
    persist(get());
  },

  setSyncUrl(syncUrl) {
    set({ syncUrl });
  },

  hydrate(search) {
    const parsed = parseUrlParams(search);
    if (parsed.fromUrl) {
      const { type, fields } = detectContentType(parsed.config.data);
      set({
        config: parsed.config,
        contentType: type,
        fields: { ...EMPTY_FIELDS, ...fields },
        fromUrl: parsed.hasData,
        embed: parsed.embed,
        urlWarnings: parsed.warnings,
        hydrated: true,
      });
      return;
    }
    const last = loadLast();
    set({ ...(last ?? {}), fromUrl: false, embed: parsed.embed, urlWarnings: parsed.warnings, hydrated: true });
  },

  reset() {
    set({ config: DEFAULT_CONFIG, contentType: "url", fields: EMPTY_FIELDS, fromUrl: false, urlWarnings: [] });
    persist(get());
  },
}));
