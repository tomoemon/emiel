import { Automaton, InputEvent, InputResult } from "emiel";
/**
 * 入力ミスしたキーを蓄積していき、Backspace 等の消去キーを入力して消さないと次の入力ができないオートマトン
 */
export class BackspaceRequirdAutomaton {
	private _failedInputs: InputEvent[] = [];

	constructor(readonly base: Automaton) { }

	get failedInputs(): readonly InputEvent[] {
		return this._failedInputs;
	}

	input(stroke: InputEvent): InputResult {
		const { result, acceptedEdge } = this.base.testInput(stroke);
		if (result.isIgnored) {
			return result;
		}
		if (this._failedInputs.length > 0) {
			// すでにミスしたキーが存在する場合は、それ以降の入力も自動的に失敗扱いにする
			this._failedInputs.push(stroke);
			return InputResult.FAILED;
		}
		if (result.isFailed) {
			this._failedInputs.push(stroke);
		}
		// 状態遷移する
		this.base.applyState(stroke, result, acceptedEdge);
		return result;
	}

	backFailedInput(): void {
		if (this._failedInputs.length > 0) {
			this._failedInputs.pop();
		}
	}

	reset(): void {
		this._failedInputs = [];
		this.base.reset();
	}
}

