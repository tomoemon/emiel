import { AutomatonImpl } from "../core/automaton";
import { buildKanaNode } from "../core/builderKanaGraph";
import { buildStrokeNode } from "../core/builderStrokeGraph";
import type { normalizerFunc, Rule } from "../core/rule";
import * as AutomatonQuery from "./automatonQuery";
import { defaultComposedNormalize } from "./charNormalizer";

export function build(
  rule: Rule,
  kanaText: string,
  normalize: normalizerFunc = defaultComposedNormalize,
): Automaton {
  const { endNode, rulesByKanaIndex } = buildKanaNode(rule, kanaText, normalize);
  const automaton = new AutomatonImpl(kanaText, buildStrokeNode(endNode), rule, rulesByKanaIndex);
  return automaton.with(baseExtension);
}

const baseExtension = {
  getFinishedWord: AutomatonQuery.getFinishedWord,
  getPendingWord: AutomatonQuery.getPendingWord,
  getFinishedStroke: AutomatonQuery.getFinishedStroke,
  getPendingStroke: AutomatonQuery.getPendingStroke,
  getEffectiveEdges: AutomatonQuery.getEffectiveEdges,
  isFinished: AutomatonQuery.isFinished,
  getFirstInputTime: AutomatonQuery.getFirstInputTime,
  getLastInputTime: AutomatonQuery.getLastInputTime,
  getFirstSucceededInputTime: AutomatonQuery.getFirstSucceededInputTime,
  getLastSucceededInputTime: AutomatonQuery.getLastSucceededInputTime,
  getFailedInputCount: AutomatonQuery.getFailedInputCount,
  getTotalInputCount: AutomatonQuery.getTotalInputCount,
  getFinishedRoman: AutomatonQuery.getFinishedRoman,
  getPendingRoman: AutomatonQuery.getPendingRoman,
};

export type BaseExtensionType = {
  [K in keyof typeof baseExtension]: () => ReturnType<(typeof baseExtension)[K]>;
};

export type Automaton = AutomatonImpl & BaseExtensionType;
