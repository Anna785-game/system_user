import { posteParId } from "./postes";

// majeur: true => rendu en "grand texte" dans le feed (les moments clés du
// parcours). false => ligne discrète (utile pour garder le fil sans saturer
// l'écran).
export const CONFIG_EVENEMENTS = {
  candidature: {
    majeur: false,
    ton: "blue",
    libelle: () => "Candidature envoyée.",
  },
  en_attente: {
    majeur: true,
    ton: "amber",
    libelle: () => "Vous êtes en attente.",
  },
  selection: {
    majeur: true,
    ton: "green",
    libelle: () => "Vous avez été sélectionné !",
  },
  refus: {
    majeur: true,
    ton: "red",
    libelle: () => "Candidature non retenue cette fois.",
  },
  action_enregistrer_visage: {
    majeur: true,
    ton: "blue",
    libelle: () => "Enregistrez votre visage d'abord.",
  },
  visage_ok: {
    majeur: false,
    ton: "green",
    libelle: () => "Visage enregistré.",
  },
  poste_attribue: {
    majeur: true,
    ton: (d) => (posteParId(d.poste).ton === "succes" ? "green" : posteParId(d.poste).ton === "echec" ? "red" : "blue"),
    libelle: (d) => posteParId(d.poste).message,
  },
  entree: {
    majeur: true,
    ton: "green",
    libelle: (d) => `Vous êtes entré à ${d.heure}.`,
  },
  sortie: {
    majeur: true,
    ton: "amber",
    libelle: (d) => `Vous êtes sorti à ${d.heure}.`,
  },
  jour_simulation: {
    majeur: true,
    ton: "blue",
    libelle: (d) => `Jour ${d.jour} : ${d.anecdote}`,
  },
  licenciement: {
    majeur: true,
    ton: "red",
    libelle: () => "Vous êtes viré.",
  },
};

export function configEvenement(type) {
  return CONFIG_EVENEMENTS[type] || { majeur: false, ton: "blue", libelle: () => type };
}
