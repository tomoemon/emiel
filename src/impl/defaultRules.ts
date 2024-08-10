import { loadMozcRule } from "./mozcRuleLoader";
import tomoemon_azik from "../assets/rules/google_ime_tomoemon_azik.txt?raw";
import roman from "../assets/rules/google_ime_default_roman.txt?raw";
import { mergeRule } from "../core/ruleMerger";
import { getAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadJsonRule } from "./jsonRuleLoader";
import jis_kana from "../assets/rules/jis_kana.json";
import nicola from "../assets/rules/nicola.json";
import { Rule } from "../core/rule";
import { setDefaultFunc } from "../utils/map";
import { KeyboardLayout } from "../core/keyboardLayout";

class Rules {
  private static cache: Map<string, Rule> = new Map();
  get(
    name: "tomoemon-azik" | "roman" | "jis-kana" | "nicola",
    layout: KeyboardLayout
  ): Rule {
    switch (name) {
      case "tomoemon-azik":
        return Rules.getFromGoogleImeText(
          "tomoemon-azik",
          tomoemon_azik,
          layout
        );
      case "roman":
        return Rules.getFromGoogleImeText("roman", roman, layout);
      case "jis-kana":
        return Rules.getFromJsonConfig("jis-kana", jis_kana, layout);
      case "nicola":
        return Rules.getFromJsonConfig("nicola", nicola, layout);
    }
  }
  static getFromGoogleImeText(
    name: string,
    text: string,
    layout: KeyboardLayout
  ): Rule {
    return setDefaultFunc(Rules.cache, name + "/" + layout.name, () =>
      mergeRule(
        loadMozcRule(name, text, layout),
        getAlphaNumericRuleByLayout(layout)
      )
    );
  }
  static getFromJsonConfig(
    name: string,
    jsonData: any,
    layout: KeyboardLayout
  ): Rule {
    return setDefaultFunc(Rules.cache, name + "/" + layout.name, () =>
      mergeRule(
        loadJsonRule(name, jsonData),
        getAlphaNumericRuleByLayout(layout)
      )
    );
  }
}

export const rules = new Rules();
