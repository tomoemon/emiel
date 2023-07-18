export enum OSKeyboardLayout {
  Unknown = "Unknown",
  JIS = "JIS",
  US = "US",
}

export async function detectKeyboardLayout(
  window: any
): Promise<OSKeyboardLayout> {
  const keyboard = window.navigator.keyboard;
  const layoutMap = await keyboard.getLayoutMap();
  const bracketLeftKey = layoutMap.get("BracketLeft");
  if (bracketLeftKey === "@") {
    return OSKeyboardLayout.JIS;
  } else if (bracketLeftKey === "[") {
    return OSKeyboardLayout.US;
  } else {
    return OSKeyboardLayout.Unknown;
  }
}
