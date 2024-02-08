//@ts-check
import * as emiel from "emiel";

const automaton = emiel.rule.getRoman().build("かった");
const Key = emiel.VirtualKeys;
const inputResult = [Key.K, Key.A, Key.F, Key.T, Key.T, Key.A].map((k) => [
  k,
  automaton.input(
    new emiel.InputEvent(
      new emiel.InputStroke(k, "keydown"),
      new emiel.KeyboardState(),
      new Date()
    )
  ),
]);
console.log(inputResult);
