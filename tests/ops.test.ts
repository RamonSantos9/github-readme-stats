import { describe, expect, it } from "@jest/globals";
import {
  parseBoolean,
  parseArray,
  clampValue,
  lowercaseTrim,
  chunkArray,
  parseEmojis,
  dateDiff,
} from "../src/common/ops.js";

describe("Testes em common/ops.ts", () => {
  it("deve testar parseBoolean", () => {
    expect(parseBoolean(true)).toBe(true);
    expect(parseBoolean(false)).toBe(false);

    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("false")).toBe(false);
    expect(parseBoolean("True")).toBe(true);
    expect(parseBoolean("False")).toBe(false);
    expect(parseBoolean("TRUE")).toBe(true);
    expect(parseBoolean("FALSE")).toBe(false);

    expect(parseBoolean("1")).toBe(undefined);
    expect(parseBoolean("0")).toBe(undefined);
    expect(parseBoolean("")).toBe(undefined);
    // @ts-ignore
    expect(parseBoolean(undefined)).toBe(undefined);
  });

  it("deve testar parseArray", () => {
    expect(parseArray("a,b,c")).toEqual(["a", "b", "c"]);
    expect(parseArray("a, b, c")).toEqual(["a", " b", " c"]); // preserva espaços
    expect(parseArray("")).toEqual([]);
    // @ts-ignore
    expect(parseArray(undefined)).toEqual([]);
  });

  it("deve testar clampValue", () => {
    expect(clampValue(5, 1, 10)).toBe(5);
    expect(clampValue(0, 1, 10)).toBe(1);
    expect(clampValue(15, 1, 10)).toBe(10);

    // entradas de string são coagidas numericamente por Math.min/Math.max
    // @ts-ignore
    expect(clampValue("7", 1, 10)).toBe(7);

    // não-numérico e NaN retornam o valor mínimo
    // @ts-ignore
    expect(clampValue("abc", 1, 10)).toBe(1);
    expect(clampValue(NaN, 2, 5)).toBe(2);
  });

  it("deve testar lowercaseTrim", () => {
    expect(lowercaseTrim("  Hello World  ")).toBe("hello world");
    expect(lowercaseTrim("already lower")).toBe("already lower");
  });

  it("deve testar chunkArray", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkArray([1, 2, 3, 4, 5], 1)).toEqual([[1], [2], [3], [4], [5]]);
    expect(chunkArray([1, 2, 3, 4, 5], 10)).toEqual([[1, 2, 3, 4, 5]]);
  });

  it("deve testar parseEmojis", () => {
    // nome de emoji desconhecido é removido
    expect(parseEmojis("Hello :nonexistent:")).toBe("Hello ");
    // nomes comuns de emojis devem ser substituídos (pelo menos o token removido)
    const out = parseEmojis("I :heart: OSS");
    expect(out).not.toContain(":heart:");
    expect(out.startsWith("I ")).toBe(true);
    expect(out.endsWith(" OSS")).toBe(true);

    expect(() => parseEmojis("")).toThrow(/parseEmoji/);
    // @ts-ignore
    expect(() => parseEmojis()).toThrow(/parseEmoji/);
  });

  it("deve testar dateDiff", () => {
    const a = new Date("2020-01-01T00:10:00Z");
    const b = new Date("2020-01-01T00:00:00Z");
    expect(dateDiff(a, b)).toBe(10);

    const c = new Date("2020-01-01T00:00:00Z");
    const d = new Date("2020-01-01T00:10:30Z");
    // arredonda para o minuto mais próximo
    expect(dateDiff(c, d)).toBe(-10);
  });
});
