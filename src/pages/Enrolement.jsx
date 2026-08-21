import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useCameraVisage } from "../hooks/useCameraVisage";

// phases :
//   "chargement" | "attente" | "compte" | "envoi" | "resultat" | "erreur"

export default function Enrolement() {
  const navigate = useNavigate();
  const candidatId = localStorage.getItem("candidatId");

  const [phase, setPhase] = useState("chargement");
  const [nom, setNom] = useState("");
  const [resultat, setResultat] = useState(null);
  const [erreurEnvoi, setErreurEnvoi] = useState(null);
  const [compte, setCompte] = useState(null); // secondes restantes

  const actif = phase === "attente" || phase === "compte";
  const { videoRef, pret, erreur: erreurCamera, capturerPhoto } =
    useCameraVisage(actif);

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
        if (c.visage_enrole) {
          // Déjà enrôlé → on passe direct au choix de poste
          navigate("/choisir-poste");
          return;
        }
        setNom(c.nom || "");
        setPhase("attente");
      } catch {
        if (!annule) navigate("/parcours");
      }
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatId]);

  // Compte à rebours 5 s (capture à 2 s)
  useEffect(() => {
    if (phase !== "compte") return;

    const DUREE = 5000;
    const CAPTURE_A = 2000;
    const debut = Date.now();
    let dejaCapture = false;

    const id = setInterval(async () => {
      const ecoule = Date.now() - debut;
      setCompte(Math.max(0, Math.ceil((DUREE - ecoule) / 1000)));

      if (!dejaCapture && ecoule >= CAPTURE_A) {
        dejaCapture = true;
        try {
          const blob = await capturerPhoto();
          setPhase("envoi");
          await envoyerPhoto(blob);
        } catch (e) {
          setErreurEnvoi(e);
          setPhase("erreur");
        }
      }

      if (ecoule >= DUREE) {
        clearInterval(id);
      }
    }, 100);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function envoyerPhoto(blob) {
    try {
      const data = await api.enrolerVisage(candidatId, blob);
      setResultat(data);
      setPhase("resultat");
    } catch (e) {
      setErreurEnvoi(e);
      setPhase("erreur");
    }
  }

  function lancerCompte() {
    if (!pret) return;
    setCompte(5);
    setPhase("compte");
  }

  function relancer() {
    setErreurEnvoi(null);
    setResultat(null);
    setCompte(null);
    setPhase("attente");
  }

  if (!candidatId) return null;

  if (phase === "chargement") {
    return (
      <PageCadre titre="ENRÔLEMENT" nom={nom}>
        <p className="sous-texte">Chargement...</p>
        <BoutonRetour />
      </PageCadre>
    );
  }

  return (
    <PageCadre titre="ENRÔLEMENT" nom={nom}>
      {/* Bouton retour toujours visible tant qu'on n'a pas réussi */}
      {phase !== "resultat" && <BoutonRetour />}

      {phase === "attente" && (
        <div style={{ textAlign: "center", width: "100%", maxWidth: 360 }}>
          <h1 className="grand-titre" style={{ fontSize: "1.4rem", marginBottom: 8 }}>
            Enregistrez votre visage
          </h1>
          <p className="sous-texte" style={{ marginBottom: 16 }}>
            Placez votre visage dans le cadre, puis appuyez sur « Je suis prêt ».
          </p>

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3/4",
              borderRadius: 16,
              overflow: "hidden",
              background: "#111",
              marginBottom: 16,
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)", // miroir selfie
              }}
            />
            {!pret && !erreurCamera && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.5)",
                  color: "var(--text-dim)",
                }}
              >
                Activation de la caméra...
              </div>
            )}
          </div>

          {erreurCamera && (
            <p className="sous-texte" style={{ color: "var(--red)", marginBottom: 12 }}>
              {erreurCamera}
            </p>
          )}

          <button
            type="button"
            className="bouton bouton-primaire"
            style={{ width: "100%", padding: "16px 24px" }}
            disabled={!pret}
            onClick={lancerCompte}
          >
            {pret ? "Je suis prêt" : "Caméra en cours…"}
          </button>
        </div>
      )}

      {phase === "compte" && (
        <div style={{ textAlign: "center" }}>
          <h1 className="grand-titre" style={{ fontSize: "1.4rem" }}>
            Ne bougez plus…
          </h1>
          <p className="sous-texte" style={{ fontSize: "3rem", margin: "24px 0" }}>
            {compte}
          </p>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: "100%",
              maxWidth: 280,
              borderRadius: 12,
              transform: "scaleX(-1)",
            }}
          />
        </div>
      )}

      {phase === "envoi" && (
        <div style={{ textAlign: "center" }}>
          <p className="sous-texte">Analyse en cours…</p>
        </div>
      )}

      {phase === "erreur" && (
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <p className="sous-texte" style={{ color: "var(--red)", marginBottom: 16 }}>
            {messageErreurLisible(erreurEnvoi)}
          </p>
          <button
            type="button"
            className="bouton bouton-primaire"
            onClick={relancer}
            style={{ marginBottom: 12, width: "100%" }}
          >
            Réessayer
          </button>
          <BoutonRetour />
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

function BoutonRetour() {
  return (
    <Link
      to="/parcours"
      className="bouton"
      style={{
        display: "inline-block",
        marginTop: 12,
        marginBottom: 8,
        padding: "12px 20px",
        textAlign: "center",
        textDecoration: "none",
      }}
    >
      ← Retour au choix
    </Link>
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