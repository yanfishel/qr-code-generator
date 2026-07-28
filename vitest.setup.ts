import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver, which Radix's Tooltip (and other
// popover-based primitives) needs to size their arrow/content on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
