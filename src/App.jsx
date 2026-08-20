import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Postuler from "./pages/Postuler";
import Connexion from "./pages/Connexion";
import Parcours from "./pages/Parcours";
import Enrolement from "./pages/Enrolement";
import ChoisirPoste from "./pages/ChoisirPoste";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/postuler" element={<Postuler />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/parcours" element={<Parcours />} />
        <Route path="/enrolement" element={<Enrolement />} />
        <Route path="/choisir-poste" element={<ChoisirPoste />} />
      </Routes>
    </BrowserRouter>
  );
}
