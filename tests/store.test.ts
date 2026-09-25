import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site";

describe("editor history", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.getState().hydrate("");
  });

  it("starts from the preloaded URL with empty history", () => {
    const s = useStore.getState();
    expect(s.config.data).toBe(SITE.preloadUrl);
    expect(s.past).toHaveLength(0);
    expect(s.future).toHaveLength(0);
  });

  it("undoes and redoes a change", () => {
    useStore.getState().update({ fg: "#800020" });
    expect(useStore.getState().config.fg).toBe("#800020");
    useStore.getState().undo();
    expect(useStore.getState().config.fg).toBe("#0a1f44");
    useStore.getState().redo();
    expect(useStore.getState().config.fg).toBe("#800020");
  });

  it("groups rapid edits (typing, sliders) into one step", () => {
    const { update } = useStore.getState();
    update({ size: 600 });
    vi.advanceTimersByTime(100);
    update({ size: 700 });
    vi.advanceTimersByTime(100);
    update({ size: 800 });
    useStore.getState().undo();
    expect(useStore.getState().config.size).toBe(512);
  });

  it("keeps separate steps for edits far apart in time", () => {
    const { update } = useStore.getState();
    update({ size: 600 });
    vi.advanceTimersByTime(2000);
    update({ size: 800 });
    useStore.getState().undo();
    expect(useStore.getState().config.size).toBe(600);
  });

  it("a new edit clears the redo stack", () => {
    const { update } = useStore.getState();
    update({ ec: "H" });
    useStore.getState().undo();
    vi.advanceTimersByTime(2000);
    update({ ec: "Q" });
    expect(useStore.getState().future).toHaveLength(0);
  });

  it("preset and reset are single undoable steps", () => {
    useStore.getState().applyStyle({ module: "dots", anim: "pulse" });
    useStore.getState().reset();
    expect(useStore.getState().config.module).toBe("square");
    useStore.getState().undo();
    expect(useStore.getState().config.module).toBe("dots");
    useStore.getState().undo();
    expect(useStore.getState().config.module).toBe("square");
    expect(useStore.getState().config.anim).toBe("none");
  });

  it("content edits are undoable too", () => {
    useStore.getState().setFields("url", "https://example.com");
    expect(useStore.getState().config.data).toBe("https://example.com");
    useStore.getState().undo();
    expect(useStore.getState().config.data).toBe(SITE.preloadUrl);
    expect(useStore.getState().fields.url).toBe(SITE.preloadUrl);
  });
});
