import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useCameraVisage } from "../hooks/useCameraVisage";

const DUREE_COMPTE_MS = 5000;
const DELAI_CAPTURE_MS = 2000; // photo prise pendant le compte, pas tout à la fin

// phase : "chargement" | "camera" | "compte" | "traitement" | "resultat"
export default function Enrolement() {
  const navigate = useNavigate();
  const candidatId = localStorage.getItem("candidatId");

  const [phase, setPhase] = useState("chargement");
  const [candidat, setCandidat] = useState(null);
  const [erreurChargement, setErreurChargement] = useState(null);
  const [erreurEnvoi, setErreurEnvoi] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [restant, setRestant] = useState(Math.ceil(DUREE_COMPTE_MS / 1000));
  // null | "envoi" | "ok" | Error — demande d'enrôlement sur l'écran kiosque
  const [demandeEcran, setDemandeEcran] = useState(null);

  const photoRef = useRef(null);
  const dejaCaptureRef = useRef(false);

  const camActive = phase === "camera" || phase === "compte";
  const { videoRef, pret, erreur: erreurCamera, capturerPhoto } =
    useCameraVisage(camActive);

  useEffect(() => {
    if (!candidatId) {
      navigate("/");
      return;
    }
    let annule = false;
    (async () => {
      try {
        const c = await api.recupererCandidat(candidatId);
        if (annule) return;
        if (c.statut !== "actif") {
          navigate("/parcours");
          return;
        }
        if (c.poste_attribue) {
          navigate("/parcours");
          return;
        }
        if (c.visage_enrole) {
          navigate("/choisir-poste");
          return;
        }
        setCandidat(c);
        setPhase("camera");
      } catch (e) {
        if (!annule) setErreurChargement(e);
      }
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatId]);

  // Boucle du compte à rebours
  useEffect(() => {
    if (phase !== "compte") return;
    dejaCaptureRef.current = false;
    const debut = Date.now();
    const intervalle = setInterval(async () => {
      const ecoule = Date.now() - debut;
      setRestant(Math.max(0, Math.ceil((DUREE_COMPTE_MS - ecoule) / 1000)));

      if (!dejaCaptureRef.current && ecoule >= DELAI_CAPTURE_MS) {
        dejaCaptureRef.current = true;
        try {
          photoRef.current = await capturerPhoto();
        } catch {
          photoRef.current = null;
        }
      }
      if (ecoule >= DUREE_COMPTE_MS) {
        clearInterval(intervalle);
        envoyer();
      }
    }, 100);
    return () => clearInterval(intervalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function envoyer() {
    setPhase("traitement");
    setErreurEnvoi(null);
    try {
      if (!photoRef.current) {
        throw new Error("Aucune photo n'a pu être prise, réessayez.");
      }
      const reponse = await api.enrolerVisage(candidatId, photoRef.current);
      setResultat(reponse);
      setPhase("resultat");
    } catch (e) {
      setErreurEnvoi(e);
      setPhase("resultat");
    } finally {
      photoRef.current = null;
    }
  }

  function relancer() {
    setResultat(null);
    setErreurEnvoi(null);
    setDemandeEcran(null);
    setRestant(Math.ceil(DUREE_COMPTE_MS / 1000));
    setPhase("camera");
  }

  async function demanderSurEcran() {
    if (demandeEcran === "envoi") return;
    setDemandeEcran("envoi");
    try {
      await api.demanderEnrolementEcran(candidatId);
      setDemandeEcran("ok");
    } catch (e) {
      setDemandeEcran(e);
    }
  }

  // Après demande d'enrôlement écran : surveiller mon-statut et rediriger
  // dès que le visage est enregistré (depuis le kiosque).
  useEffect(() => {
    if (demandeEcran !== "ok") return;
    let annule = false;
    const id = setInterval(async () => {
      try {
        const c = await api.recupererCandidat(candidatId);
        if (annule) return;
        if (c.visage_enrole) {
          navigate(c.poste_attribue ? "/parcours" : "/choisir-poste");
        }
      } catch {
        // ignore, on réessaie
      }
    }, 2500);
    return () => {
      annule = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandeEcran, candidatId]);

  if (!candidatId) return null;

  if (erreurChargement) {
    return (
      <PageCadre titre="ENRÔLEMENT">
        <p className="sous-texte" style={{ color: "var(--red)" }}>
          {erreurChargement.status === 404
            ? "Dossier introuvable. Réinscrivez-vous."
            : erreurChargement.message}
        </p>
        <Link to="/parcours" className="bouton bouton-primaire">
          Retour à mon parcours
        </Link>
      </PageCadre>
    );
  }

  if (phase === "chargement" || !candidat) {
    return (
      <PageCadre titre="ENRÔLEMENT">
        <p className="sous-texte">Chargement...</p>
      </PageCadre>
    );
  }

  return (
    <PageCadre titre="ENRÔLEMENT" nom={candidat.nom}>
      {(phase === "camera" || phase === "compte") && (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 4",
              borderRadius: 16,
              overflow: "hidden",
              background: "#111",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 24,
                border: "2px solid rgba(255,255,255,0.55)",
                borderRadius: 12,
                pointerEvents: "none",
              }}
            />
            {phase === "compte" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#fff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                {restant}
              </div>
            )}
          </div>

          {erreurCamera && (
            <div
              className="carte-badge"
              style={{ borderColor: "var(--red)", maxWidth: 360 }}
            >
              <p
                className="sous-texte"
                style={{ marginTop: 0, marginBottom: 8, color: "var(--red)" }}
              >
                {erreurCamera}
              </p>
              <p className="sous-texte" style={{ marginTop: 0, marginBottom: 14 }}>
                Votre navigateur n&apos;autorise pas la caméra, ou celle-ci est
                indisponible. Vous pouvez enrôler votre visage sur l&apos;écran
                devant vous.
              </p>
              {demandeEcran === "ok" ? (
                <p
                  className="sous-texte"
                  style={{ margin: 0, color: "var(--green)" }}
                >
                  L&apos;écran est prêt. Placez-vous devant lui : le message «
                  Pour {candidat?.nom} seulement » s&apos;affiche. Revenez ici
                  ensuite pour choisir votre poste.
                </p>
              ) : (
                <button
                  type="button"
                  className="bouton bouton-primaire"
                  disabled={demandeEcran === "envoi"}
                  onClick={demanderSurEcran}
                  style={{ width: "100%", padding: "14px 20px" }}
                >
                  {demandeEcran === "envoi"
                    ? "Notification de l'écran…"
                    : "Appuyez ici pour enrôler depuis l'écran devant vous"}
                </button>
              )}
              {demandeEcran && typeof demandeEcran === "object" && (
                <p
                  className="sous-texte"
                  style={{
                    color: "var(--red)",
                    marginBottom: 0,
                    marginTop: 10,
                  }}
                >
                  {demandeEcran.message || "Impossible de notifier l'écran."}
                </p>
              )}
            </div>
          )}

          {phase === "camera" && !erreurCamera && (
            <>
              <p className="sous-texte" style={{ textAlign: "center" }}>
                {pret
                  ? "Centrez votre visage dans le cadre, puis lancez la capture."
                  : "Activation de la caméra frontale..."}
              </p>
              <button
                type="button"
                className="bouton bouton-primaire"
                disabled={!pret}
                onClick={() => setPhase("compte")}
                style={{ padding: "14px 30px" }}
              >
                Je suis prêt(e)
              </button>
            </>
          )}

          {phase === "compte" && (
            <p className="sous-texte" style={{ textAlign: "center" }}>
              Ne bougez plus, la photo va être prise...
            </p>
          )}
        </div>
      )}

      {phase === "traitement" && (
        <p className="sous-texte" style={{ textAlign: "center" }}>
          Analyse en cours...
        </p>
      )}

      {phase === "resultat" && erreurEnvoi && (
        <div className="carte-badge" style={{ borderColor: "var(--red)" }}>
          <p
            className="sous-texte"
            style={{ marginTop: 0, marginBottom: 8, color: "var(--red)" }}
          >
            {messageErreurLisible(erreurEnvoi)}
          </p>
          <button
            type="button"
            className="bouton bouton-primaire"
            onClick={relancer}
          >
            Réessayer
          </button>
        </div>
      )}

      {phase === "resultat" && resultat && (
        <div className="carte-badge" style={{ borderColor: "var(--green)" }}>
          <p
            className="sous-texte"
            style={{ marginTop: 0, marginBottom: 4, color: "var(--green)" }}
          >
            Visage enregistré avec succès !
          </p>
          <p className="sous-texte" style={{ marginTop: 0, marginBottom: 0 }}>
            Dernière étape : choisissez votre poste.
          </p>
          <Link
            to="/choisir-poste"
            className="bouton bouton-primaire"
            style={{ display: "inline-block", marginTop: 14 }}
          >
            Choisir mon poste
          </Link>
        </div>
      )}
    </PageCadre>
  );
}

function PageCadre({ titre, nom, children }) {
  return (
    <div className="ecran">
      <div className="entete-systeme">
        <Link
          to="/parcours"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          &larr; {nom || "Retour"}
        </Link>
        <span>{titre}</span>
      </div>
      <div
        className="ecran-contenu"
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          paddingTop: 24,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function messageErreurLisible(e) {
  const brut = e?.message || "";
  if (/plusieurs visages/i.test(brut)) {
    return "Plusieurs personnes ont été détectées. Assurez-vous d'être seul(e) dans le cadre.";
  }
  if (/aucun visage/i.test(brut)) {
    return "Aucun visage détecté. Rapprochez-vous et centrez votre visage.";
  }
  if (/503|indisponible|hors ligne/i.test(brut)) {
    return "Service de reconnaissance indisponible. Réessayez dans un instant.";
  }
  if (/429|rate/i.test(brut)) {
    return "Trop de tentatives rapprochées. Patientez quelques secondes.";
  }
  return "La photo n'a pas pu être analysée (lumière, flou...). Réessayez.";
}