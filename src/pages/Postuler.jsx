import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";

export default function Postuler() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const candidat = await api.postuler(nom.trim(), email.trim());
      localStorage.setItem("candidatId", candidat.id);
      navigate("/parcours");
    } catch (e) {
      if (e.status === 409 && e.data?.candidat) {
        // Email déjà connu : on connecte directement plutôt que de bloquer.
        localStorage.setItem("candidatId", e.data.candidat.id);
        navigate("/parcours");
      } else {
        setErreur(e.message);
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="ecran">
      <div className="entete-systeme">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>&larr; Retour</Link>
        <span>CANDIDATURE</span>
      </div>

      <div className="ecran-contenu" style={{ justifyContent: "center" }}>
        <h1 className="grand-titre" style={{ marginBottom: 6 }}>Postuler</h1>
        <p className="sous-texte" style={{ marginBottom: 28 }}>
          Deux infos suffisent, le reste se joue à l'entretien.
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
            />
          </div>

          <div className="groupe-champ">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="champ"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {erreur && <p className="erreur-form">{erreur}</p>}

          <button className="bouton bouton-primaire bouton-bloc" disabled={enCours}>
            {enCours ? "Envoi..." : "Envoyer ma candidature"}
          </button>
        </form>
      </div>
    </div>
  );
}
