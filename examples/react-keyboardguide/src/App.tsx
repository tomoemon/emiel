import type {
  KeyPlacement,
  KeyboardGuide,
  KeyboardStateReader,
  PhysicalKeyboardLayout,
} from "emiel";
import {
  KeyboardState,
  activate,
  loadPresetKeyboardGuideDirectInput,
  loadPresetKeyboardGuideJisKana,
  loadPresetKeyboardGuideNicola,
  loadPresetKeyboardLayoutDvorak,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetKeyboardLayoutQwertyUs,
  loadPresetPhysicalKeyboardLayoutJis106,
  loadPresetPhysicalKeyboardLayoutUs101,
  loadPresetPhysicalKeyboardLayoutUsHhkb,
  logging,
  placeKeyboardGuide,
} from "emiel";
import { useEffect, useMemo, useState } from "react";

logging.enable("keyboard.*", "automaton.*");

type LayoutName = "qwerty-jis" | "qwerty-us" | "dvorak";
type PhysicalLayoutName = "jis_106" | "us_101" | "us_hhkb";
type GuideName = "direct_input" | "jis_106_jis_kana" | "jis_106_nicola";

const KEY_SIZE = { keyWidth: 50, keyHeight: 50, gapX: 10, gapY: 10 };

function App() {
  const [keyboardState, setKeyboardState] = useState<KeyboardStateReader>(
    () => new KeyboardState([]),
  );
  useEffect(() => {
    return activate(window, (evt) => {
      console.log(evt.input.type === "keydown" ? "down" : "up", evt.input.key);
      setKeyboardState(evt.keyboardState);
    });
  }, []);
  const [physicalLayoutName, setPhysicalLayoutName] = useState<PhysicalLayoutName>("jis_106");
  const [layoutName, setLayoutName] = useState<LayoutName>("qwerty-jis");
  const [guideName, setGuideName] = useState<GuideName>("direct_input");
  const [showVirtualKeyCodes, setShowVirtualKeyCodes] = useState(false);
  return (
    <>
      <h1>Keyboard Guide</h1>
      <div style={{ height: "20px" }}></div>
      <Selector
        title="物理配列"
        options={[
          { value: "jis_106", label: "JIS-106" },
          { value: "us_101", label: "US-101" },
          { value: "us_hhkb", label: "US-HHKB" },
        ]}
        value={physicalLayoutName}
        onChange={setPhysicalLayoutName}
      />
      <Selector
        title="英字配列"
        options={[
          { value: "qwerty-jis", label: "Qwerty-JIS" },
          { value: "qwerty-us", label: "Qwerty-US" },
          { value: "dvorak", label: "Dvorak" },
        ]}
        value={layoutName}
        onChange={setLayoutName}
      />
      <Selector
        title="配列ガイド"
        options={[
          { value: "direct_input", label: "英数字" },
          { value: "jis_106_jis_kana", label: "JISかな" },
          { value: "jis_106_nicola", label: "NICOLA" },
        ]}
        value={guideName}
        onChange={setGuideName}
      />
      <label>
        <input type="checkbox" onClick={(e) => setShowVirtualKeyCodes(e.currentTarget.checked)} />
        仮想キーコードの表示
      </label>
      <div style={{ height: "20px" }}></div>
      <KeyboardGuideComponent
        showVirtualKeyCodes={showVirtualKeyCodes}
        layoutName={layoutName}
        physicalLayoutName={physicalLayoutName}
        guideName={guideName}
        kbdState={keyboardState}
      />
    </>
  );
}

function Selector<T extends string>(props: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <h3>{props.title}</h3>
      {props.options.map((o) => (
        <button
          key={o.value}
          className={props.value === o.value ? "selected" : ""}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function KeyboardGuideComponent(props: {
  layoutName: LayoutName;
  physicalLayoutName: PhysicalLayoutName;
  guideName: GuideName;
  kbdState: KeyboardStateReader;
  showVirtualKeyCodes: boolean;
}) {
  const layout = useMemo(
    () =>
      ({
        "qwerty-jis": loadPresetKeyboardLayoutQwertyJis,
        "qwerty-us": loadPresetKeyboardLayoutQwertyUs,
        dvorak: loadPresetKeyboardLayoutDvorak,
      })[props.layoutName](),
    [props.layoutName],
  );
  const physicalLayout = useMemo<PhysicalKeyboardLayout>(
    () =>
      ({
        jis_106: loadPresetPhysicalKeyboardLayoutJis106,
        us_101: loadPresetPhysicalKeyboardLayoutUs101,
        us_hhkb: loadPresetPhysicalKeyboardLayoutUsHhkb,
      })[props.physicalLayoutName](),
    [props.physicalLayoutName],
  );
  const kbdGuide = useMemo<KeyboardGuide>(() => {
    switch (props.guideName) {
      case "direct_input":
        return loadPresetKeyboardGuideDirectInput();
      case "jis_106_nicola":
        return loadPresetKeyboardGuideNicola();
      case "jis_106_jis_kana":
        return loadPresetKeyboardGuideJisKana();
    }
  }, [props.guideName]);
  const placements = useMemo(
    () => placeKeyboardGuide(kbdGuide, physicalLayout, layout, KEY_SIZE),
    [kbdGuide, physicalLayout, layout],
  );
  return (
    <>
      <div style={{ position: "relative" }}>
        {placements.map((placement, i) =>
          props.showVirtualKeyCodes ? (
            <KeyCode
              placement={placement}
              key={i}
              isKeyDowned={props.kbdState.isKeyDowned(placement.key)}
            />
          ) : (
            <KeyWithLabel
              placement={placement}
              key={i}
              isKeyDowned={props.kbdState.isKeyDowned(placement.key)}
            />
          ),
        )}
      </div>
    </>
  );
}
function KeyCode(props: { placement: KeyPlacement; isKeyDowned: boolean }) {
  const rect = props.placement.rect;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        justifyContent: "center",
        lineHeight: "12pt",
        fontSize: "12pt",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        border: "1px #888 solid",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: props.isKeyDowned ? "#ffd000" : "",
        color: props.isKeyDowned ? "#000" : undefined,
      }}
    >
      <span style={{ textAlign: "center", wordBreak: "break-all" }}>
        {props.placement.key.toString()}
      </span>
    </div>
  );
}

function KeyWithLabel(props: { placement: KeyPlacement; isKeyDowned: boolean }) {
  const { rect } = props.placement;
  const p = props.placement;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        justifyContent: "space-around",
        lineHeight: "12pt",
        fontSize: "12pt",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        border: "1px #888 solid",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: props.isKeyDowned ? "#ffd000" : "",
        color: props.isKeyDowned ? "#000" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          height: `${rect.height / 3}px`,
          position: "relative",
          top: "3px",
        }}
      >
        <div>{p.topLeft ?? ""}</div>
        <div>{p.top ?? ""}</div>
        <div>{p.topRight ?? ""}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          height: `${rect.height / 3}px`,
          position: "relative",
          top: "0px",
        }}
      >
        <div>{p.left ?? ""}</div>
        <div style={{ fontSize: "10pt" }}>{p.center ?? ""}</div>
        <div>{p.right ?? ""}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          height: `${rect.height / 3}px`,
          position: "relative",
          top: "-3px",
        }}
      >
        <div>{p.bottomLeft ?? ""}</div>
        <div>{p.bottom ?? ""}</div>
        <div>{p.bottomRight ?? ""}</div>
      </div>
    </div>
  );
}

export default App;
