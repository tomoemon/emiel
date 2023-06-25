import "./App.css";
import * as emiel from "../../../src/index";

function App() {
  emiel.listen(window as any, function (e) {
    console.log(e);
  });
  return (
    <>
      <h1>Vite + React</h1>
      <div className="card"></div>
    </>
  );
}

export default App;
