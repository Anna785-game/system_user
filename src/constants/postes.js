// Doit rester synchronisé avec la liste POSTES de mock-api/server.js
// (c'est le serveur qui tire le poste au hasard ; ce fichier ne fait
// qu'associer id -> message affiché).
export const POSTES = {
  boss: {
    label: "Grand Patron",
    ton: "succes",
    message: "Bien joué : avec votre CV, vous êtes devenu le boss.",
  },
  vendeur: {
    label: "Vendeur",
    ton: "neutre",
    message: "Vous avez le contact facile. Direction le terrain, en vendeur.",
  },
  comptable: {
    label: "Comptable",
    ton: "neutre",
    message: "Précis et méthodique : vous rejoignez la compta.",
  },
  stagiaire_cafe: {
    label: "Stagiaire café",
    ton: "neutre",
    message: "Pour commencer, vous gérez la machine à café. Tout le monde compte sur vous.",
  },
  nettoyeur: {
    label: "Nettoyeur de toilettes",
    ton: "echec",
    message: "Malheureusement, le grand patron vous a mis comme nettoyeur de toilettes.",
  },
};

export function posteParId(id) {
  return POSTES[id] || { label: id, ton: "neutre", message: "Poste attribué." };
}
