import { Automaton } from "../core/automaton";
import { RuleStroke } from "../core/stroke";
import { KeyboardLayout } from "../core/keyboardLayout";
import { VirtualKey } from "./virtualKey";

export class DefaultGuide {
  constructor(
    readonly layout: KeyboardLayout<VirtualKey>,
    readonly automaton: Automaton<VirtualKey>
  ) {}
  get pendingWordSubstr(): string {
    return this.automaton.pendingWordSubstr;
  }
  get finishedWordSubstr(): string {
    return this.automaton.finishedWordSubstr;
  }
  get pendingKeys(): string {
    return this.automaton.shortestPendingStrokes
      .map((s) => strokeToString(this.layout, s))
      .join("");
  }
  get finishedKeys(): string {
    return this.automaton.succeededInputs
      .map((s) => strokeToString(this.layout, s))
      .join("");
  }
}

function strokeToString(
  layout: KeyboardLayout<VirtualKey>,
  stroke: RuleStroke<VirtualKey>
): string {
  if (stroke.isFromKeyboardLayout) {
    return layout.getCharByStroke(stroke);
  }
  return "";
}
