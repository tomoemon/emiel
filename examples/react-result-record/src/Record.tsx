import * as emiel from "emiel";

export type WordRecordValue = {
  automaton: emiel.Automaton;
  displayedAt: Date;
};

export function Record(props: { wordRecords: WordRecordValue[] }) {
  const records = props.wordRecords.map((record) => {
    // ワードが表示されてから1打鍵めに成功するまでの経過時間
    const automaton = record.automaton;
    const latency =
      automaton.firstInputTime.getTime() - record.displayedAt.getTime();
    const rkpm = emiel.stats.rkpm(
      automaton.histories.length,
      automaton.firstInputTime,
      automaton.lastInputTime);

    // latency の時間を含めた、1分あたりの打鍵数
    const kpm = emiel.stats.kpm(automaton.histories.length, record.displayedAt, automaton.lastInputTime);
    const accuracy = emiel.stats.accuracy(record.automaton.failedInputCount, record.automaton.totalInputCount);
    return {
      latency,
      kpm,
      rkpm,
      record,
      accuracy,
      word: record.automaton.word,
    };
  });
  const totalLatency = records.reduce((acc, r) => acc + r.latency, 0);
  const totalSucceededCount = records.reduce(
    (acc, r) => acc + r.record.automaton.histories.length,
    0
  );
  const totalFailedCount = records.reduce(
    (acc, r) => acc + r.record.automaton.failedInputCount,
    0
  );
  const totalAccuracy = emiel.stats.accuracy(totalFailedCount, totalSucceededCount);
  return (
    <div>
      <h1>Finished!</h1>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <table style={{ border: "0" }}>
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
            <td>
              {(totalAccuracy * 100).toFixed(2)} %
            </td>
          </tr>
        </table>
      </div>
      <ul>
        {records.map((r, index) => {
          return (
            <li key={index}>
              {r.word} latency:{r.latency}ms kpm:{r.kpm} rkpm:{r.rkpm} acc:
              {(r.accuracy * 100).toFixed(2)}%
            </li>
          );
        })}
      </ul>
    </div>
  );
}
