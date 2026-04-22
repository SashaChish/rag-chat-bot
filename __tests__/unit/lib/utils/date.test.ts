import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "@/lib/utils/date.utils";

describe("Date Utils", () => {
  describe("formatDate", () => {
    it("should format date string correctly", () => {
      const result = formatDate("2024-01-15T10:30:00Z");
      expect(result).toContain("2024");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });

    it("should format date with different months", () => {
      const january = formatDate("2024-01-15T10:30:00Z");
      const june = formatDate("2024-06-15T10:30:00Z");
      const december = formatDate("2024-12-15T10:30:00Z");

      expect(january).toContain("Jan");
      expect(june).toContain("Jun");
      expect(december).toContain("Dec");
    });
  });

  describe("formatDateTime", () => {
    it("should format date time string correctly", () => {
      const result = formatDateTime("2024-01-15T10:30:00Z");
      expect(result).toContain("2024");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toMatch(/:\d{2}/);
    });

    it("should include time components", () => {
      const result = formatDateTime("2024-01-15T14:30:45Z");
      const timeMatch = result.match(/(\d{1,2}):(\d{2})/);
      expect(timeMatch).toBeTruthy();
    });
  });
});
