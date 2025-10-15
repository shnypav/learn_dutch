import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InputField from "./InputField";
import "@testing-library/jest-dom";

describe("InputField", () => {
  it("should render with placeholder text", () => {
    render(
      <InputField
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder="Enter text"
      />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("should display the current value", () => {
    render(
      <InputField value="test value" onChange={() => {}} onSubmit={() => {}} />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("test value");
  });

  it("should call onChange when text is entered", () => {
    const handleChange = vi.fn();
    render(<InputField value="" onChange={handleChange} onSubmit={() => {}} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new text" } });

    expect(handleChange).toHaveBeenCalledWith("new text");
  });

  it("should call onSubmit when Enter is pressed", () => {
    const handleSubmit = vi.fn();
    render(
      <InputField value="test" onChange={() => {}} onSubmit={handleSubmit} />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(handleSubmit).toHaveBeenCalled();
  });

  it("should not call onSubmit for other keys", () => {
    const handleSubmit = vi.fn();
    render(
      <InputField value="test" onChange={() => {}} onSubmit={handleSubmit} />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "a", code: "KeyA" });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <InputField
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        disabled={true}
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("should apply custom className", () => {
    render(
      <InputField
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        className="custom-class"
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("should auto-focus when autoFocus is true", () => {
    render(
      <InputField
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        autoFocus={true}
      />,
    );

    const input = screen.getByRole("textbox");
    expect(document.activeElement).toBe(input);
  });
});
