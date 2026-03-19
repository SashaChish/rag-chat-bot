import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal, ContentModal } from "@/components/ui/Modal";

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
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Close modal"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when cancel button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onConfirm when confirm button is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByText("Confirm"));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);

    const overlay = screen.getByTestId("confirm-modal-overlay");
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not call onClose when modal content is clicked", () => {
    render(<ConfirmModal {...defaultProps} />);

    const modalContent = screen.getByTestId("confirm-modal-content");
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should render custom confirm text", () => {
    render(<ConfirmModal {...defaultProps} confirmText="Delete" />);

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should render custom cancel text", () => {
    render(<ConfirmModal {...defaultProps} cancelText="Go Back" />);

    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  it("should close on Escape key press", async () => {
    render(<ConfirmModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should not close on Escape key press when closed", async () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = render(<ConfirmModal {...defaultProps} />);

    unmount();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should apply danger variant class to modal content", () => {
    render(<ConfirmModal {...defaultProps} variant="danger" />);

    const modalContent = screen.getByTestId("confirm-modal-content");
    expect(modalContent.className).toContain("border-danger-600");
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
    render(<ContentModal {...defaultProps} />);

    expect(screen.getByText("Content Modal")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(<ContentModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Content Modal")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(<ContentModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Close modal"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay is clicked", () => {
    render(<ContentModal {...defaultProps} />);

    const overlay = screen.getByTestId("content-modal-overlay");
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not call onClose when modal content is clicked", () => {
    render(<ContentModal {...defaultProps} />);

    const modalContent = screen.getByTestId("content-modal-content");
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should close on Escape key press", () => {
    render(<ContentModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should apply size class for large modal", () => {
    render(<ContentModal {...defaultProps} size="large" />);

    const modalContent = screen.getByTestId("content-modal-content");
    expect(modalContent.className).toContain("max-w-[700px]");
  });

  it("should apply custom className", () => {
    render(<ContentModal {...defaultProps} className="custom-class" />);

    const modalContent = screen.getByTestId("content-modal-content");
    expect(modalContent.className).toContain("custom-class");
  });
});
