import { KeyboardLayout } from "../core/keyboardLayout";
import { VirtualKey, VirtualKeys } from "../core/virtualKey";

export type PhysicalKeyboardLayoutName = "jis_106" | "us_101" | "us_hhkb";

type PhysicalKeyboardLayout = {
	name: PhysicalKeyboardLayoutName;
	keys: VirtualKey[][];
	leftMargins: number[];
	keyWidth: { [key: string]: number };
};

const physicalKeyboardLayouts: PhysicalKeyboardLayout[] = [
	/**
	106/109 キーボードのキー配置を表すクラス
	
	1 2 3 4 5 6 7 8 9 0 - ^ \
	 Q W E R T Y U I O P @ [ 
		A S D F G H J K L ; : ]
	SFT Z X C V B N M , . / \ SFT
				無 SPACE 変
	 */
	{
		name: "jis_106",
		keys: [
			[
				VirtualKeys.Digit1,
				VirtualKeys.Digit2,
				VirtualKeys.Digit3,
				VirtualKeys.Digit4,
				VirtualKeys.Digit5,
				VirtualKeys.Digit6,
				VirtualKeys.Digit7,
				VirtualKeys.Digit8,
				VirtualKeys.Digit9,
				VirtualKeys.Digit0,
				VirtualKeys.Minus,
				VirtualKeys.Equal,
				VirtualKeys.JpnYen,
			],
			[
				VirtualKeys.Q,
				VirtualKeys.W,
				VirtualKeys.E,
				VirtualKeys.R,
				VirtualKeys.T,
				VirtualKeys.Y,
				VirtualKeys.U,
				VirtualKeys.I,
				VirtualKeys.O,
				VirtualKeys.P,
				VirtualKeys.BracketLeft,
				VirtualKeys.BracketRight,
			],
			[
				VirtualKeys.A,
				VirtualKeys.S,
				VirtualKeys.D,
				VirtualKeys.F,
				VirtualKeys.G,
				VirtualKeys.H,
				VirtualKeys.J,
				VirtualKeys.K,
				VirtualKeys.L,
				VirtualKeys.Semicolon,
				VirtualKeys.Quote,
				VirtualKeys.Backslash,
			],
			[
				VirtualKeys.ShiftLeft,
				VirtualKeys.Z,
				VirtualKeys.X,
				VirtualKeys.C,
				VirtualKeys.V,
				VirtualKeys.B,
				VirtualKeys.N,
				VirtualKeys.M,
				VirtualKeys.Comma,
				VirtualKeys.Period,
				VirtualKeys.Slash,
				VirtualKeys.JpnRo,
				VirtualKeys.ShiftRight,
			],
			[
				VirtualKeys.LangLeft,
				VirtualKeys.Space,
				VirtualKeys.LangRight,
			]
		],
		// 段ごとの左端からのマージン（単位は keyWidthUnit）
		leftMargins: [
			0.5, // 数字の段
			1.0, // Qの段
			1.5, // Aの段
			0,   // Zの段
			3.5, // Spaceの段
		],
		// 特殊なキー幅のキー（単位は keyWidthUnit）
		keyWidth: Object.fromEntries<number>([
			[VirtualKeys.ShiftLeft.toString(), 2.0],
			[VirtualKeys.ShiftRight.toString(), 2.0],
			[VirtualKeys.LangLeft.toString(), 1.5],
			[VirtualKeys.LangRight.toString(), 1.5],
			[VirtualKeys.Space.toString(), 4.0],
		])
	},
	/**
	101 キーボードのキー配置を表すクラス
	
` 1 2 3 4 5 6 7 8 9 0 - =
	 Q W E R T Y U I O P [ ] \
		A S D F G H J K L ; '
 SFT Z X C V B N M , . / SFT
					 SPACE
	 */
	{
		name: "us_101",
		keys: [
			[
				VirtualKeys.Backquote,
				VirtualKeys.Digit1,
				VirtualKeys.Digit2,
				VirtualKeys.Digit3,
				VirtualKeys.Digit4,
				VirtualKeys.Digit5,
				VirtualKeys.Digit6,
				VirtualKeys.Digit7,
				VirtualKeys.Digit8,
				VirtualKeys.Digit9,
				VirtualKeys.Digit0,
				VirtualKeys.Minus,
				VirtualKeys.Equal,
			],
			[
				VirtualKeys.Q,
				VirtualKeys.W,
				VirtualKeys.E,
				VirtualKeys.R,
				VirtualKeys.T,
				VirtualKeys.Y,
				VirtualKeys.U,
				VirtualKeys.I,
				VirtualKeys.O,
				VirtualKeys.P,
				VirtualKeys.BracketLeft,
				VirtualKeys.BracketRight,
				VirtualKeys.Backslash,
			],
			[
				VirtualKeys.A,
				VirtualKeys.S,
				VirtualKeys.D,
				VirtualKeys.F,
				VirtualKeys.G,
				VirtualKeys.H,
				VirtualKeys.J,
				VirtualKeys.K,
				VirtualKeys.L,
				VirtualKeys.Semicolon,
				VirtualKeys.Quote,
			],
			[
				VirtualKeys.ShiftLeft,
				VirtualKeys.Z,
				VirtualKeys.X,
				VirtualKeys.C,
				VirtualKeys.V,
				VirtualKeys.B,
				VirtualKeys.N,
				VirtualKeys.M,
				VirtualKeys.Comma,
				VirtualKeys.Period,
				VirtualKeys.Slash,
				VirtualKeys.ShiftRight,
			],
			[
				VirtualKeys.Space,
			]
		],
		// 段ごとの左端からのマージン（単位は keyWidthUnit）
		leftMargins: [
			0, // 数字の段
			1.5, // Qの段
			2.0, // Aの段
			0,   // Zの段
			5.0, // Spaceの段
		],
		// 特殊なキー幅のキー（単位は keyWidthUnit）
		keyWidth: Object.fromEntries<number>([
			[VirtualKeys.ShiftLeft.toString(), 2.5],
			[VirtualKeys.ShiftRight.toString(), 2.5],
			[VirtualKeys.Backslash.toString(), 1.5],
			[VirtualKeys.Space.toString(), 6.0],
		])
	},
	/**
	HHKB 101 キーボードのキー配置を表すクラス
	
1 2 3 4 5 6 7 8 9 0 - = \ `
	Q W E R T Y U I O P [ ]
	 A S D F G H J K L ; '
SFT Z X C V B N M , . / SFT
					SPACE
	 */
	{
		name: "us_hhkb",
		keys: [
			[
				VirtualKeys.Digit1,
				VirtualKeys.Digit2,
				VirtualKeys.Digit3,
				VirtualKeys.Digit4,
				VirtualKeys.Digit5,
				VirtualKeys.Digit6,
				VirtualKeys.Digit7,
				VirtualKeys.Digit8,
				VirtualKeys.Digit9,
				VirtualKeys.Digit0,
				VirtualKeys.Minus,
				VirtualKeys.Equal,
				VirtualKeys.Backslash,
				VirtualKeys.Backquote,
			],
			[
				VirtualKeys.Q,
				VirtualKeys.W,
				VirtualKeys.E,
				VirtualKeys.R,
				VirtualKeys.T,
				VirtualKeys.Y,
				VirtualKeys.U,
				VirtualKeys.I,
				VirtualKeys.O,
				VirtualKeys.P,
				VirtualKeys.BracketLeft,
				VirtualKeys.BracketRight,
			],
			[
				VirtualKeys.A,
				VirtualKeys.S,
				VirtualKeys.D,
				VirtualKeys.F,
				VirtualKeys.G,
				VirtualKeys.H,
				VirtualKeys.J,
				VirtualKeys.K,
				VirtualKeys.L,
				VirtualKeys.Semicolon,
				VirtualKeys.Quote,
			],
			[
				VirtualKeys.ShiftLeft,
				VirtualKeys.Z,
				VirtualKeys.X,
				VirtualKeys.C,
				VirtualKeys.V,
				VirtualKeys.B,
				VirtualKeys.N,
				VirtualKeys.M,
				VirtualKeys.Comma,
				VirtualKeys.Period,
				VirtualKeys.Slash,
				VirtualKeys.ShiftRight,
			],
			[
				VirtualKeys.Space,
			]
		],
		// 段ごとの左端からのマージン（単位は keyWidthUnit）
		leftMargins: [
			0.5, // 数字の段
			1.0, // Qの段
			1.5, // Aの段
			0,   // Zの段
			4.5, // Spaceの段
		],
		// 特殊なキー幅のキー（単位は keyWidthUnit）
		keyWidth: Object.fromEntries<number>([
			[VirtualKeys.ShiftLeft.toString(), 2.0],
			[VirtualKeys.ShiftRight.toString(), 2.0],
			[VirtualKeys.Space.toString(), 6.0],
		])
	}
]

type Coord2d = {
	x: number,
	y: number,
}

class Rect {
	constructor(readonly leftTop: Coord2d, readonly rightBottom: Coord2d) { }
	get width(): number {
		return this.rightBottom.x - this.leftTop.x;
	}
	get height(): number {
		return this.rightBottom.y - this.leftTop.y;
	}
	get center(): Coord2d {
		return {
			x: (this.leftTop.x + this.rightBottom.x) / 2,
			y: (this.leftTop.y + this.rightBottom.y) / 2,
		}
	}
}

export type KeyRect = {
	key: VirtualKey,
	rect: Rect,
};

export type KeyTop = {
	keyRect: KeyRect,
	topLeft?: string,
	top?: string,
	topRight?: string,
	left?: string,
	center?: string,
	right?: string,
	bottomLeft?: string,
	bottom?: string,
	bottomRight?: string,
}

export type KeyboardGuideLabelMapping = {
	name: string;
	physicalLayout: string;
	entries: {
		key: VirtualKey;
		labels: KeyboardGuideLabel[];
	}[];
}

export type KeyboardGuideLabel = {
	position: "topLeft" | "top" | "topRight" | "left" | "center" | "right" | "bottomLeft" | "bottom" | "bottomRight";
	label: string;
}

export class KeyboardGuide {
	readonly physicalLayout: PhysicalKeyboardLayout;
	constructor(
		readonly guideData: KeyboardGuideLabelMapping,
	) {
		const physicalLayout = physicalKeyboardLayouts.filter((v) => v.name === guideData.physicalLayout);
		if (physicalLayout.length === 0) {
			throw new Error(`Unknown physical layout: ${guideData.physicalLayout}`);
		}
		this.physicalLayout = physicalLayout[0];
	}

	swapPhysicalLayout(name: PhysicalKeyboardLayoutName): KeyboardGuide {
		return new KeyboardGuide({ ...this.guideData, physicalLayout: name });
	}

	keyTops(
		layout: KeyboardLayout,
		size: {
			keyWidth: number,
			keyHeight: number,
			gapX: number,
			gapY: number
		}
	): KeyTop[] {
		const positions = arrangeKeyPositions(this.physicalLayout, size.keyWidth, size.keyHeight, size.gapX, size.gapY);
		const mapKeyToLabels = new Map<VirtualKey, KeyboardGuideLabel[]>(
			this.guideData.entries.map((entry) => [entry.key, entry.labels])
		);
		return positions.map((pos) => {
			const keyTop: KeyTop = {
				keyRect: pos,
			};
			const labels = mapKeyToLabels.get(pos.key);
			if (!labels) {
				// ラベル定義がない場合はラベルなしのキートップを返す
				return keyTop;
			}
			labels.forEach((label) => {
				let labelValue: string = "";
				if (label.label.startsWith("{")) {
					// layout.alpha_or_sign:
					//   該当キーのshift=falseにアルファベットが割り当てられている場合は大文字を返す
					//   該当キーのshift=falseにアルファベット以外の文字が割り当てられている場合はその文字を返す
					// layout.shifted_alpha_or_sign:
					//   該当キーのshift=trueにアルファベットが割り当てられている場合は大文字を返す
					//   該当キーのshift=trueにアルファベット以外の文字が割り当てられている場合はその文字を返す
					// layout.sign:
					//   該当キーのshift=falseにアルファベットが割り当てられている場合は何も返さない
					//   該当キーのshift=falseにアルファベット以外の文字が割り当てられている場合はその文字を返す
					// layout.shifted_sign:
					//   該当キーのshift=trueにアルファベットが割り当てられている場合は何も返さない
					//   該当キーのshift=trueに記号が割り当てられている場合はその記号を返す
					// layout.shift.true:
					//   該当キーのshift=trueに割り当てられている文字を返す
					// layout.shift.false:
					//   該当キーのshift=falseに割り当てられている文字を返す
					if (label.label === "{layout.shift.true}") {
						try {
							// 論理レイアウトによっては、物理キーで指定されたキー定義が存在しない場合があるので空にする
							// 例：QwertyJIS配列でUS101キーのキーガイドを表示しようとした場合、
							// QwertyJIS配列で未定義の Backquote キーのガイドを表示しようとしてエラーが throw される
							labelValue = layout.getCharByKey(pos.key, true);
						} catch { }
					} else if (label.label === "{layout.shift.false}") {
						try {
							labelValue = layout.getCharByKey(pos.key, false);
						} catch { }
					} else if (label.label === "{layout.alpha_or_sign}") {
						try {
							const c = layout.getCharByKey(pos.key, false);
							if ("a" <= c && c <= "z" || "A" <= c && c <= "Z") {
								labelValue = c.toUpperCase();
							} else {
								labelValue = c;
							}
						} catch { }
					} else if (label.label === "{layout.shifted_alpha_or_sign}") {
						try {
							const c = layout.getCharByKey(pos.key, true);
							if ("a" <= c && c <= "z" || "A" <= c && c <= "Z") {
								labelValue = c.toUpperCase();
							} else {
								labelValue = c;
							}
						} catch { }
					} else if (label.label === "{layout.sign}") {
						try {
							const c = layout.getCharByKey(pos.key, false);
							if ("a" <= c && c <= "z" || "A" <= c && c <= "Z") {
								labelValue = "";
							} else {
								labelValue = c;
							}
						} catch { }
					} else if (label.label === "{layout.shifted_sign}") {
						try {
							const c = layout.getCharByKey(pos.key, true);
							if ("a" <= c && c <= "z" || "A" <= c && c <= "Z") {
								labelValue = "";
							} else {
								labelValue = c;
							}
						} catch { }
					} else {
						throw new Error(`Unknown label: ${label.label}`);
					}
				} else {
					labelValue = label.label;
				}
				keyTop[label.position] = labelValue;
			});
			return keyTop;
		});
	}
}

function arrangeKeyPositions(
	physicalLayout: PhysicalKeyboardLayout,
	keyWidthUnit: number,
	keyHeightUnit: number,
	keyGapX: number,
	keyGapY: number
): KeyRect[] {
	const { keys, leftMargins, keyWidth } = physicalLayout;
	const keyPositions: KeyRect[] = [];
	keys.forEach((row, i) => {
		let leftMargin = leftMargins[i] * keyWidthUnit;
		row.forEach((key) => {
			const x = leftMargin;
			const width = keyWidth[key.toString()] ? keyWidthUnit * keyWidth[key.toString()] : keyWidthUnit;
			leftMargin += width + keyGapX;
			const y = i * (keyHeightUnit + keyGapY);
			keyPositions.push({
				key,
				rect: new Rect(
					{ x: x, y: y },
					{ x: x + width, y: y + keyHeightUnit }
				),
			});
		});
	});
	return keyPositions;
}

