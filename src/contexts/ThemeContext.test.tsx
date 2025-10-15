import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
} from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { ReactNode } from "react";
import "@testing-library/jest-dom";

const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

vi.mock("../utils/storage", () => ({
  storage: mockStorage,
}));

describe("ThemeContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.get.mockReturnValue(null);
  });

  describe("ThemeProvider", () => {
    it("should provide theme context to children", () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>Current theme: {theme}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByText(/Current theme:/)).toBeInTheDocument();
    });

    it("should load theme from storage on mount", () => {
      mockStorage.get.mockReturnValue("dark");

      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByText("dark")).toBeInTheDocument();
      expect(mockStorage.get).toHaveBeenCalledWith("theme");
    });

    it("should use default theme if none in storage", () => {
      mockStorage.get.mockReturnValue(null);

      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByText("default")).toBeInTheDocument();
    });
  });

  describe("useTheme hook", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    it("should return current theme", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe("default");
    });

    it("should allow setting theme", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
      expect(mockStorage.set).toHaveBeenCalledWith("theme", "dark");
    });

    it("should return available themes", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.themes).toContain("default");
      expect(result.current.themes).toContain("dark");
      expect(result.current.themes).toContain("blue");
      expect(Array.isArray(result.current.themes)).toBe(true);
    });

    it("should apply theme class to document", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme("dark");
      });

      expect(document.documentElement.classList.contains("theme-dark")).toBe(
        true,
      );
    });

    it("should remove previous theme class when changing themes", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme("dark");
      });

      expect(document.documentElement.classList.contains("theme-dark")).toBe(
        true,
      );

      act(() => {
        result.current.setTheme("blue");
      });

      expect(document.documentElement.classList.contains("theme-dark")).toBe(
        false,
      );
      expect(document.documentElement.classList.contains("theme-blue")).toBe(
        true,
      );
    });

    it("should handle custom theme", () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      const customTheme = {
        name: "custom",
        colors: {
          primary: "#ff0000",
          secondary: "#00ff00",
          background: "#ffffff",
          text: "#000000",
        },
      };

      act(() => {
        result.current.setCustomTheme(customTheme);
      });

      expect(result.current.theme).toBe("custom");
      expect(result.current.customTheme).toEqual(customTheme);
      expect(mockStorage.set).toHaveBeenCalledWith("customTheme", customTheme);
    });

    it("should load custom theme from storage", () => {
      const customTheme = {
        name: "custom",
        colors: {
          primary: "#ff0000",
          secondary: "#00ff00",
          background: "#ffffff",
          text: "#000000",
        },
      };

      mockStorage.get.mockImplementation((key) => {
        if (key === "theme") return "custom";
        if (key === "customTheme") return customTheme;
        return null;
      });

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe("custom");
      expect(result.current.customTheme).toEqual(customTheme);
    });
  });

  describe("error handling", () => {
    it("should throw error when useTheme is used outside provider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within a ThemeProvider");

      consoleSpy.mockRestore();
    });
  });
});
