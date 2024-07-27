import { KeyboardGuideLabel, KeyboardGuide } from "./keyboardGuide";
import { getVirtualKeyFromString, } from "./virtualKey";

type jsonSchema = {
	name: string;
	physicalLayout: string;
	entries: {
		key: string;
		labels: {
			position: string;
			label: string;
		}[];
	}[];
};

export function loadJsonKeyboardGuide(
	jsonGuide: jsonSchema | string
): KeyboardGuide {
	if (jsonGuide instanceof String || typeof jsonGuide === "string") {
		const schema = JSON.parse(jsonGuide as string) as jsonSchema;
		return loadJsonKeyboardGuide(schema);
	}
	const entries = jsonGuide.entries.map((v) => {
		return {
			key: getVirtualKeyFromString(v.key),
			labels: v.labels.map(loadLabel),
		};
	});
	return new KeyboardGuide({
		name: jsonGuide.name,
		physicalLayout: jsonGuide.physicalLayout,
		entries: entries,
	});
}

function loadLabel(jsonLabel: { position: string; label: string }): KeyboardGuideLabel {
	// position が正しいかどうかのチェックする
	const position = jsonLabel.position;
	if (
		position !== "topLeft" &&
		position !== "top" &&
		position !== "topRight" &&
		position !== "left" &&
		position !== "center" &&
		position !== "right" &&
		position !== "bottomLeft" &&
		position !== "bottom" &&
		position !== "bottomRight"
	) {
		throw new Error(`Invalid position: ${position}`);
	}
	if (typeof jsonLabel.label !== "string") {
		throw new Error(`Invalid label: ${jsonLabel.label}`);
	}
	return {
		position: jsonLabel.position as KeyboardGuideLabel["position"],
		label: jsonLabel.label,
	};
}
