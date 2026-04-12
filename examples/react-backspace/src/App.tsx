import type { KeyboardLayout } from "emiel";
import { detectKeyboardLayout } from "emiel";
import { useEffect, useState } from "react";
import "./App.css";
import { MissAccumulatingApp } from "./MissAccumulatingApp";
import { MissClearingApp } from "./MissClearingApp";
import { MissCountingApp } from "./MissCountingApp";

type TabId = "clearing" | "counting" | "accumulating";

const tabs: { id: TabId; label: string }[] = [
  { id: "clearing", label: "1回 BS で全クリア" },
  { id: "counting", label: "N回ミス → N回 BS" },
  { id: "accumulating", label: "BS で入力を戻す" },
];

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  const [activeTab, setActiveTab] = useState<TabId>("clearing");

  useEffect(() => {
    detectKeyboardLayout(window).then(setLayout).catch(console.error);
  }, []);

  if (!layout) return <></>;

  return (
    <>
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "clearing" && <MissClearingApp key="clearing" layout={layout} />}
      {activeTab === "counting" && <MissCountingApp key="counting" layout={layout} />}
      {activeTab === "accumulating" && <MissAccumulatingApp key="accumulating" layout={layout} />}
    </>
  );
}

export default App;
