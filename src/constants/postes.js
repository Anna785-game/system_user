// Synchronisé avec /postes/seed-demo du backend. Les postes sont désormais
// choisis par le candidat lui-même (voir pages/ChoisirPoste.jsx) : ce
// mapping ne sert plus qu'à personnaliser le libellé et le message affichés
// une fois le poste choisi, il n'y a plus de tirage au sort.
export const POSTES = {
  Boss: {
    label: "Grand Patron",
    ton: "succes",
    message: "Vous avez choisi de prendre les commandes, en tant que boss.",
  },
  Vendeur: {
    label: "Vendeur",
    ton: "neutre",
    message: "Vous avez choisi le terrain : direction la vente.",
  },
  "Nettoyeur de toilettes": {
    label: "Nettoyeur de toilettes",
    ton: "neutre",
    message: "Vous avez choisi ce poste. Respect.",
  },
};

export function posteParId(id) {
  return (
    POSTES[id] || {
      label: id || "Poste",
      ton: "neutre",
      message: "Poste choisi.",
    }
  );
}
