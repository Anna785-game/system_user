import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { usePolling } from "../hooks/usePolling";
import TimelineItem from "../components/TimelineItem";

const LEDS_PAR_STATUT = {
  en_attente: "amber",
  selectionne: "green",
  refuse: "red",
  vire: "red",
};

export default function Parcours() {
  const navigate = useNavigate();
  const candidatId = localStorage.getItem("candidatId");
  const feedRef = useRef(null);
  const [actionEnCours, setActionEnCours] = useState(false);

  useEffect(() => {
    if (!candidatId) navigate("/");
  }, [candidatId, navigate]);

  const { donnees: candidat, setDonnees } = usePolling(
    () => api.recupererCandidat(candidatId),
    2500,
    [candidatId]
  );

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [candidat?.historique?.length]);

  if (!candidat) {
    return (
      <div className="ecran">
        <div className="ecran-contenu" style={{ justifyContent: "center", alignItems: "center" }}>
          <p className="sous-texte">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  const dernier = candidat.historique[candidat.historique.length - 1];
  // On attend que le visage soit enregistré : ça se passe désormais sur
  // l'écran physique (front_ecran), jamais sur le téléphone du candidat.
  const attenteVisage = dernier?.type === "action_enregistrer_visage" && !candidat.visageEnregistre;
  const visageVientDetreConfirme = dernier?.type === "visage_ok";
  const posteVientDetreAttribue = dernier?.type === "poste_attribue";
  const parcoursTermine = candidat.statut === "vire" || candidat.statut === "refuse";

  async function badge(type) {
    setActionEnCours(true);
    try {
      const maj = await api.badge(candidatId, type);
      setDonnees(maj);
    } finally {
      setActionEnCours(false);
    }
  }

  async function jourSuivant() {
    setActionEnCours(true);
    try {
      const maj = await api.jourSuivant(candidatId);
      setDonnees(maj);
    } finally {
      setActionEnCours(false);
    }
  }

  return (
    <div className="ecran">
      <div className="entete-systeme">
        <span>
          <span className={`led ${LEDS_PAR_STATUT[candidat.statut] || "blue"}`} />
          {candidat.nom}
        </span>
        <span className="code-mono">#{candidat.id.slice(0, 6).toUpperCase()}</span>
      </div>

      <div ref={feedRef} className="feed">
        {candidat.historique.map((ev, i) => (
          <TimelineItem
            key={ev.id}
            evenement={ev}
            estLeDernier={i === candidat.historique.length - 1}
          />
        ))}

        {/* Étape d'action inline : on ne fait plus rien avec la caméra ici.
            On redirige le candidat vers l'écran physique posé devant lui. */}
        {attenteVisage && (
          <div className="carte-badge">
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 4, color: "var(--text)" }}>
              Rendez-vous devant l'écran affiché en face de vous.
            </p>
            <p className="sous-texte" style={{ marginTop: 0 }}>
              Placez-vous dedans quand l'écran affiche « Veuillez enregistrer
              votre visage » : la photo est prise automatiquement, vous n'avez
              rien à faire ici.
            </p>
          </div>
        )}

        {/* Petite confirmation, en plus de la ligne déjà présente dans le fil */}
        {visageVientDetreConfirme && (
          <div className="carte-badge" style={{ borderColor: "var(--green)" }}>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 0, color: "var(--green)" }}>
              ✓ Votre visage a bien été enregistré.
            </p>
          </div>
        )}
      </div>

      {/* Barre d'action contextuelle, en fonction de l'étape en cours */}
      {!parcoursTermine && (
        <div className="barre-action">
          {posteVientDetreAttribue && !candidat.dansEntreprise && (
            <button className="bouton bouton-primaire bouton-bloc" disabled={actionEnCours} onClick={() => badge("entree")}>
              Entrer dans l'entreprise
            </button>
          )}

          {candidat.dansEntreprise && (
            <button className="bouton bouton-primaire bouton-bloc" disabled={actionEnCours} onClick={() => badge("sortie")}>
              Sortir
            </button>
          )}

          {!candidat.dansEntreprise &&
            candidat.poste &&
            !posteVientDetreAttribue &&
            (dernier?.type === "sortie" || dernier?.type === "jour_simulation") && (
              <button className="bouton bouton-fantome bouton-bloc" disabled={actionEnCours} onClick={jourSuivant}>
                Journée suivante
              </button>
            )}
        </div>
      )}
    </div>
  );
}
