import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";

export default function Postuler() {
  const [nom, setNom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const candidat = await api.postuler(nom.trim());
      localStorage.setItem("candidatId", String(candidat.id));
      navigate("/parcours");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="ecran">
      <div className="entete-systeme">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
          &larr; Retour
        </Link>
        <span>CANDIDATURE</span>
      </div>

      <div className="ecran-contenu" style={{ justifyContent: "center" }}>
        <h1 className="grand-titre" style={{ marginBottom: 6 }}>
          Postuler
        </h1>
        <p className="sous-texte" style={{ marginBottom: 28 }}>
          Votre nom suffit. Le reste se joue à l&apos;entretien.
        </p>

        <form onSubmit={envoyer}>
          <div className="groupe-champ">
            <label htmlFor="nom">Nom complet</label>
            <input
              id="nom"
              className="champ"
              placeholder="Ex. Rina Andria"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          {erreur && <p className="erreur-form">{erreur}</p>}

          <button
            className="bouton bouton-primaire bouton-bloc"
            disabled={enCours}
          >
            {enCours ? "Envoi..." : "Envoyer ma candidature"}
          </button>
        </form>
      </div>
    </div>
  );
}