import { useEffect, useRef, useState } from "react";

// Interroge `fn` toutes les `intervalleMs` et expose le dernier résultat.
// Utilisé pour que l'écran candidat réagisse aux actions prises côté front
// admin (sélection, licenciement, ...) sans que l'utilisateur ait à raffraîchir.
export function usePolling(fn, intervalleMs = 3000, deps = []) {
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(null);
  const enCours = useRef(false);

  useEffect(() => {
    let annule = false;

    async function tick() {
      if (enCours.current) return;
      enCours.current = true;
      try {
        const resultat = await fn();
        if (!annule) {
          setDonnees(resultat);
          setErreur(null);
        }
      } catch (e) {
        if (!annule) setErreur(e);
      } finally {
        enCours.current = false;
      }
    }

    tick();
    const id = setInterval(tick, intervalleMs);
    return () => {
      annule = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { donnees, erreur, setDonnees };
}
