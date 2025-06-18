import { Automaton, getAccuracy, getKpm, getRkpm } from "emiel";

export type WordRecordValue = {
  automaton: Automaton;
  displayedAt: Date;
};

export function Record(props: { wordRecords: WordRecordValue[] }) {
  const records = props.wordRecords.map((record) => {
    // ワードが表示されてから1打鍵めに成功するまでの経過時間
    const automaton = record.automaton;
    const latency =
      automaton.getFirstInputTime().getTime() - record.displayedAt.getTime();
    const rkpm = getRkpm(
      automaton.edgeHistories.length,
      automaton.getFirstInputTime(),
      automaton.getLastInputTime());

    // latency の時間を含めた、1分あたりの打鍵数
    const kpm = getKpm(automaton.edgeHistories.length, record.displayedAt, automaton.getLastInputTime());
    const accuracy = getAccuracy(record.automaton.getFailedInputCount(), record.automaton.getTotalInputCount());
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
    (acc, r) => acc + r.record.automaton.edgeHistories.length,
    0
  );
  const totalFailedCount = records.reduce(
    (acc, r) => acc + r.record.automaton.getFailedInputCount(),
    0
  );
  const totalAccuracy = getAccuracy(totalFailedCount, totalSucceededCount);
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
