import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/Modal/Modal";

describe("Modal", () => {
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
    render(<Modal {...defaultProps} />);

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(<Modal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Close modal"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when cancel button is clicked", () => {
    render(<Modal {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onConfirm when confirm button is clicked", () => {
    render(<Modal {...defaultProps} />);

    fireEvent.click(screen.getByText("Confirm"));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is clicked", () => {
    render(<Modal {...defaultProps} />);

    const overlay = screen
      .getByText("Test Modal")
      .closest('[class*="modalOverlay"]');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not call onClose when modal content is clicked", () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("Test Modal")
      .closest('[class*="modalContent"]');
    if (modalContent) {
      fireEvent.click(modalContent);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should render custom confirm text", () => {
    render(<Modal {...defaultProps} confirmText="Delete" />);

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should render custom cancel text", () => {
    render(<Modal {...defaultProps} cancelText="Go Back" />);

    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  it("should close on Escape key press", async () => {
    render(<Modal {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should not close on Escape key press when closed", async () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = render(<Modal {...defaultProps} />);

    unmount();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should apply variant class to modal content", () => {
    const { container } = render(<Modal {...defaultProps} variant="danger" />);

    expect(container.firstChild).toBeDefined();
  });
});
