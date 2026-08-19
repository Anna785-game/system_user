import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const navigate = useNavigate();

  async function envoyer(e) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const candidat = await api.connexion(email.trim());
      localStorage.setItem("candidatId", candidat.id);
      navigate("/parcours");
    } catch (e) {
      setErreur(e.status === 404 ? "Aucune candidature avec cet email." : e.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="ecran">
      <div className="entete-systeme">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>&larr; Retour</Link>
        <span>CONNEXION</span>
      </div>

      <div className="ecran-contenu" style={{ justifyContent: "center" }}>
        <h1 className="grand-titre" style={{ marginBottom: 6 }}>Connexion</h1>
        <p className="sous-texte" style={{ marginBottom: 28 }}>
          Retrouvez l'avancement de votre candidature.
        </p>

        <form onSubmit={envoyer}>
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
            {enCours ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
