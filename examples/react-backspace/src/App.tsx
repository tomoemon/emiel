import type { Automaton, KeyboardLayout } from "emiel";
import { detectKeyboardLayout, logging } from "emiel";
import { useEffect, useState } from "react";
import "./App.css";
import { MissAccumulatingAutomaton } from "./MissAccumulatingAutomaton";
import { MissApp, type MissAutomaton } from "./MissApp";
import { MissClearingAutomaton } from "./MissClearingAutomaton";
import { MissCountingAutomaton } from "./MissCountingAutomaton";

logging.enable("keyboard.*", "automaton.*");

type TabId = "clearing" | "counting" | "accumulating";

const tabs: {
  id: TabId;
  label: string;
  createWrapper: (automaton: Automaton) => MissAutomaton;
}[] = [
  {
    id: "clearing",
    label: "1回 BS で全クリア",
    createWrapper: (a) => new MissClearingAutomaton(a),
  },
  {
    id: "counting",
    label: "N回ミス → N回 BS",
    createWrapper: (a) => new MissCountingAutomaton(a),
  },
  {
    id: "accumulating",
    label: "BS で入力を戻す",
    createWrapper: (a) => new MissAccumulatingAutomaton(a),
  },
];

function App() {
  const [layout, setLayout] = useState<KeyboardLayout | undefined>();
  const [activeTab, setActiveTab] = useState(tabs[0]);

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
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <MissApp key={activeTab.id} layout={layout} createWrapper={activeTab.createWrapper} />
    </>
  );
}

export default App;
