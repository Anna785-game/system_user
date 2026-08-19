const API_BASE =
  import.meta.env.VITE_API_BASE;

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
 * Client aligné sur fastapi_pointage (plus de mock-api :4000).
 *
 * Inscription publique : POST /candidats/inscription { nom }
 * Suivi : GET /candidats/mon-statut?candidat_id=
 *
 * Badge / simulation jour : gérés côté kiosque + admin, pas sur le téléphone.
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
   * Optionnel : inscription complète compte Supabase + candidat.
   * Utile si tu veux un vrai login email/password plus tard.
   */
  register: (email, password, nom) =>
    appel(`${API_BASE}/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, password, nom }),
    }),
};

export { API_BASE };