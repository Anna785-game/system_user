import { configEvenement } from "../constants/events";

const COULEURS = {
  amber: ["var(--amber)", "var(--amber-dim)"],
  green: ["var(--green)", "var(--green-dim)"],
  red: ["var(--red)", "var(--red-dim)"],
  blue: ["var(--blue)", "var(--blue-dim)"],
};

function formatHeure(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function TimelineItem({ evenement, estLeDernier }) {
  const config = configEvenement(evenement.type);
  const ton = typeof config.ton === "function" ? config.ton(evenement.data) : config.ton;
  const [couleur, couleurDim] = COULEURS[ton] || COULEURS.blue;

  return (
    <div
      className={`feed-item ${config.majeur ? "majeur" : ""} ${estLeDernier ? "actuel" : ""}`}
      style={{ "--tone": couleur, "--tone-dim": couleurDim }}
    >
      <div className="horodatage">{formatHeure(evenement.ts)}</div>
      <div className="libelle">{config.libelle(evenement.data)}</div>
    </div>
  );
}
