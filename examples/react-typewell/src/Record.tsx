import type { Automaton, EventsView, InputEvent } from "emiel";
import { getAccuracy, getKpm, getRkpm } from "emiel";

export type WordRecordValue = {
  automaton: Automaton;
  displayedAt: DOMHighResTimeStamp;
  logicalWord: string;
};

// 末尾スペース付きで build されたワード用。eventsView() の末尾成功打鍵
// （= 末尾スペース確定打鍵、もしくは `n+space` edge の 2 打目 space）
// を除外した集計を返す。
// 末尾スペースの有無は `automaton.word` から自動判定する。
function computeWordStats(automaton: Automaton): EventsView {
  const base = automaton.eventsView();
  if (!automaton.word.endsWith(" ")) return base;

  const history = automaton.inputHistory;
  let seenSucceeded = 0;
  let newLastSucceeded: InputEvent | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if ("back" in entry) continue;
    if (entry.result.isSucceeded) {
      seenSucceeded++;
      if (seenSucceeded === 2) {
        newLastSucceeded = entry.event;
        break;
      }
    }
  }

  if (!newLastSucceeded) return base;

  return {
    ...base,
    succeededCount: base.succeededCount - 1,
    lastSucceeded: newLastSucceeded,
  };
}

export function Record(props: { wordRecords: WordRecordValue[] }) {
  const records = props.wordRecords.map((record) => {
    const events = computeWordStats(record.automaton);
    const firstSucceededAt = events.firstSucceeded?.timestamp ?? 0;
    const lastSucceededAt = events.lastSucceeded?.timestamp ?? 0;
    const latency = firstSucceededAt - record.displayedAt;
    const time = lastSucceededAt - firstSucceededAt;
    const rkpm = getRkpm(events.succeededCount, firstSucceededAt, lastSucceededAt);
    const kpm = getKpm(events.succeededCount, record.displayedAt, lastSucceededAt);
    const accuracy = getAccuracy(events.failedCount, events.totalCount);
    return {
      latency,
      time,
      kpm,
      rkpm,
      events,
      accuracy,
      word: record.logicalWord,
    };
  });
  const totalLatency = records.reduce((acc, r) => acc + r.latency, 0);
  const totalSucceededCount = records.reduce((acc, r) => acc + r.events.succeededCount, 0);
  const totalFailedCount = records.reduce((acc, r) => acc + r.events.failedCount, 0);
  const totalAccuracy = getAccuracy(totalFailedCount, totalSucceededCount);
  return (
    <div>
      <h1>Finished!</h1>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <table style={{ border: "0" }}>
          <tbody>
            <tr>
              <td>inputs</td>
              <td>{totalSucceededCount}</td>
            </tr>
            <tr>
              <td>miss</td>
              <td>{totalFailedCount}</td>
            </tr>
            <tr>
              <td>avg latency</td>
              <td>{Math.trunc(totalLatency / records.length)}ms</td>
            </tr>
            <tr>
              <td>accuracy</td>
              <td>{(totalAccuracy * 100).toFixed(2)} %</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul>
        {records.map((r, index) => {
          return (
            <li key={index}>
              {r.word} time:{Math.trunc(r.time)}ms kpm:{Math.trunc(r.kpm)} rkpm:
              {Math.trunc(r.rkpm)} miss:{r.events.failedCount}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
