import { loadFromGoogleImeText } from "./google_ime_config_loader";
import tomoemon_azik from "../assets/google_ime_tomoemon_azik.txt?raw";
import roman from "../assets/google_ime_default_roman.txt?raw";
import { mergeRule } from "../core/rule_merger";
import { alphaNumericRule } from "./alpha_numeric_rule";
import { loadFromJsonConfig } from "./json_config_loader";
import jis_kana from "../assets/jis_kana.json";
import nicola from "../assets/nicola.json";
import { VirtualKey } from "./virtual_key";
import { Rule } from "../core/rule";

class Rules {
  private static cache: Map<string, Rule<VirtualKey>> = new Map();
  get tomoemon_azik() {
    return Rules.getFromGoogleImeText("tomoemon-azik", tomoemon_azik);
  }
  get roman() {
    return Rules.getFromGoogleImeText("roman", roman);
  }
  get jis_kana() {
    return Rules.getFromJsonConfig("jis-kana", jis_kana);
  }
  get nicola() {
    return Rules.getFromJsonConfig("nicola", nicola);
  }
  static getFromGoogleImeText(name: string, text: string): Rule<VirtualKey> {
    if (!Rules.cache.has(name)) {
      Rules.cache.set(
        name,
        mergeRule(loadFromGoogleImeText(name, text), alphaNumericRule)
      );
    }
    return Rules.cache.get(name)!;
  }
  static getFromJsonConfig(name: string, jsonData: any): Rule<VirtualKey> {
    if (!Rules.cache.has(name)) {
      Rules.cache.set(
        name,
        mergeRule(loadFromJsonConfig(name, jsonData), alphaNumericRule)
      );
    }
    return Rules.cache.get(name)!;
  }
}

export const rules = new Rules();
