import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils/date.utils";

describe("Date Utils", () => {
  describe("formatDate", () => {
    it("should format date string correctly", () => {
      expect(formatDate("2024-01-15")).toBe("Jan 15, 2024");
    });

    it("should format date with different months", () => {
      expect(formatDate("2024-01-15")).toBe("Jan 15, 2024");
      expect(formatDate("2024-06-15")).toBe("Jun 15, 2024");
      expect(formatDate("2024-12-15")).toBe("Dec 15, 2024");
    });
  });

  describe("formatDateTime", () => {
    it("should format date time string correctly", () => {
      expect(formatDateTime("2024-01-15T14:30:00")).toBe("Jan 15, 2024 2:30 PM");
    });

    it("should format midnight correctly", () => {
      expect(formatDateTime("2024-01-15T00:00:00")).toBe("Jan 15, 2024 12:00 AM");
    });

    it("should format noon correctly", () => {
      expect(formatDateTime("2024-01-15T12:00:00")).toBe("Jan 15, 2024 12:00 PM");
    });
  });

  describe("formatTime", () => {
    it("should format time string correctly", () => {
      expect(formatTime("2024-01-15T14:30:00")).toBe("2:30 PM");
    });

    it("should format midnight correctly", () => {
      expect(formatTime("2024-01-15T00:00:00")).toBe("12:00 AM");
    });

    it("should format morning time correctly", () => {
      expect(formatTime("2024-01-15T09:05:00")).toBe("9:05 AM");
    });
  });
});
