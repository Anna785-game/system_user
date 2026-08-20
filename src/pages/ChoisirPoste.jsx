import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { posteParId } from "../constants/postes";

// phase : "chargement" | "choix" | "envoi"
export default function ChoisirPoste() {
  const navigate = useNavigate();
  const candidatId = localStorage.getItem("candidatId");

  const [phase, setPhase] = useState("chargement");
  const [postes, setPostes] = useState([]);
  const [posteChoisiId, setPosteChoisiId] = useState(null);
  const [erreurChargement, setErreurChargement] = useState(null);
  const [erreurEnvoi, setErreurEnvoi] = useState(null);

  useEffect(() => {
    if (!candidatId) {
      navigate("/");
      return;
    }
    let annule = false;
    (async () => {
      try {
        const c = await api.recupererCandidat(candidatId);
        if (annule) return;
        if (c.statut !== "actif") {
          navigate("/parcours");
          return;
        }
        if (c.poste_attribue) {
          // Poste déjà choisi (double-tap, retour arrière...) : rien à
          // refaire ici.
          navigate("/parcours");
          return;
        }
        if (!c.visage_enrole) {
          // Le visage doit être enrôlé avant de pouvoir choisir un poste.
          navigate("/enrolement");
          return;
        }

        const liste = await api.listePostesDisponibles();
        if (annule) return;
        setPostes(liste);
        setPhase("choix");
      } catch (e) {
        if (!annule) setErreurChargement(e);
      }
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatId]);

  async function choisir(poste) {
    if (phase === "envoi") return;
    setPosteChoisiId(poste.id);
    setPhase("envoi");
    setErreurEnvoi(null);
    try {
      await api.choisirPoste(candidatId, poste.id);
      navigate("/parcours");
    } catch (e) {
      setErreurEnvoi(e);
      setPhase("choix");
      setPosteChoisiId(null);
    }
  }

  if (!candidatId) return null;

  if (erreurChargement) {
    return (
      <PageCadre titre="VOTRE POSTE">
        <p className="sous-texte" style={{ color: "var(--red)" }}>
          {erreurChargement.status === 404
            ? "Dossier introuvable. Réinscrivez-vous."
            : erreurChargement.message}
        </p>
        <Link to="/parcours" className="bouton bouton-primaire">
          Retour à mon parcours
        </Link>
      </PageCadre>
    );
  }

  if (phase === "chargement") {
    return (
      <PageCadre titre="VOTRE POSTE">
        <p className="sous-texte">Chargement...</p>
      </PageCadre>
    );
  }

  return (
    <PageCadre titre="VOTRE POSTE">
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <h1 className="grand-titre" style={{ fontSize: "1.5rem", marginBottom: 8 }}>
          Quel est votre poste ?
        </h1>
        <p className="sous-texte" style={{ margin: 0 }}>
          Visage enrôlé ! Choisissez le poste que vous souhaitez occuper.
        </p>
      </div>

      {erreurEnvoi && (
        <p className="sous-texte" style={{ color: "var(--red)", textAlign: "center" }}>
          {erreurEnvoi.status === 409
            ? erreurEnvoi.message
            : "Le choix n'a pas pu être enregistré, réessayez."}
        </p>
      )}

      {postes.length === 0 && (
        <p className="sous-texte" style={{ textAlign: "center" }}>
          Aucun poste n&apos;est disponible pour le moment. Patientez, un
          responsable va bientôt en ajouter.
        </p>
      )}

      {postes.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            maxHeight: "52vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "4px 2px",
          }}
        >
          {postes.map((p) => {
            const info = posteParId(p.type_poste);
            const enCours = phase === "envoi" && posteChoisiId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className="bouton bouton-primaire"
                onClick={() => choisir(p)}
                disabled={phase === "envoi"}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: phase === "envoi" && !enCours ? 0.5 : 1,
                }}
              >
                <span>{info.label}</span>
                {enCours && <span className="sous-texte" style={{ margin: 0 }}>...</span>}
              </button>
            );
          })}
        </div>
      )}
    </PageCadre>
  );
}

function PageCadre({ titre, children }) {
  return (
    <div className="ecran">
      <div className="entete-systeme">
        <Link to="/parcours" style={{ color: "inherit", textDecoration: "none" }}>
          &larr; Retour
        </Link>
        <span>{titre}</span>
      </div>
      <div
        className="ecran-contenu"
        style={{ justifyContent: "center", alignItems: "center", gap: 20, paddingTop: 24 }}
      >
        {children}
      </div>
    </div>
  );
}
