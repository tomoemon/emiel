//@ts-check
import {
  InputEvent,
  InputStroke,
  KeyboardState,
  VirtualKeys,
  build,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleRoman,
} from "emiel";

const layout = loadPresetKeyboardLayoutQwertyJis();
const automaton = build(loadPresetRuleRoman(layout), "かった");
const Key = VirtualKeys;
const inputResult = [Key.K, Key.A, Key.F, Key.T, Key.T, Key.A].map((k) => [
  k,
  automaton.input(new InputEvent(new InputStroke(k, "keydown"), new KeyboardState(), new Date())),
]);
console.log(inputResult);
