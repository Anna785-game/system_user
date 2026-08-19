import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="ecran">
      <div className="entete-systeme">
        <span>
          <span className="led blue" />
          Carrière Express
        </span>
        <span>ACCUEIL</span>
      </div>

      <nav
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 18,
          padding: "18px 22px 0",
        }}
      >
        <Link
          to="/postuler"
          className="code-mono"
          style={{
            color: "var(--text-dim)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Postuler
        </Link>
        <Link
          to="/connexion"
          className="code-mono"
          style={{
            color: "var(--text-dim)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Reprendre
        </Link>
      </nav>

      <div
        className="ecran-contenu"
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 28,
        }}
      >
        <div>
          <h1 className="grand-titre">
            Inscrivez-vous
            <br />
            <span style={{ color: "var(--text-dim)" }}>(postulez)</span>
            <br />
            d&apos;abord.
          </h1>
          <p className="sous-texte">Votre carrière commence sur cet écran.</p>
        </div>

        <Link
          to="/postuler"
          className="bouton bouton-primaire"
          style={{ padding: "16px 34px" }}
        >
          Postuler
        </Link>

        <Link
          to="/connexion"
          className="sous-texte"
          style={{ textDecoration: "underline", color: "var(--text-dim)" }}
        >
          Déjà postulé ? Reprendre avec mon identifiant
        </Link>
      </div>
    </div>
  );
}