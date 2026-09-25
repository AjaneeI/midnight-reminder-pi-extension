import { describe, it, expect } from "vitest";
import { greet } from "../src/greet.js";

describe("greet", () => {
  it("returns a greeting for the given name", () => {
    expect(greet("World")).toBe("Hello, World!");
  });
});
