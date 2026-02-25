/**
 * @fileoverview Declarações de tipos para módulos sem definições oficiais.
 */

declare module "emoji-name-map" {
  const emojiNameMap: {
    get: (name: string) => string | undefined;
  };
  export default emojiNameMap;
}

declare module "github-username-regex" {
  const githubUsernameRegex: RegExp;
  export default githubUsernameRegex;
}

declare module "js-yaml" {
  export function load(str: string, opts?: any): any;
  export function dump(obj: any, opts?: any): string;
}

declare module "express";
declare module "hjson";
declare module "lodash.snakecase";
declare module "parse-diff";
declare module "color-contrast-checker";

declare module "*/themes/index.js" {
  export const themes: any;
}
