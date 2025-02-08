//@ts-check
import {
  InputEvent,
  InputStroke,
  KeyboardState,
  VirtualKeys,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleRoman,
} from "emiel";

const layout = loadPresetKeyboardLayoutQwertyJis();
const automaton = loadPresetRuleRoman(layout).build("かった");
const Key = VirtualKeys;
const inputResult = [Key.K, Key.A, Key.F, Key.T, Key.T, Key.A].map((k) => [
  k,
  automaton.input(
    new InputEvent(
      new InputStroke(k, "keydown"),
      new KeyboardState(),
      new Date()
    )
  ),
]);
console.log(inputResult);
