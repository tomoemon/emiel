import { Automaton } from "../core/automaton";
import { VirtualKey, VirtualKeys } from "./virtual_key";

export class DefaultGuide {
  constructor(readonly automaton: Automaton<VirtualKey>) {}
  get pendingWordSubstr(): string {
    return this.automaton.pendingWordSubstr;
  }
  get finishedWordSubstr(): string {
    return this.automaton.finishedWordSubstr;
  }
  get pendingKeys(): string {
    return this.automaton.shortestPendingStrokes
      .map((s) =>
        keyToString(
          s.key,
          s.requiredModifier.has(VirtualKeys.ShiftLeft) ||
            s.requiredModifier.has(VirtualKeys.ShiftRight)
        )
      )
      .join("");
  }
  get finishedKeys(): string {
    return this.automaton.succeededInputs
      .map((s) =>
        keyToString(
          s.key,
          s.requiredModifier.has(VirtualKeys.ShiftLeft) ||
            s.requiredModifier.has(VirtualKeys.ShiftRight)
        )
      )
      .join("");
  }
}

/**
 * JISキーボードのキー入力前提で変換を行なっているので、記号周りは要検討
 */
function keyToString(key: VirtualKey, shiftKeyPressed: boolean): string {
  switch (key) {
    case VirtualKeys.A:
    case VirtualKeys.B:
    case VirtualKeys.C:
    case VirtualKeys.D:
    case VirtualKeys.E:
    case VirtualKeys.F:
    case VirtualKeys.G:
    case VirtualKeys.H:
    case VirtualKeys.I:
    case VirtualKeys.J:
    case VirtualKeys.K:
    case VirtualKeys.L:
    case VirtualKeys.M:
    case VirtualKeys.N:
    case VirtualKeys.O:
    case VirtualKeys.P:
    case VirtualKeys.Q:
    case VirtualKeys.R:
    case VirtualKeys.S:
    case VirtualKeys.T:
    case VirtualKeys.U:
    case VirtualKeys.V:
    case VirtualKeys.W:
    case VirtualKeys.X:
    case VirtualKeys.Y:
    case VirtualKeys.Z:
      if (shiftKeyPressed) {
        return key.toString().toUpperCase();
      } else {
        return key.toString().toLowerCase();
      }
    case VirtualKeys.Digit0:
      return "0";
    case VirtualKeys.Digit1:
      if (shiftKeyPressed) {
        return "!";
      }
      return "1";
    case VirtualKeys.Digit2:
      if (shiftKeyPressed) {
        return '"';
      }
      return "2";
    case VirtualKeys.Digit3:
      if (shiftKeyPressed) {
        return "#";
      }
      return "3";
    case VirtualKeys.Digit4:
      if (shiftKeyPressed) {
        return "$";
      }
      return "4";
    case VirtualKeys.Digit5:
      if (shiftKeyPressed) {
        return "%";
      }
      return "5";
    case VirtualKeys.Digit6:
      if (shiftKeyPressed) {
        return "&";
      }
      return "6";
    case VirtualKeys.Digit7:
      if (shiftKeyPressed) {
        return "'";
      }
      return "7";
    case VirtualKeys.Digit8:
      if (shiftKeyPressed) {
        return "(";
      }
      return "8";
    case VirtualKeys.Digit9:
      if (shiftKeyPressed) {
        return ")";
      }
      return "9";
    case VirtualKeys.Minus:
      if (shiftKeyPressed) {
        return "=";
      }
      return "-";
    case VirtualKeys.Equal:
      if (shiftKeyPressed) {
        return "~";
      }
      return "^";
    case VirtualKeys.JpnYen:
      if (shiftKeyPressed) {
        return "|";
      }
      return "\\";
    case VirtualKeys.BracketLeft:
      if (shiftKeyPressed) {
        return "`";
      }
      return "@";
    case VirtualKeys.BracketRight:
      if (shiftKeyPressed) {
        return "{";
      }
      return "[";
    case VirtualKeys.Semicolon:
      if (shiftKeyPressed) {
        return "+";
      }
      return ";";
    case VirtualKeys.Quote:
      if (shiftKeyPressed) {
        return "*";
      }
      return ":";
    case VirtualKeys.Backslash:
      if (shiftKeyPressed) {
        return "}";
      }
      return "]";
    case VirtualKeys.Comma:
      if (shiftKeyPressed) {
        return "<";
      }
      return ",";
    case VirtualKeys.Period:
      if (shiftKeyPressed) {
        return ">";
      }
      return ".";
    case VirtualKeys.Slash:
      if (shiftKeyPressed) {
        return "?";
      }
      return "/";
    case VirtualKeys.JpnRo:
      if (shiftKeyPressed) {
        return "_";
      }
      return "\\";
    case VirtualKeys.Space:
      return "␣";
  }
  return key.toString();
}
