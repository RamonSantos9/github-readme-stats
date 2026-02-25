import { describe, expect, it } from "@jest/globals";
import { I18n } from "../src/common/I18n.js";
import { statCardLocales } from "../src/translations.js";

describe("I18n", () => {
  it("deve retornar a string traduzida", () => {
    const i18n = new I18n({
      locale: "en",
      translations: statCardLocales({ name: "Anurag Hazra", apostrophe: "s" }),
    });
    expect(i18n.t("statcard.title")).toBe("Anurag Hazra's GitHub Stats");
  });

  it("deve lançar erro se a string de tradução não for encontrada", () => {
    const i18n = new I18n({
      locale: "en",
      translations: statCardLocales({ name: "Anurag Hazra", apostrophe: "s" }),
    });
    expect(() => i18n.t("statcard.title1")).toThrow(
      "statcard.title1 Tradução não encontrada",
    );
  });

  it("deve lançar erro se a tradução não for encontrada para o locale", () => {
    const i18n = new I18n({
      locale: "asdf",
      translations: statCardLocales({ name: "Anurag Hazra", apostrophe: "s" }),
    });
    expect(() => i18n.t("statcard.title")).toThrow(
      "'statcard.title' tradução não encontrada para o locale 'asdf'",
    );
  });
});
