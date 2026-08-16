import { Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { BuildHash } from "./components/BuildHash";
import Home from "./pages/Home";
import Mode1Spell from "./pages/Mode1Spell";
import Mode2LetterQuiz from "./pages/Mode2LetterQuiz";
import Mode3Type from "./pages/Mode3Type";
import Mode4Match from "./pages/Mode4Match";

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mode1" element={<Mode1Spell />} />
        <Route path="/mode2" element={<Mode2LetterQuiz />} />
        <Route path="/mode3" element={<Mode3Type />} />
        <Route path="/mode4" element={<Mode4Match />} />
      </Routes>
      <BuildHash />
    </DataProvider>
  );
}
