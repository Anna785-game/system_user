import { useEffect, useRef, useState } from "react";

export function useCameraVisage(actif) {
  const videoRef = useRef(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!actif) {
      setPret(false);
      setErreur(null);
      return;
    }

    let flux = null;
    let annule = false;
    let retryId = null;

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

        // Attendre que le <video> soit bien monté (évite la course)
        const brancher = async () => {
          if (annule || !flux) return;
          const video = videoRef.current;
          if (!video) {
            retryId = setTimeout(brancher, 50);
            return;
          }
          video.srcObject = flux;
          try {
            await video.play();
            if (!annule) {
              setPret(true);
              setErreur(null);
            }
          } catch {
            if (!annule) {
              setErreur("Impossible de démarrer la caméra.");
            }
          }
        };
        brancher();
      } catch {
        if (!annule) {
          setErreur(
            "Impossible d'accéder à la caméra frontale. Vérifiez l'autorisation caméra de votre navigateur."
          );
          setPret(false);
        }
      }
    }

    demarrer();

    return () => {
      annule = true;
      if (retryId) clearTimeout(retryId);
      flux?.getTracks().forEach((t) => t.stop());
    };
  }, [actif]);

  function capturerPhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      return Promise.reject(new Error("Caméra pas prête"));
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Miroir horizontal (même sens que l'affichage selfie)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }

  return { videoRef, pret, erreur, capturerPhoto };
}