import { loadFromGoogleImeText } from "./googleImeConfigLoader";
import tomoemon_azik from "../assets/rules/google_ime_tomoemon_azik.txt?raw";
import roman from "../assets/rules/google_ime_default_roman.txt?raw";
import { mergeRule } from "../core/ruleMerger";
import { getAlphaNumericRuleByLayout } from "./alphaNumericRule";
import { loadFromJsonConfig } from "./jsonConfigLoader";
import jis_kana from "../assets/rules/jis_kana.json";
import nicola from "../assets/rules/nicola.json";
import { VirtualKey } from "./virtualKey";
import { Rule } from "../core/rule";
import { setDefaultFunc } from "../utils/map";
import { KeyboardLayout } from "../core/keyboardLayout";

class Rules {
  private static cache: Map<string, Rule<VirtualKey>> = new Map();
  get(
    name: "tomoemon-azik" | "roman" | "jis-kana" | "nicola",
    layout: KeyboardLayout<VirtualKey>
  ): Rule<VirtualKey> {
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
    layout: KeyboardLayout<VirtualKey>
  ): Rule<VirtualKey> {
    return setDefaultFunc(Rules.cache, name, () =>
      mergeRule(
        loadFromGoogleImeText(name, text, layout),
        getAlphaNumericRuleByLayout(layout)
      )
    );
  }
  static getFromJsonConfig(
    name: string,
    jsonData: any,
    layout: KeyboardLayout<VirtualKey>
  ): Rule<VirtualKey> {
    return setDefaultFunc(Rules.cache, name, () =>
      mergeRule(
        loadFromJsonConfig(name, jsonData),
        getAlphaNumericRuleByLayout(layout)
      )
    );
  }
}

export const rules = new Rules();
