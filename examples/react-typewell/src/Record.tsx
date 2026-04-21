import { getAccuracy, getKpm } from "emiel";
import type { WordAutomaton } from "./wordAutomaton";

export function Record(props: { automaton: WordAutomaton }) {
  const words = props.automaton.words();
  const perWord = props.automaton.eventsPerWord();
  const records = perWord.map((w, i) => {
    const firstTs = w.firstSucceeded?.timestamp ?? 0;
    const lastTs = w.lastSucceeded?.timestamp ?? 0;
    const time = lastTs - firstTs;
    const kpm = time > 0 ? getKpm(w.succeededCount, firstTs, lastTs) : 0;
    return {
      word: words[i],
      time,
      kpm,
      miss: w.failedCount,
    };
  });
  const totalSucceeded = perWord.reduce((acc, w) => acc + w.succeededCount, 0);
  const totalFailed = perWord.reduce((acc, w) => acc + w.failedCount, 0);
  const totalAccuracy = getAccuracy(totalFailed, totalSucceeded);
  return (
    <div>
      <h1>Finished!</h1>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <table style={{ border: "0" }}>
          <tbody>
            <tr>
              <td>inputs</td>
              <td>{totalSucceeded}</td>
            </tr>
            <tr>
              <td>miss</td>
              <td>{totalFailed}</td>
            </tr>
            <tr>
              <td>accuracy</td>
              <td>{(totalAccuracy * 100).toFixed(2)} %</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul>
        {records.map((r, index) => (
          <li key={index}>
            {r.word} time:{Math.trunc(r.time)}ms kpm:{Math.trunc(r.kpm)} miss:{r.miss}
          </li>
        ))}
      </ul>
    </div>
  );
}
