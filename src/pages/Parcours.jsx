import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { usePolling } from "../hooks/usePolling";
import { posteParId } from "../constants/postes";

// Doit être >= SPIN_DURATION_MS (6800ms) côté sys_admin, + petite marge
// pour laisser le temps au poll (2.5s) de rattraper l'event.
const DELAI_REVELATION_MS = 8000;

const LEDS_PAR_STATUT = { attente: "amber", actif: "green", historique: "red" };
const LIBELLES_STATUT = { attente: "En attente", actif: "Sélectionné", historique: "Parcours terminé" };

export default function Parcours() {
  const navigate = useNavigate();
  const candidatId = localStorage.getItem("candidatId");

  useEffect(() => {
    if (!candidatId) navigate("/");
  }, [candidatId, navigate]);

  const { donnees: candidat, erreur } = usePolling(
    () => api.recupererCandidat(candidatId),
    2500,
    [candidatId]
  );

  // Empêche d'afficher le poste avant que la roulette admin ait fini de tourner.
  const [posteRevele, setPosteRevele] = useState(
    () => localStorage.getItem(`posteRevele_${candidatId}`) === "1"
  );
  const timerRef = useRef(null);

  useEffect(() => {
    if (candidat?.poste_attribue && !posteRevele && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        setPosteRevele(true);
        localStorage.setItem(`posteRevele_${candidatId}`, "1");
      }, DELAI_REVELATION_MS);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [candidat?.poste_attribue, posteRevele, candidatId]);

  if (!candidatId) return null;

  if (erreur && !candidat) {
    return (
      <div className="ecran">
        <div className="entete-systeme">
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>&larr; Accueil</Link>
          <span>PARCOURS</span>
        </div>
        <div className="ecran-contenu" style={{ justifyContent: "center", alignItems: "center", gap: 16 }}>
          <p className="sous-texte" style={{ color: "var(--red)" }}>
            {erreur.status === 404 ? "Dossier introuvable. Réinscrivez-vous." : erreur.message}
          </p>
          <button
            className="bouton bouton-primaire"
            onClick={() => { localStorage.removeItem("candidatId"); navigate("/postuler"); }}
          >
            Postuler à nouveau
          </button>
        </div>
      </div>
    );
  }

  if (!candidat) {
    return (
      <div className="ecran">
        <div className="ecran-contenu" style={{ justifyContent: "center", alignItems: "center" }}>
          <p className="sous-texte">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  const statut = candidat.statut;
  // Si le candidat n'est plus "actif" (retiré, viré...), on révèle quand même
  // directement : le délai n'a de sens que pendant l'attente en direct.
  const poste = candidat.poste_attribue && (posteRevele || statut !== "actif")
    ? posteParId(candidat.poste_attribue)
    : null;
  const idCourt = String(candidat.id).padStart(6, "0").toUpperCase();

  return (
    <div className="ecran">
      <div className="entete-systeme">
        <span>
          <span className={`led ${LEDS_PAR_STATUT[statut] || "blue"}`} />
          {candidat.nom}
        </span>
        <span className="code-mono">#{idCourt}</span>
      </div>

      <div className="ecran-contenu" style={{ gap: 24, paddingTop: 32 }}>
        <div>
          <p className="sous-texte" style={{ marginBottom: 4 }}>
            Statut
          </p>
          <h1 className="grand-titre" style={{ fontSize: "1.6rem" }}>
            {LIBELLES_STATUT[statut] || statut}
          </h1>
        </div>

        {statut === "attente" && (
          <div className="carte-badge">
            <p className="sous-texte" style={{ margin: 0, color: "var(--text)" }}>
              Votre candidature est en file d&apos;attente.
            </p>
            <p className="sous-texte" style={{ marginTop: 8, marginBottom: 0 }}>
              Un responsable va bientôt vous appeler. Gardez cet écran ouvert :
              il se mettra à jour automatiquement.
            </p>
          </div>
        )}

        {statut === "actif" && !poste && (
          <div className="carte-badge">
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 4, color: "var(--green)" }}
            >
              Vous avez été sélectionné !
            </p>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 0 }}>
              Rendez-vous devant l&apos;écran affiché en face de vous. Placez-vous
              dans le cadre quand il affiche « Veuillez enregistrer votre visage
              » : la photo est prise automatiquement.
            </p>
          </div>
        )}

        {statut === "actif" && poste && (
          <div className="carte-badge" style={{ borderColor: "var(--green)" }}>
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 4, color: "var(--green)" }}
            >
              Poste attribué : {poste.label}
            </p>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 0 }}>
              {poste.message}
            </p>
            <p className="sous-texte" style={{ marginTop: 12, marginBottom: 0 }}>
              Présentez-vous au kiosque (carte + visage) pour entrer dans
              l&apos;entreprise. La suite se joue sur place.
            </p>
          </div>
        )}

        {statut === "historique" && (
          <div className="carte-badge" style={{ borderColor: "var(--red)" }}>
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 0, color: "var(--text)" }}
            >
              {poste
                ? `Parcours terminé. Dernier poste : ${poste.label}.`
                : "Votre parcours est terminé (candidature non retenue ou fin de simulation)."}
            </p>
          </div>
        )}

        <p className="sous-texte" style={{ fontSize: 12, marginTop: "auto" }}>
          Identifiant : <span className="code-mono">#{idCourt}</span> — notez-le
          pour reprendre plus tard.
        </p>
      </div>
    </div>
  );
}