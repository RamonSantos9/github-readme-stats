import { describe, expect, it } from "@jest/globals";
import {
  formatBytes,
  kFormatter,
  wrapTextMultiline,
} from "../src/common/fmt.js";

describe("Testes em common/fmt.ts", () => {
  it("kFormatter: deve formatar números corretamente por padrão", () => {
    expect(kFormatter(1)).toBe(1);
    expect(kFormatter(-1)).toBe(-1);
    expect(kFormatter(500)).toBe(500);
    expect(kFormatter(1000)).toBe("1k");
    expect(kFormatter(1200)).toBe("1.2k");
    expect(kFormatter(10000)).toBe("10k");
    expect(kFormatter(12345)).toBe("12.3k");
    expect(kFormatter(99900)).toBe("99.9k");
    expect(kFormatter(9900000)).toBe("9900k");
  });

  it("kFormatter: deve formatar números corretamente com precisão decimal 0", () => {
    expect(kFormatter(1, 0)).toBe("0k");
    expect(kFormatter(-1, 0)).toBe("-0k");
    expect(kFormatter(500, 0)).toBe("1k");
    expect(kFormatter(1000, 0)).toBe("1k");
    expect(kFormatter(1200, 0)).toBe("1k");
    expect(kFormatter(10000, 0)).toBe("10k");
    expect(kFormatter(12345, 0)).toBe("12k");
    expect(kFormatter(99000, 0)).toBe("99k");
    expect(kFormatter(99900, 0)).toBe("100k");
    expect(kFormatter(9900000, 0)).toBe("9900k");
  });

  it("kFormatter: deve formatar números corretamente com precisão decimal 1", () => {
    expect(kFormatter(1, 1)).toBe("0.0k");
    expect(kFormatter(-1, 1)).toBe("-0.0k");
    expect(kFormatter(500, 1)).toBe("0.5k");
    expect(kFormatter(1000, 1)).toBe("1.0k");
    expect(kFormatter(1200, 1)).toBe("1.2k");
    expect(kFormatter(10000, 1)).toBe("10.0k");
    expect(kFormatter(12345, 1)).toBe("12.3k");
    expect(kFormatter(99900, 1)).toBe("99.9k");
    expect(kFormatter(9900000, 1)).toBe("9900.0k");
  });

  it("kFormatter: deve formatar números corretamente com precisão decimal 2", () => {
    expect(kFormatter(1, 2)).toBe("0.00k");
    expect(kFormatter(-1, 2)).toBe("-0.00k");
    expect(kFormatter(500, 2)).toBe("0.50k");
    expect(kFormatter(1000, 2)).toBe("1.00k");
    expect(kFormatter(1200, 2)).toBe("1.20k");
    expect(kFormatter(10000, 2)).toBe("10.00k");
    expect(kFormatter(12345, 2)).toBe("12.35k");
    expect(kFormatter(99900, 2)).toBe("99.90k");
    expect(kFormatter(9900000, 2)).toBe("9900.00k");
  });

  it("formatBytes: deve retornar os valores esperados", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(100)).toBe("100.0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1.0 TB");
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 1024)).toBe("1.0 PB");
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe("1.0 EB");

    expect(formatBytes(1234 * 1024)).toBe("1.2 MB");
    expect(formatBytes(123.4 * 1024)).toBe("123.4 KB");
  });

  it("wrapTextMultiline: não deve quebrar textos pequenos", () => {
    const multiLineText = wrapTextMultiline("Pequeno texto não deve quebrar");
    expect(multiLineText).toEqual(["Pequeno texto n&#227;o deve quebrar"]);
  });

  it("wrapTextMultiline: deve quebrar textos grandes", () => {
    const multiLineText = wrapTextMultiline(
      "Olá mundo texto longo longo longo",
      20,
      3,
    );
    expect(multiLineText).toEqual([
      "Ol&#225; mundo texto",
      "longo longo longo",
    ]);
  });

  it("wrapTextMultiline: deve quebrar textos grandes e limitar o máximo de linhas", () => {
    const multiLineText = wrapTextMultiline(
      "Olá mundo texto longo longo longo",
      10,
      2,
    );
    expect(multiLineText).toEqual(["Ol&#225;", "mundo..."]);
  });

  it("wrapTextMultiline: deve quebrar chinês por pontuação", () => {
    const multiLineText = wrapTextMultiline(
      "专门为刚开始刷题的同学准备的算法基地，没有最细只有更细，立志用动画将晦涩难懂的算法说的通俗易懂！",
    );
    expect(multiLineText.length).toEqual(3);
    expect(multiLineText[0].length).toEqual(18 * 8); // &#xxxxx; x 8
  });
});
