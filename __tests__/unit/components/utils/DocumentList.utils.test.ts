import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getFileIcon } from "@/components/DocumentList/DocumentList.utils";

describe("getFileIcon", () => {
  it("should return JSX element for PDF files", () => {
    const icon = getFileIcon("PDF");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for TEXT files", () => {
    const icon = getFileIcon("TEXT");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for MARKDOWN files", () => {
    const icon = getFileIcon("MARKDOWN");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for DOCX files", () => {
    const icon = getFileIcon("DOCX");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for unknown file types", () => {
    const icon = getFileIcon("UNKNOWN");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
