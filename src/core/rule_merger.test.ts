import { Comparable } from "./rule";

class Key implements Comparable<Key> {
  constructor(public readonly code: string) {}
  equals(other: Key): boolean {
    return this.code === other.code;
  }
  toString(): string {
    return this.code;
  }
}

const keys = {
  A: new Key("A"),
  B: new Key("B"),
  C: new Key("C"),
  D: new Key("D"),
  E: new Key("E"),
} as const;
