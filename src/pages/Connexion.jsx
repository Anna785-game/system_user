import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";

export default function Connexion() {
  const [candidatId, setCandidatId] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const id = candidatId.trim();
      const candidat = await api.recupererCandidat(id);
      localStorage.setItem("candidatId", String(candidat.id));
      navigate("/parcours");
    } catch (e) {
      setErreur(
        e.status === 404
          ? "Aucun dossier avec cet identifiant."
          : e.message
      );
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
        <span>CONNEXION</span>
      </div>

      <div className="ecran-contenu" style={{ justifyContent: "center" }}>
        <h1 className="grand-titre" style={{ marginBottom: 6 }}>
          Reprendre
        </h1>
        <p className="sous-texte" style={{ marginBottom: 28 }}>
          Saisissez l&apos;identifiant reçu à l&apos;inscription (affiché sur
          votre parcours, ex. #000042).
        </p>

        <form onSubmit={envoyer}>
          <div className="groupe-champ">
            <label htmlFor="candidatId">Identifiant candidat</label>
            <input
              id="candidatId"
              className="champ"
              placeholder="Ex. 42"
              value={candidatId}
              onChange={(e) => setCandidatId(e.target.value)}
              required
              inputMode="numeric"
            />
          </div>

          {erreur && <p className="erreur-form">{erreur}</p>}

          <button
            className="bouton bouton-primaire bouton-bloc"
            disabled={enCours}
          >
            {enCours ? "Connexion..." : "Voir mon parcours"}
          </button>
        </form>
      </div>
    </div>
  );
}