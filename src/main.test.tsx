import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGate from "./components/AuthGate";
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

vi.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("./components/AuthGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-gate">{children}</div>
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
    vi.resetModules();

    container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);

    mockRoot = {
      render: vi.fn(),
    };

    (createRoot as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockRoot,
    );

    vi.spyOn(document, "getElementById").mockReturnValue(container);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.removeChild(container);
  });

  it("should create root and render app with providers", async () => {
    await import("./main");

    expect(createRoot).toHaveBeenCalledWith(container);
    expect(mockRoot.render).toHaveBeenCalledTimes(1);

    const renderCall = mockRoot.render.mock.calls[0][0];
    expect(renderCall.type).toBe(StrictMode);

    // StrictMode > ThemeProvider
    const strictModeChildren = renderCall.props.children;
    expect(strictModeChildren.type).toBe(ThemeProvider);

    // ThemeProvider > AuthProvider
    const themeProviderChildren = strictModeChildren.props.children;
    expect(themeProviderChildren.type).toBe(AuthProvider);

    // AuthProvider > AuthGate
    const authProviderChildren = themeProviderChildren.props.children;
    expect(authProviderChildren.type).toBe(AuthGate);

    // AuthGate > AIHintProvider
    const authGateChildren = authProviderChildren.props.children;
    expect(authGateChildren.type).toBe(AIHintProvider);

    // AIHintProvider > App
    const aiHintProviderChildren = authGateChildren.props.children;
    expect(aiHintProviderChildren.type).toBe(App);
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

    // Check nesting: StrictMode > ThemeProvider > AuthProvider > AuthGate > AIHintProvider > App
    expect(strictModeChildren.type).toBe(ThemeProvider);
    expect(strictModeChildren.props.children.type).toBe(AuthProvider);
    expect(strictModeChildren.props.children.props.children.type).toBe(
      AuthGate,
    );
    expect(
      strictModeChildren.props.children.props.children.props.children.type,
    ).toBe(AIHintProvider);
    expect(
      strictModeChildren.props.children.props.children.props.children.props
        .children.type,
    ).toBe(App);
  });
});
