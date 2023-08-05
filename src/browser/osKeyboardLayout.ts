import { VirtualKey, VirtualKeys } from "..";
import { KeyboardLayout } from "../core/keyboardLayout";
import {
  findMatchedKeyboardLayout,
  getKeyboardLayout,
} from "../impl/defaultKeyboardLayout";

export async function detectKeyboardLayout(
  window: any
): Promise<KeyboardLayout<VirtualKey>> {
  const layoutMap = await window?.navigator?.keyboard?.getLayoutMap();
  if (!layoutMap) {
    // Chrome, Edge にしか対応していないので、未対応の場合は Qwery JIS として返す
    // https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap
    return getKeyboardLayout("qwerty-jis");
  }
  const layout = findMatchedKeyboardLayout(
    new Map([
      [VirtualKeys.BracketLeft, layoutMap.get("BracketLeft")],
      [VirtualKeys.Z, layoutMap.get("KeyZ")],
    ])
  );
  return layout;
}
