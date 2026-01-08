import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Suppress console.error noise in tests (tests still fail on assertions)
vi.spyOn(console, "error").mockImplementation(() => {});
