import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AIHintProvider } from "./contexts/AIHintContext";

// Mock react-dom/client
vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(),
}));

// Mock App component
vi.mock("./App", () => ({
  default: vi.fn(() => <div data-testid="app">App Component</div>),
}));

// Mock contexts
vi.mock("./contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("./contexts/AIHintContext", () => ({
  AIHintProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ai-hint-provider">{children}</div>
  ),
}));

// Mock CSS import
vi.mock("./index.css", () => ({}));

describe("main.tsx", () => {
  let mockRoot: {
    render: ReturnType<typeof vi.fn>;
  };
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a mock container
    container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);

    // Create mock root
    mockRoot = {
      render: vi.fn(),
    };

    // Mock createRoot to return our mock root
    (createRoot as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockRoot,
    );

    // Mock getElementById
    vi.spyOn(document, "getElementById").mockReturnValue(container);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.removeChild(container);
  });

  it("should create root and render app with providers", async () => {
    // Import main.tsx to trigger the render
    await import("./main");

    // Verify createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(container);

    // Verify render was called
    expect(mockRoot.render).toHaveBeenCalledTimes(1);

    // Get the rendered component
    const renderCall = mockRoot.render.mock.calls[0][0];

    // Verify StrictMode is used
    expect(renderCall.type).toBe(StrictMode);

    // Verify ThemeProvider is nested inside StrictMode
    const strictModeChildren = renderCall.props.children;
    expect(strictModeChildren.type).toBe(ThemeProvider);

    // Verify AIHintProvider is nested inside ThemeProvider
    const themeProviderChildren = strictModeChildren.props.children;
    expect(themeProviderChildren.type).toBe(AIHintProvider);

    // Verify App is nested inside AIHintProvider
    const aiHintProviderChildren = themeProviderChildren.props.children;
    expect(aiHintProviderChildren.type).toBe(App);
  });

  it("should handle missing root element gracefully", async () => {
    // Mock getElementById to return null
    vi.spyOn(document, "getElementById").mockReturnValue(null);

    // This should throw an error since we use the non-null assertion operator
    await expect(async () => {
      await import("./main");
    }).rejects.toThrow();
  });

  it("should render with StrictMode wrapper", async () => {
    await import("./main");

    const renderCall = mockRoot.render.mock.calls[0][0];
    expect(renderCall.type).toBe(StrictMode);
  });

  it("should nest providers correctly", async () => {
    await import("./main");

    const renderCall = mockRoot.render.mock.calls[0][0];
    const strictModeChildren = renderCall.props.children;

    // Check provider nesting: StrictMode > ThemeProvider > AIHintProvider > App
    expect(strictModeChildren.type).toBe(ThemeProvider);
    expect(strictModeChildren.props.children.type).toBe(AIHintProvider);
    expect(strictModeChildren.props.children.props.children.type).toBe(App);
  });
});



