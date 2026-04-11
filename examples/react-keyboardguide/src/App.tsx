import type {
  KeyPlacement,
  KeyboardGuide,
  KeyboardStateReader,
  PhysicalKeyboardLayout,
} from "emiel";
import {
  KeyboardState,
  activate,
  loadPresetKeyboardGuideAlphanumeric,
  loadPresetKeyboardLayoutDvorak,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetKeyboardLayoutQwertyUs,
  loadPresetPhysicalKeyboardLayoutJis106,
  loadPresetPhysicalKeyboardLayoutUs101,
  loadPresetPhysicalKeyboardLayoutUsHhkb,
  loadPresetRuleJisKana,
  loadPresetRuleNicola,
  placeKeyboardGuide,
} from "emiel";
import { useEffect, useMemo, useState } from "react";

type LayoutName = "qwerty-jis" | "qwerty-us" | "dvorak";
type PhysicalLayoutName = "jis_106" | "us_101" | "us_hhkb";
type GuideName = "alphanumeric" | "jis_106_jis_kana" | "jis_106_nicola";

const KEY_SIZE = { keyWidth: 50, keyHeight: 50, gapX: 10, gapY: 10 };

function App() {
  const [keyboardState, setKeyboardState] = useState<KeyboardStateReader>(new KeyboardState([]));
  useEffect(() => {
    activate(window, (evt) => {
      if (evt.input.type === "keydown") {
        console.log("down", evt.input.key);
        setKeyboardState(evt.keyboardState);
      } else {
        console.log("up", evt.input.key);
        setKeyboardState(evt.keyboardState);
      }
    });
  }, []);
  const [physicalLayoutName, setPhysicalLayoutName] = useState<PhysicalLayoutName>("jis_106");
  const [layoutName, setLayoutName] = useState<LayoutName>("qwerty-jis");
  const [guideName, setGuideName] = useState<GuideName>("alphanumeric");
  const [showVirtualKeyCodes, setShowVirtualKeyCodes] = useState(false);
  return (
    <>
      <h1>Keyboard Guide</h1>
      <div style={{ height: "20px" }}></div>
      <PhysicalLayoutSelector onLayoutChange={setPhysicalLayoutName} />
      <LayoutSelector onLayoutChange={(layoutName: LayoutName) => setLayoutName(layoutName)} />
      <GuideSelector onGuideChange={setGuideName} />
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

function PhysicalLayoutSelector(props: {
  onLayoutChange: (physicalLayoutName: PhysicalLayoutName) => void;
}) {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <h3>物理配列</h3>
        <button
          className={selected === 0 ? "selected" : ""}
          onClick={() => (props.onLayoutChange("jis_106"), setSelected(0))}
        >
          JIS-106
        </button>
        <button
          className={selected === 1 ? "selected" : ""}
          onClick={() => (props.onLayoutChange("us_101"), setSelected(1))}
        >
          US-101
        </button>
        <button
          className={selected === 2 ? "selected" : ""}
          onClick={() => (props.onLayoutChange("us_hhkb"), setSelected(2))}
        >
          US-HHKB
        </button>
      </div>
    </>
  );
}

function LayoutSelector(props: { onLayoutChange: (layoutName: LayoutName) => void }) {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <h3>英字配列</h3>
        <button
          className={selected === 0 ? "selected" : ""}
          onClick={() => (props.onLayoutChange("qwerty-jis"), setSelected(0))}
        >
          Qwerty-JIS
        </button>
        <button
          className={selected === 1 ? "selected" : ""}
          onClick={() => (props.onLayoutChange("qwerty-us"), setSelected(1))}
        >
          Qwerty-US
        </button>
        <button
          className={selected === 2 ? "selected" : ""}
          onClick={() => (props.onLayoutChange("dvorak"), setSelected(2))}
        >
          Dvorak
        </button>
      </div>
    </>
  );
}

function GuideSelector(props: { onGuideChange: (guideName: GuideName) => void }) {
  const [selected, setSelected] = useState(0);
  return (
    <>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <h3>配列ガイド</h3>
        <button
          className={selected === 0 ? "selected" : ""}
          onClick={() => (props.onGuideChange("alphanumeric"), setSelected(0))}
        >
          英数字
        </button>
        <button
          className={selected === 1 ? "selected" : ""}
          onClick={() => (props.onGuideChange("jis_106_jis_kana"), setSelected(1))}
        >
          JISかな
        </button>
        <button
          className={selected === 2 ? "selected" : ""}
          onClick={() => (props.onGuideChange("jis_106_nicola"), setSelected(2))}
        >
          NICOLA
        </button>
      </div>
    </>
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
    if (props.guideName === "alphanumeric") {
      return loadPresetKeyboardGuideAlphanumeric();
    }
    const rule =
      props.guideName === "jis_106_nicola"
        ? loadPresetRuleNicola(layout)
        : loadPresetRuleJisKana(layout);
    if (!rule.guide) {
      throw new Error(`Rule ${props.guideName} has no guide`);
    }
    return rule.guide;
  }, [props.guideName, layout]);
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
        border: "1px yellow solid",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: props.isKeyDowned ? "yellow" : "",
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
        border: "1px yellow solid",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: props.isKeyDowned ? "yellow" : "",
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
