import { KeyRect, KeyTop, KeyboardState, guide, keyboard } from 'emiel'
import { useEffect, useState } from 'react';
import * as emiel from 'emiel';

function App() {
  const [keyboardState, setKeyboardState] = useState<emiel.KeyboardStateReader>(new KeyboardState([]));
  useEffect(() => {
    emiel.activate(window, (evt) => {
      console.log("down", evt.input.key);
      setKeyboardState(evt.keyboardState)
    }, (evt) => {
      console.log("up", evt.input.key);
      setKeyboardState(evt.keyboardState)
    }
    );
  }, []);
  const [physicalLayoutName, setPhysicalLayoutName] = useState<emiel.PhysicalKeyboardLayoutName>("jis_106");
  const [layoutName, setLayoutName] = useState("qwerty-jis");
  const [guideName, setGuideName] = useState("us_101_default");
  const [showVirtualKeyCodes, setShowVirtualKeyCodes] = useState(false);
  return <>
    <h1>Keyboard Guide</h1>
    <div style={{ height: "20px" }}></div>
    <PhysicalLayoutSelector onLayoutChange={(layout: emiel.PhysicalKeyboardLayoutName) => setPhysicalLayoutName(layout)} />
    <LayoutSelector onLayoutChange={(layoutName: string) => setLayoutName(layoutName)} />
    <GuideSelector onGuideChange={setGuideName} />
    <label><input type="checkbox" onClick={(e) => setShowVirtualKeyCodes(e.currentTarget.checked)} />仮想キーコードの表示</label>
    <div style={{ height: "20px" }}></div>
    <KeyboardGuideComponent showVirtualKeyCodes={showVirtualKeyCodes} layoutName={layoutName} physicalLayoutName={physicalLayoutName} guideName={guideName} kbdState={keyboardState} />
  </>
}

function PhysicalLayoutSelector(props: {
  onLayoutChange: (physicalLayoutName: emiel.PhysicalKeyboardLayoutName) => void,
}) {
  const [selected, setSelected] = useState(0);
  return <>
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <h3>物理配列</h3>
      <button
        className={selected === 0 ? "selected" : ""}
        onClick={() => (props.onLayoutChange("jis_106"), setSelected(0))}>
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
}

function LayoutSelector(props: {
  onLayoutChange: (layoutName: string) => void,
}) {
  const [selected, setSelected] = useState(0);
  return <>
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <h3>英字配列</h3>
      <button
        className={selected === 0 ? "selected" : ""}
        onClick={() => (props.onLayoutChange("qwerty-jis"), setSelected(0))}>
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
}

function GuideSelector(props: {
  onGuideChange: (guideName: string) => void,
}) {
  const [selected, setSelected] = useState(0);
  return <>
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <h3>配列ガイド</h3>
      <button
        className={selected === 0 ? "selected" : ""}
        onClick={() => (props.onGuideChange("us_101_default"), setSelected(0))}
      >
        US101
      </button>
      <button
        className={selected === 1 ? "selected" : ""}
        onClick={() => (props.onGuideChange("jis_106_default"), setSelected(1))}
      >
        JIS106
      </button>
      <button
        className={selected === 2 ? "selected" : ""}
        onClick={() => (props.onGuideChange("jis_106_jis_kana"), setSelected(2))}
      >
        JIS106 JISかな
      </button>
      <button
        className={selected === 3 ? "selected" : ""}
        onClick={() => (props.onGuideChange("jis_106_nicola"), setSelected(3))}
      >
        JIS106 NICOLA
      </button>
    </div >
  </>
}

function KeyboardGuideComponent(props: {
  layoutName: string,
  physicalLayoutName: string,
  guideName: string,
  kbdState: emiel.KeyboardStateReader,
  showVirtualKeyCodes: boolean,
}) {
  // console.log("guide component", props.layout.name, props.kbdGuide.guideData.name);
  const layout = keyboard.get(props.layoutName);
  const kbdGuide = guide.get(props.guideName).swapPhysicalLayout(props.physicalLayoutName as emiel.PhysicalKeyboardLayoutName);
  return (
    <>
      <div style={{ position: "relative" }}>
        {
          kbdGuide.keyTops(layout, {
            keyWidth: 50, keyHeight: 50, gapX: 10, gapY: 10
          }).map((keyTop, i) => {
            return props.showVirtualKeyCodes ?
              <KeyCode
                keyRect={keyTop.keyRect}
                key={i}
                isKeyDowned={props.kbdState.isKeyDowned(keyTop.keyRect.key)}
              ></KeyCode>
              : <KeyWithLabel
                keyRect={keyTop.keyRect}
                key={i}
                keyTop={keyTop}
                isKeyDowned={props.kbdState.isKeyDowned(keyTop.keyRect.key)} />
          })
        }
      </div>
    </>
  )
}
function KeyCode(props: { keyRect: KeyRect, isKeyDowned: boolean }) {
  const rect = props.keyRect.rect;
  return <div style={{
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    justifyContent: "center",
    lineHeight: "12pt",
    fontSize: "12pt",
    left: `${rect.leftTop.x}px`,
    top: `${rect.leftTop.y}px`,
    border: "1px yellow solid",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    backgroundColor: props.isKeyDowned ? "yellow" : "",
  }}>
    <span style={{ textAlign: "center", wordBreak: "break-all" }}>{props.keyRect.key.toString()}</span>
  </div>
}

function KeyWithLabel(props: {
  keyRect: KeyRect,
  keyTop: KeyTop,
  isKeyDowned: boolean,
}) {
  const rect = props.keyRect.rect;
  const keyTop = props.keyTop;
  return <div style={{
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    justifyContent: "space-around",
    lineHeight: "12pt",
    fontSize: "12pt",
    left: `${rect.leftTop.x}px`,
    top: `${rect.leftTop.y}px`,
    border: "1px yellow solid",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    backgroundColor: props.isKeyDowned ? "yellow" : "",
  }}>
    <div style={{
      display: "flex",
      justifyContent: "space-around",
      height: `${rect.height / 3}px`,
      position: "relative",
      top: "3px",
    }}>
      <div>{keyTop.topLeft ?? ""}</div>
      <div>{keyTop.top ?? ""}</div>
      <div>{keyTop.topRight ?? ""}</div>
    </div>
    <div style={{
      display: "flex",
      justifyContent: "space-around",
      height: `${rect.height / 3}px`,
      position: "relative",
      top: "0px",
    }}>
      <div>{keyTop.left ?? ""}</div>
      <div style={{ fontSize: "10pt" }}>{keyTop.center ?? ""}</div>
      <div>{keyTop.right ?? ""}</div>
    </div>
    <div style={{
      display: "flex",
      justifyContent: "space-around",
      height: `${rect.height / 3}px`,
      position: "relative",
      top: "-3px",
    }}>
      <div>{keyTop.bottomLeft ?? ""}</div>
      <div>{keyTop.bottom ?? ""}</div>
      <div>{keyTop.bottomRight ?? ""}</div>
    </div>
  </div >
}

export default App
