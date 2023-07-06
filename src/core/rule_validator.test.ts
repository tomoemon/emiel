import { Comparable, Rule, RuleEntry } from "./rule";
import { validateRule } from "./rule_validator";
import { expect, test } from "vitest";
import { RuleStroke } from "./stroke";
import { AndModifier, ModifierGroup } from "./modifier";

const nullModifier = new AndModifier<Key>();

class Key implements Comparable<Key> {
  constructor(public readonly code: string) {}
  equals(other: Key): boolean {
    return this.code === other.code;
  }
  toString(): string {
    return this.code;
  }
}

test("entry 1つのときに矛盾はない", () => {
  const modifierGroups = [
    new ModifierGroup<Key>([new Key("ShiftLeft"), new Key("ShiftRight")]),
  ];
  const rule = new Rule<Key>(
    "test-rule",
    [
      new RuleEntry<Key>(
        [new RuleStroke<Key>(new Key("A"), nullModifier, modifierGroups)],
        "あ",
        [],
        false
      ),
    ],
    modifierGroups
  );
  expect(() => validateRule<Key>(rule)).not.toThrowError();
});

test("異なる output を持つ時、異なる unnecesary modifier があっても問題ない", () => {
  const modifierGroups = [
    new ModifierGroup<Key>([new Key("ShiftLeft"), new Key("ShiftRight")]),
  ];
  const rule = new Rule<Key>(
    "test-rule",
    [
      new RuleEntry<Key>(
        [new RuleStroke<Key>(new Key("A"), nullModifier, modifierGroups)],
        "あ",
        [],
        false
      ),
      new RuleEntry<Key>(
        [
          new RuleStroke<Key>(new Key("A"), nullModifier, [
            new ModifierGroup<Key>([new Key("ControlLeft")]),
          ]),
        ],
        "い",
        [],
        false
      ),
    ],
    modifierGroups
  );
  expect(() => validateRule<Key>(rule)).not.toThrowError();
});

test("同じ output を持つ時、異なる unnecesary modifier があると矛盾", () => {
  const modifierGroups = [
    new ModifierGroup<Key>([new Key("ShiftLeft"), new Key("ShiftRight")]),
  ];
  const rule = new Rule<Key>(
    "test-rule",
    [
      new RuleEntry<Key>(
        [new RuleStroke<Key>(new Key("A"), nullModifier, modifierGroups)],
        "あ",
        [],
        false
      ),
      new RuleEntry<Key>(
        [
          new RuleStroke<Key>(new Key("A"), nullModifier, [
            new ModifierGroup<Key>([new Key("ControlLeft")]),
          ]),
        ],
        "あ",
        [],
        false
      ),
    ],
    modifierGroups
  );
  expect(() => validateRule<Key>(rule)).toThrowError();
});
