import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ConfirmModal, ContentModal } from "@/components/ui/Modal";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("ConfirmModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: "Test Modal",
    message: "Test message",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render when open", () => {
    render(<ConfirmModal {...defaultProps} />, { wrapper: Wrapper });

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />, { wrapper: Wrapper });

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("should call onClose when cancel button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onConfirm when confirm button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText("Confirm"));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should render custom confirm text", () => {
    render(<ConfirmModal {...defaultProps} confirmText="Delete" />, { wrapper: Wrapper });

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should render custom cancel text", () => {
    render(<ConfirmModal {...defaultProps} cancelText="Go Back" />, { wrapper: Wrapper });

    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });
});

describe("ContentModal", () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: "Content Modal",
    children: <div>Test content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render when open", () => {
    render(<ContentModal {...defaultProps} />, { wrapper: Wrapper });

    expect(screen.getByText("Content Modal")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<ContentModal {...defaultProps} isOpen={false} />, { wrapper: Wrapper });

    expect(screen.queryByText("Content Modal")).not.toBeInTheDocument();
  });

  it("should apply custom data-testid", () => {
    render(<ContentModal {...defaultProps} />, { wrapper: Wrapper });

    expect(screen.getByTestId("content-modal")).toBeInTheDocument();
  });
});
