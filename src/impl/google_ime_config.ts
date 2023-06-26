import { loadFromGoogleImeText } from "./google_ime_config_loader";
import tomoemon_azik from "../assets/google_ime_tomoemon_azik.txt?raw";
import roman from "../assets/google_ime_default_roman.txt?raw";

export const rules = {
  tomoemon_azik: loadFromGoogleImeText("tomoemon-azik", tomoemon_azik),
  roman: loadFromGoogleImeText("roman", roman),
};
