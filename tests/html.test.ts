import { describe, expect, it } from "@jest/globals";
import { encodeHTML } from "../src/common/html.js";

describe("Testes em common/html.ts", () => {
  it("deve testar encodeHTML", () => {
    expect(encodeHTML(`<html>hello world<,.#4^&^@%!))`)).toBe(
      "&#60;html&#62;hello world&#60;,.#4^&#38;^@%!))",
    );
  });
});
