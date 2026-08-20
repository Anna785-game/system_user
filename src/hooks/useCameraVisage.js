import { useEffect, useRef, useState } from "react";

// Ouvre la caméra FRONTALE du téléphone (facingMode "user") tant que
// `actif` est vrai. Contrairement au hook équivalent de sys_ecran (qui
// tourne sur un PC/tablette fixe avec une détection de présence en
// continu), on ne fait pas de détection automatique de visage ici : sur
// mobile, l'API FaceDetector est peu fiable/absente (Safari iOS), et une
// simple confirmation manuelle de l'utilisateur ("Je suis prêt") avant de
// lancer le compte à rebours est plus robuste.
export function useCameraVisage(actif) {
  const videoRef = useRef(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!actif) {
      setPret(false);
      return;
    }

    let flux;
    let annule = false;

    async function demarrer() {
      try {
        flux = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (annule) {
          flux.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = flux;
          await videoRef.current.play();
          setPret(true);
        }
      } catch {
        setErreur(
          "Impossible d'accéder à la caméra frontale. Vérifiez l'autorisation caméra de votre navigateur."
        );
      }
    }
    demarrer();

    return () => {
      annule = true;
      flux?.getTracks().forEach((t) => t.stop());
    };
  }, [actif]);

  function capturerPhoto() {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Miroir horizontal : la vidéo est affichée en mode "selfie" (flip
    // CSS), on capture donc l'image dans le même sens pour que la photo
    // corresponde à ce que l'utilisateur a vu à l'écran.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }

  return { videoRef, pret, erreur, capturerPhoto };
}
