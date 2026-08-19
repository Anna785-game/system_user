// Synchronisé avec /postes/seed-demo du backend
export const POSTES = {
  Boss: {
    label: "Grand Patron",
    ton: "succes",
    message: "Bien joué : avec votre CV, vous êtes devenu le boss.",
  },
  Vendeur: {
    label: "Vendeur",
    ton: "neutre",
    message: "Vous avez le contact facile. Direction le terrain, en vendeur.",
  },
  "Nettoyeur de toilettes": {
    label: "Nettoyeur de toilettes",
    ton: "echec",
    message:
      "Malheureusement, le grand patron vous a mis comme nettoyeur de toilettes.",
  },
};

export function posteParId(id) {
  return (
    POSTES[id] || {
      label: id || "Poste",
      ton: "neutre",
      message: "Poste attribué.",
    }
  );
}