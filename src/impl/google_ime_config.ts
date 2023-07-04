import { loadFromGoogleImeText } from "./google_ime_config_loader";
import tomoemon_azik from "../assets/google_ime_tomoemon_azik.txt?raw";
import roman from "../assets/google_ime_default_roman.txt?raw";
import { mergeRule } from "../core/rule_merger";
import { alphaNumericRule } from "./alpha_numeric_rule";

export const rules = {
  // tomoemon_azik: mergeRule(
  //   loadFromGoogleImeText("tomoemon-azik", tomoemon_azik),
  //   alphaNumericRule
  // ),
  roman: mergeRule(loadFromGoogleImeText("roman", roman), alphaNumericRule),
};
