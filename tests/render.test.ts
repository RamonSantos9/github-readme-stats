import { describe, expect, it } from "@jest/globals";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom/jest-globals";
import { renderError } from "../src/common/render.js";

describe("Testes em common/render.ts (renderError)", () => {
  it("deve testar renderError com mensagem simples", () => {
    document.body.innerHTML = renderError({ message: "Algo deu errado" });
    expect(
      queryByTestId(document.body, "message")?.children[0],
    ).toHaveTextContent(/Algo deu errado/gim);
    expect(
      queryByTestId(document.body, "message")?.children[1],
    ).toBeEmptyDOMElement();
  });

  it("deve testar renderError com mensagem secundária", () => {
    document.body.innerHTML = renderError({
      message: "Algo deu errado",
      secondaryMessage: "Mensagem Secundária",
    });
    expect(
      queryByTestId(document.body, "message")?.children[1],
    ).toHaveTextContent(/Mensagem Secundária/gim);
  });
});
