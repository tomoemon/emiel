import * as emiel from "emiel";

export type WordRecordValue = {
  automaton: emiel.Automaton;
  displayedAt: Date;
  firstInputtedAt: Date;
  finishedAt: Date;
  missCount: number;
};

export function Record(props: { wordRecords: WordRecordValue[] }) {
  const records = props.wordRecords.map((record) => {
    // ワードが表示されてから1打鍵めに成功するまでの経過時間
    const latency =
      record.firstInputtedAt.getTime() - record.displayedAt.getTime();
    // latency の時間を除いた、1分あたりの打鍵数
    // 「latency の時間を除く」＝「1打鍵めに要する時間を除く」ということなので、
    // 打鍵数を1減らして計算する
    const rkpm = Math.trunc(
      ((record.automaton.succeededInputs.length - 1) /
        (record.finishedAt.getTime() - record.firstInputtedAt.getTime())) *
      1000 *
      60
    );
    // latency の時間を含めた、1分あたりの打鍵数
    const kpm = Math.trunc(
      (record.automaton.succeededInputs.length /
        (record.finishedAt.getTime() - record.displayedAt.getTime())) *
      1000 *
      60
    );
    const accuracy =
      record.automaton.succeededInputs.length /
      (record.missCount + record.automaton.succeededInputs.length);
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
  const totalSucceededKeys = records.reduce(
    (acc, r) => acc + r.record.automaton.succeededInputs.length,
    0
  );
  const totalMissedKeys = records.reduce(
    (acc, r) => acc + r.record.missCount,
    0
  );
  return (
    <div>
      <h1>Finished!</h1>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <table style={{ border: "0" }}>
          <tr>
            <td>inputs</td>
            <td>{totalSucceededKeys}</td>
          </tr>
          <tr>
            <td>miss</td>
            <td>{totalMissedKeys}</td>
          </tr>
          <tr>
            <td>avg latency</td>
            <td>{Math.trunc(totalLatency / records.length)}ms</td>
          </tr>
          <tr>
            <td>accuracy</td>
            <td>
              {(
                (totalSucceededKeys / (totalSucceededKeys + totalMissedKeys)) *
                100
              ).toFixed(2)}
              %
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
