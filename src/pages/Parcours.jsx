import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { usePolling } from "../hooks/usePolling";
import { posteParId } from "../constants/postes";

const LEDS_PAR_STATUT = { attente: "amber", actif: "green", historique: "red" };
const LIBELLES_STATUT = {
  attente: "En attente",
  actif: "Sélectionné",
  historique: "Parcours terminé",
};

/** Mot de passe démo (vérifié aussi côté serveur /demo/*). */
const DEMO_PWD = "azerty";

export default function Parcours() {
  const navigate = useNavigate();
  const candidatId = localStorage.getItem("candidatId");

  const [demoOpen, setDemoOpen] = useState(false);
  const [demoUnlocked, setDemoUnlocked] = useState(
    () => sessionStorage.getItem("demoUnlocked") === "1"
  );
  const [pwd, setPwd] = useState("");
  const [demoMsg, setDemoMsg] = useState(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [uidFactice, setUidFactice] = useState(null);

  // --- Enrôlement kiosque ---
  const [enrolementEcranEnCours, setEnrolementEcranEnCours] = useState(false);
  const [enrolementEcranMsg, setEnrolementEcranMsg] = useState(null);
  const [enrolementEcranErreur, setEnrolementEcranErreur] = useState(null);

  useEffect(() => {
    if (!candidatId) navigate("/");
  }, [candidatId, navigate]);

  const { donnees: candidat, erreur } = usePolling(
    () => api.recupererCandidat(candidatId),
    2500,
    [candidatId]
  );

  // Dès que le visage est enrôlé (téléphone OU écran), on arrête le mode "en attente kiosque"
  useEffect(() => {
    if (candidat?.visage_enrole) {
      setEnrolementEcranEnCours(false);
      setEnrolementEcranMsg(null);
      setEnrolementEcranErreur(null);
    }
  }, [candidat?.visage_enrole]);

  function confirmerPwd(e) {
    e.preventDefault();
    if (pwd.trim() !== DEMO_PWD) {
      setDemoMsg("Mot de passe incorrect.");
      return;
    }
    sessionStorage.setItem("demoUnlocked", "1");
    setDemoUnlocked(true);
    setDemoOpen(false);
    setPwd("");
    setDemoMsg(null);
  }

  async function activerCarte() {
    setDemoBusy(true);
    setDemoMsg(null);
    try {
      const res = await api.demoCarteFactice(candidatId, DEMO_PWD);
      setUidFactice(res.uidcarte);
      setDemoMsg(res.message || "Vous avez utilisé la carte factice, monseigneur.");
    } catch (err) {
      setDemoMsg(err.message || "Erreur");
    } finally {
      setDemoBusy(false);
    }
  }

  async function simulerScan() {
    setDemoBusy(true);
    setDemoMsg(null);
    try {
      const res = await api.demoSimulerScan(candidatId, DEMO_PWD);
      setUidFactice(res.uidcarte);
      setDemoMsg(
        res.message ||
          "Vous avez utilisé la carte factice, monseigneur. Passez devant la caméra."
      );
    } catch (err) {
      setDemoMsg(err.message || "Erreur");
    } finally {
      setDemoBusy(false);
    }
  }

  async function demanderEnrolementSurEcran() {
    setEnrolementEcranErreur(null);
    setEnrolementEcranMsg(null);
    setEnrolementEcranEnCours(true);
    try {
      await api.demanderEnrolementEcran(candidatId);
      setEnrolementEcranMsg(
        "Demande envoyée. Placez-vous maintenant devant l’écran de l’entreprise pour enregistrer votre visage."
      );
    } catch (err) {
      setEnrolementEcranEnCours(false);
      setEnrolementEcranErreur(
        err.message || "Impossible de contacter l’écran. Réessayez."
      );
    }
  }

  if (!candidatId) return null;

  if (erreur && !candidat) {
    return (
      <div className="ecran">
        <div className="entete-systeme">
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            &larr; Accueil
          </Link>
          <span>PARCOURS</span>
        </div>
        <div
          className="ecran-contenu"
          style={{ justifyContent: "center", alignItems: "center", gap: 16 }}
        >
          <p className="sous-texte" style={{ color: "var(--red)" }}>
            {erreur.status === 404
              ? "Dossier introuvable. Réinscrivez-vous."
              : erreur.message}
          </p>
          <button
            className="bouton bouton-primaire"
            onClick={() => {
              localStorage.removeItem("candidatId");
              navigate("/postuler");
            }}
          >
            Postuler à nouveau
          </button>
        </div>
      </div>
    );
  }

  if (!candidat) {
    return (
      <div className="ecran">
        <div
          className="ecran-contenu"
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <p className="sous-texte">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  const statut = candidat.statut;
  const poste = candidat.poste_attribue
    ? posteParId(candidat.poste_attribue)
    : null;
  const idCourt = String(candidat.id).padStart(6, "0").toUpperCase();

  return (
    <div className="ecran">
      <div className="entete-systeme" style={{ position: "relative" }}>
        <span>
          <span className={`led ${LEDS_PAR_STATUT[statut] || "blue"}`} />
          {candidat.nom}
        </span>
        <span className="code-mono">#{idCourt}</span>

        {statut === "actif" && poste && (
          <button
            type="button"
            onClick={() => {
              setDemoMsg(null);
              setDemoOpen(true);
            }}
            title="Superadmin"
            aria-label="Superadmin"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "var(--text-dim)",
              fontSize: 11,
              opacity: 0.4,
              cursor: "pointer",
              padding: "4px 6px",
            }}
          >
            ◆
          </button>
        )}
      </div>

      {/* Modal mot de passe superadmin */}
      {demoOpen && !demoUnlocked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <form
            onSubmit={confirmerPwd}
            className="carte-badge"
            style={{ maxWidth: 320, width: "100%" }}
          >
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 12 }}>
              Accès superadmin
            </p>
            <input
              className="champ"
              type="password"
              placeholder="Mot de passe"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            {demoMsg && (
              <p className="erreur-form" style={{ marginTop: 8 }}>
                {demoMsg}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="submit" className="bouton bouton-primaire">
                Confirmer
              </button>
              <button
                type="button"
                className="bouton"
                onClick={() => {
                  setDemoOpen(false);
                  setPwd("");
                  setDemoMsg(null);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="ecran-contenu" style={{ gap: 24, paddingTop: 32 }}>
        <div>
          <p className="sous-texte" style={{ marginBottom: 4 }}>
            Statut
          </p>
          <h1 className="grand-titre" style={{ fontSize: "1.6rem" }}>
            {LIBELLES_STATUT[statut] || statut}
          </h1>
        </div>

        {statut === "attente" && (
          <div className="carte-badge">
            <p className="sous-texte" style={{ margin: 0, color: "var(--text)" }}>
              Votre candidature est en file d&apos;attente.
            </p>
            <p className="sous-texte" style={{ marginTop: 8, marginBottom: 0 }}>
              Un responsable va bientôt vous appeler. Gardez cet écran ouvert :
              il se mettra à jour automatiquement.
            </p>
          </div>
        )}

        {/* ========== CHOIX D'ENRÔLEMENT (téléphone OU écran) ========== */}
        {statut === "actif" && !poste && !candidat.visage_enrole && (
          <div className="carte-badge">
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 4, color: "var(--green)" }}
            >
              Vous avez été sélectionné !
            </p>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 20 }}>
              Enregistrez votre visage pour continuer. Choisissez la méthode
              qui vous convient :
            </p>

            {/* Bouton 1 : téléphone */}
            <Link
              to="/enrolement"
              className="bouton bouton-primaire"
              style={{
                display: "block",
                textAlign: "center",
                padding: "16px 24px",
                marginBottom: 12,
              }}
            >
              S’enrôler sur ce téléphone
            </Link>

            {/* Bouton 2 : écran kiosque */}
            <button
              type="button"
              className="bouton"
              style={{
                width: "100%",
                padding: "16px 24px",
                opacity: enrolementEcranEnCours ? 0.7 : 1,
              }}
              disabled={enrolementEcranEnCours}
              onClick={demanderEnrolementSurEcran}
            >
              {enrolementEcranEnCours
                ? "Demande envoyée…"
                : "S’enrôler sur l’écran"}
            </button>

            {enrolementEcranMsg && (
              <p
                className="sous-texte"
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  color: "var(--green)",
                  textAlign: "center",
                }}
              >
                {enrolementEcranMsg}
              </p>
            )}
            {enrolementEcranErreur && (
              <p
                className="sous-texte"
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  color: "var(--red)",
                  textAlign: "center",
                }}
              >
                {enrolementEcranErreur}
              </p>
            )}
          </div>
        )}

        {statut === "actif" && !poste && candidat.visage_enrole && (
          <div className="carte-badge">
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 4, color: "var(--green)" }}
            >
              Visage enrôlé !
            </p>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 16 }}>
              Dernière étape : choisissez le poste que vous souhaitez occuper.
            </p>
            <style>{`
              @keyframes clignote-poste {
                0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(56, 189, 148, 0.55); }
                50% { opacity: 0.85; box-shadow: 0 0 0 10px rgba(56, 189, 148, 0); }
              }
            `}</style>
            <Link
              to="/choisir-poste"
              className="bouton bouton-primaire"
              style={{
                display: "inline-block",
                padding: "16px 30px",
                animation: "clignote-poste 1.5s ease-in-out infinite",
              }}
            >
              Choisir mon poste
            </Link>
          </div>
        )}

        {statut === "actif" && poste && (
          <div className="carte-badge" style={{ borderColor: "var(--green)" }}>
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 4, color: "var(--green)" }}
            >
              Poste choisi : {poste.label}
            </p>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 0 }}>
              {poste.message}
            </p>
            <p className="sous-texte" style={{ marginTop: 12, marginBottom: 0 }}>
              Demandez maintenant votre carte à l&apos;administrateur. Une fois
              la carte reçue, présentez-vous à l&apos;écran de l&apos;entreprise
              : carte + visage à chaque entrée et sortie.
            </p>
          </div>
        )}

        {/* Panneau démo superadmin (après déverrouillage) */}
        {statut === "actif" && poste && demoUnlocked && (
          <div
            className="carte-badge"
            style={{ borderColor: "var(--amber, #d4a017)" }}
          >
            <p
              className="sous-texte"
              style={{
                marginTop: 0,
                marginBottom: 4,
                color: "var(--amber, #d4a017)",
              }}
            >
              Mode superadmin (démo)
            </p>
            <p className="sous-texte" style={{ marginTop: 0, marginBottom: 0 }}>
              {candidat.nom} · {poste.label}
              {uidFactice && (
                <>
                  {" "}
                  · carte <span className="code-mono">{uidFactice}</span>
                </>
              )}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 14,
              }}
            >
              <button
                type="button"
                className="bouton bouton-primaire"
                disabled={demoBusy}
                onClick={activerCarte}
              >
                {demoBusy ? "…" : "Activer carte factice (1 h)"}
              </button>
              <button
                type="button"
                className="bouton bouton-primaire"
                disabled={demoBusy}
                onClick={simulerScan}
              >
                {demoBusy ? "…" : "Simuler passage carte → caméra"}
              </button>
            </div>
            {demoMsg && (
              <p
                className="sous-texte"
                style={{ marginBottom: 0, marginTop: 12 }}
              >
                {demoMsg}
              </p>
            )}
          </div>
        )}

        {statut === "historique" && (
          <div className="carte-badge" style={{ borderColor: "var(--red)" }}>
            <p
              className="sous-texte"
              style={{ marginTop: 0, marginBottom: 0, color: "var(--text)" }}
            >
              {poste
                ? `Parcours terminé. Dernier poste : ${poste.label}.`
                : "Votre parcours est terminé (candidature non retenue ou fin de simulation)."}
            </p>
          </div>
        )}

        <p className="sous-texte" style={{ fontSize: 12, marginTop: "auto" }}>
          Identifiant : <span className="code-mono">#{idCourt}</span> — notez-le
          pour reprendre plus tard.
        </p>
      </div>
    </div>
  );
}