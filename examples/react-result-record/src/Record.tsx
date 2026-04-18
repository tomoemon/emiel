import type { Automaton } from "emiel";
import { getAccuracy, getKpm, getRkpm } from "emiel";

export type WordRecordValue = {
  automaton: Automaton;
  displayedAt: DOMHighResTimeStamp;
};

export function Record(props: { wordRecords: WordRecordValue[] }) {
  const records = props.wordRecords.map((record) => {
    // Record はワード入力完了後に表示されるので firstSucceeded/lastSucceeded は必ず存在する
    const events = record.automaton.eventsView();
    const firstSucceededAt = events.firstSucceeded?.timestamp ?? 0;
    const lastSucceededAt = events.lastSucceeded?.timestamp ?? 0;
    const latency = firstSucceededAt - record.displayedAt;
    const rkpm = getRkpm(events.succeededCount, firstSucceededAt, lastSucceededAt);
    const kpm = getKpm(events.succeededCount, record.displayedAt, lastSucceededAt);
    const accuracy = getAccuracy(events.failedCount, events.totalCount);
    return {
      latency,
      kpm,
      rkpm,
      events,
      accuracy,
      word: record.automaton.word,
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
              {r.word} latency:{Math.trunc(r.latency)}ms kpm:{Math.trunc(r.kpm)} rkpm:
              {Math.trunc(r.rkpm)} acc:{(r.accuracy * 100).toFixed(2)}%
            </li>
          );
        })}
      </ul>
    </div>
  );
}
