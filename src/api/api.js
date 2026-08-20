const API_BASE = import.meta.env.VITE_API_BASE;

async function appel(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const erreur = new Error(
      (typeof data?.detail === "string" ? data.detail : null) ||
        data?.erreur ||
        `Erreur ${res.status}`
    );
    erreur.status = res.status;
    erreur.data = data;
    throw erreur;
  }
  return data;
}

/**
 * Client aligné sur fastapi_pointage.
 *
 * Inscription publique : POST /candidats/inscription { nom }
 * Suivi : GET /candidats/mon-statut?candidat_id=
 * Enrôlement biométrique : POST /api/biometrie/enroll-public (caméra
 * frontale du téléphone — voir pages/Enrolement.jsx).
 * Choix du poste : GET /candidats/postes-disponibles puis
 * POST /candidats/{id}/choisir-poste (voir pages/ChoisirPoste.jsx). C'est
 * désormais le candidat qui choisit lui-même son poste, il n'y a plus de
 * tirage au sort côté serveur.
 *
 * Badge (entrée/sortie) et attribution de la carte physique restent gérés
 * au kiosque (sys_ecran), pas sur le téléphone.
 *
 * Mode démo : POST /demo/carte-factice et /demo/simuler-scan (mdp azerty).
 */
export const api = {
  /** Crée (ou renvoie l'existant en attente/actif) un candidat. */
  postuler: (nom) =>
    appel(`${API_BASE}/candidats/inscription`, {
      method: "POST",
      body: JSON.stringify({ nom }),
    }),

  /**
   * "Connexion" par id déjà connu (stocké en localStorage à l'inscription).
   * Pas de lookup par email côté API publique.
   */
  recupererCandidat: (id) =>
    appel(
      `${API_BASE}/candidats/mon-statut?candidat_id=${encodeURIComponent(id)}`
    ),

  /**
   * Envoie la photo prise par la caméra frontale du téléphone.
   * POST /api/biometrie/enroll-public (multipart), pas de header
   * "Content-Type" manuel : le navigateur pose la bonne boundary pour le
   * FormData (appel() ne doit donc PAS forcer application/json ici).
   */
  enrolerVisage: async (candidatId, blobPhoto) => {
    const form = new FormData();
    form.append("candidat_id", String(candidatId));
    form.append("photo", blobPhoto, "photo.jpg");

    const res = await fetch(`${API_BASE}/api/biometrie/enroll-public`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const erreur = new Error(
        (typeof data?.detail === "string" ? data.detail : null) ||
          data?.erreur ||
          `Erreur ${res.status}`
      );
      erreur.status = res.status;
      throw erreur;
    }
    return data; // { success, employe_id, ... }
  },

  /** Liste publique des postes proposés au choix (voir ChoisirPoste.jsx). */
  listePostesDisponibles: () =>
    appel(`${API_BASE}/candidats/postes-disponibles`),

  /** Le candidat choisit lui-même son poste parmi la liste ci-dessus. */
  choisirPoste: (candidatId, posteId) =>
    appel(
      `${API_BASE}/candidats/${encodeURIComponent(candidatId)}/choisir-poste`,
      {
        method: "POST",
        body: JSON.stringify({ poste_id: posteId }),
      }
    ),

  /** Mode démo superadmin (mot de passe azerty côté serveur). */
  demoCarteFactice: (candidatId, password) =>
    appel(`${API_BASE}/demo/carte-factice`, {
      method: "POST",
      body: JSON.stringify({ candidat_id: Number(candidatId), password }),
    }),

  demoSimulerScan: (candidatId, password) =>
    appel(`${API_BASE}/demo/simuler-scan`, {
      method: "POST",
      body: JSON.stringify({ candidat_id: Number(candidatId), password }),
    }),
};

export { API_BASE };