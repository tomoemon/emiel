import { NullModifier, OrModifier, Rule, RuleEntry } from "../core/rule";
import { AcceptableCodeStroke } from "./stroke";
import { VirtualKey, VirtualKeys } from "./virtual_key";

export function loadFromGoogleImeText(
  name: string,
  text: string
): Rule<AcceptableCodeStroke, VirtualKey> {
  /*
		a	あ	
		ta	た	
		tt	っ	t
		*/
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\r/g, "\n");
  const lines = text.split("\n");
  const entries: RuleEntry<AcceptableCodeStroke>[] = [];
  for (let line of lines) {
    line = line.trim();
    if (line.length == 0) {
      continue;
    }
    const cols = line.split("\t");
    if (cols.length < 2) {
      continue;
    }
    if (cols.length < 3) {
      cols.push("");
    }
    const input: AcceptableCodeStroke[] = [...cols[0]].map((c) =>
      toKeyCodeStrokeFromKeyChar(c)
    );
    const output = cols[1];
    const nextInput: AcceptableCodeStroke[] = [...cols[2]].map((c) =>
      toKeyCodeStrokeFromKeyChar(c)
    );
    entries.push(new RuleEntry(input, output, nextInput));
  }
  return new Rule(name, entries, [
    new OrModifier<VirtualKey>([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight]),
  ]);
}

export function toKeyCodeStrokeFromKeyChar(key: string): AcceptableCodeStroke {
  const keyInput = charToKeyCodeStroke[key];
  if (keyInput === undefined) {
    throw new Error("invalid key: " + key);
  }
  return keyInput;
}

// Mac + JIS キーボード で取得した場合の code を前提にしている
// https://www.toptal.com/developers/keycode
const charToKeyCodeStroke: { [key: string]: AcceptableCodeStroke } = {
  a: new AcceptableCodeStroke([VirtualKeys.A], new NullModifier()),
  b: new AcceptableCodeStroke([VirtualKeys.B], new NullModifier()),
  c: new AcceptableCodeStroke([VirtualKeys.C], new NullModifier()),
  d: new AcceptableCodeStroke([VirtualKeys.D], new NullModifier()),
  e: new AcceptableCodeStroke([VirtualKeys.E], new NullModifier()),
  f: new AcceptableCodeStroke([VirtualKeys.F], new NullModifier()),
  g: new AcceptableCodeStroke([VirtualKeys.G], new NullModifier()),
  h: new AcceptableCodeStroke([VirtualKeys.H], new NullModifier()),
  i: new AcceptableCodeStroke([VirtualKeys.I], new NullModifier()),
  j: new AcceptableCodeStroke([VirtualKeys.J], new NullModifier()),
  k: new AcceptableCodeStroke([VirtualKeys.K], new NullModifier()),
  l: new AcceptableCodeStroke([VirtualKeys.L], new NullModifier()),
  m: new AcceptableCodeStroke([VirtualKeys.M], new NullModifier()),
  n: new AcceptableCodeStroke([VirtualKeys.N], new NullModifier()),
  o: new AcceptableCodeStroke([VirtualKeys.O], new NullModifier()),
  p: new AcceptableCodeStroke([VirtualKeys.P], new NullModifier()),
  q: new AcceptableCodeStroke([VirtualKeys.Q], new NullModifier()),
  r: new AcceptableCodeStroke([VirtualKeys.R], new NullModifier()),
  s: new AcceptableCodeStroke([VirtualKeys.S], new NullModifier()),
  t: new AcceptableCodeStroke([VirtualKeys.T], new NullModifier()),
  u: new AcceptableCodeStroke([VirtualKeys.U], new NullModifier()),
  v: new AcceptableCodeStroke([VirtualKeys.V], new NullModifier()),
  w: new AcceptableCodeStroke([VirtualKeys.W], new NullModifier()),
  x: new AcceptableCodeStroke([VirtualKeys.X], new NullModifier()),
  y: new AcceptableCodeStroke([VirtualKeys.Y], new NullModifier()),
  z: new AcceptableCodeStroke([VirtualKeys.Z], new NullModifier()),
  A: new AcceptableCodeStroke(
    [VirtualKeys.A],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  B: new AcceptableCodeStroke(
    [VirtualKeys.B],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  C: new AcceptableCodeStroke(
    [VirtualKeys.C],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  D: new AcceptableCodeStroke(
    [VirtualKeys.D],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  E: new AcceptableCodeStroke(
    [VirtualKeys.E],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  F: new AcceptableCodeStroke(
    [VirtualKeys.F],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  G: new AcceptableCodeStroke(
    [VirtualKeys.G],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  H: new AcceptableCodeStroke(
    [VirtualKeys.H],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  I: new AcceptableCodeStroke(
    [VirtualKeys.I],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  J: new AcceptableCodeStroke(
    [VirtualKeys.J],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  K: new AcceptableCodeStroke(
    [VirtualKeys.K],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  L: new AcceptableCodeStroke(
    [VirtualKeys.L],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  M: new AcceptableCodeStroke(
    [VirtualKeys.M],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  N: new AcceptableCodeStroke(
    [VirtualKeys.N],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  O: new AcceptableCodeStroke(
    [VirtualKeys.O],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  P: new AcceptableCodeStroke(
    [VirtualKeys.P],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  Q: new AcceptableCodeStroke(
    [VirtualKeys.Q],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  R: new AcceptableCodeStroke(
    [VirtualKeys.R],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  S: new AcceptableCodeStroke(
    [VirtualKeys.S],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  T: new AcceptableCodeStroke(
    [VirtualKeys.T],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  U: new AcceptableCodeStroke(
    [VirtualKeys.U],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  V: new AcceptableCodeStroke(
    [VirtualKeys.V],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  W: new AcceptableCodeStroke(
    [VirtualKeys.W],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  X: new AcceptableCodeStroke(
    [VirtualKeys.X],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  Y: new AcceptableCodeStroke(
    [VirtualKeys.Y],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  Z: new AcceptableCodeStroke(
    [VirtualKeys.Z],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "1": new AcceptableCodeStroke([VirtualKeys.Digit1], new NullModifier()),
  "2": new AcceptableCodeStroke([VirtualKeys.Digit2], new NullModifier()),
  "3": new AcceptableCodeStroke([VirtualKeys.Digit3], new NullModifier()),
  "4": new AcceptableCodeStroke([VirtualKeys.Digit4], new NullModifier()),
  "5": new AcceptableCodeStroke([VirtualKeys.Digit5], new NullModifier()),
  "6": new AcceptableCodeStroke([VirtualKeys.Digit6], new NullModifier()),
  "7": new AcceptableCodeStroke([VirtualKeys.Digit7], new NullModifier()),
  "8": new AcceptableCodeStroke([VirtualKeys.Digit8], new NullModifier()),
  "9": new AcceptableCodeStroke([VirtualKeys.Digit9], new NullModifier()),
  "0": new AcceptableCodeStroke([VirtualKeys.Digit0], new NullModifier()),
  "!": new AcceptableCodeStroke(
    [VirtualKeys.Digit1],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  '"': new AcceptableCodeStroke(
    [VirtualKeys.Digit2],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "#": new AcceptableCodeStroke(
    [VirtualKeys.Digit3],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  $: new AcceptableCodeStroke(
    [VirtualKeys.Digit4],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "%": new AcceptableCodeStroke(
    [VirtualKeys.Digit5],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "&": new AcceptableCodeStroke(
    [VirtualKeys.Digit6],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "'": new AcceptableCodeStroke(
    [VirtualKeys.Digit7],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "(": new AcceptableCodeStroke(
    [VirtualKeys.Digit8],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  ")": new AcceptableCodeStroke(
    [VirtualKeys.Digit9],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "-": new AcceptableCodeStroke([VirtualKeys.Minus], new NullModifier()),
  "^": new AcceptableCodeStroke([VirtualKeys.Equal], new NullModifier()),
  "\\": new AcceptableCodeStroke([VirtualKeys.JpnYen], new NullModifier()),
  "@": new AcceptableCodeStroke([VirtualKeys.BracketLeft], new NullModifier()),
  "[": new AcceptableCodeStroke([VirtualKeys.BracketRight], new NullModifier()),
  ";": new AcceptableCodeStroke([VirtualKeys.Semicolon], new NullModifier()),
  ":": new AcceptableCodeStroke([VirtualKeys.Quote], new NullModifier()),
  "]": new AcceptableCodeStroke([VirtualKeys.Backslash], new NullModifier()),
  ",": new AcceptableCodeStroke([VirtualKeys.Comma], new NullModifier()),
  ".": new AcceptableCodeStroke([VirtualKeys.Period], new NullModifier()),
  "/": new AcceptableCodeStroke([VirtualKeys.Slash], new NullModifier()),
  "=": new AcceptableCodeStroke(
    [VirtualKeys.Minus],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "~": new AcceptableCodeStroke(
    [VirtualKeys.Equal],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "|": new AcceptableCodeStroke(
    [VirtualKeys.JpnYen],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "`": new AcceptableCodeStroke(
    [VirtualKeys.BracketLeft],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "{": new AcceptableCodeStroke(
    [VirtualKeys.BracketRight],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "+": new AcceptableCodeStroke(
    [VirtualKeys.Semicolon],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "*": new AcceptableCodeStroke(
    [VirtualKeys.Quote],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "}": new AcceptableCodeStroke(
    [VirtualKeys.Backslash],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "<": new AcceptableCodeStroke(
    [VirtualKeys.Comma],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  ">": new AcceptableCodeStroke(
    [VirtualKeys.Period],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  "?": new AcceptableCodeStroke(
    [VirtualKeys.Slash],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
  _: new AcceptableCodeStroke(
    [VirtualKeys.JpnRo],
    new OrModifier([VirtualKeys.ShiftLeft, VirtualKeys.ShiftRight])
  ),
};
