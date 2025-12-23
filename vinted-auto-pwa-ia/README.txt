VINTED AUTO (PWA) – Démo + Mode IA
=================================

Cette PWA fonctionne de 2 façons :
1) Mode démo (sans IA) : génère une annonce à partir de tes champs (sans analyser les photos).
2) Mode IA : analyse 5+ photos via un backend (API) pour :
   - détection de défauts / état
   - suggestions marque/catégorie/couleur/matière
   - génération annonce Vinted (titre en minuscules + hashtags à la fin)
   - estimation de prix (fourchette + prix conseillé)
   - option : génération d’une photo mannequin (sans visage)

IMPORTANT
---------
La PWA doit être servie en HTTPS (hébergement). On ne peut pas la lancer correctement en ouvrant index.html localement.

Installation iPhone
-------------------
1) Uploade le dossier PWA sur ton hébergement (ex: https://ton-domaine/vinted-auto/)
2) Ouvre l’URL sur iPhone avec Safari
3) Partager → Sur l’écran d’accueil

Mode IA
-------
- Déploie le backend (dossier backend dans l’autre ZIP)
- Dans la PWA : ⚙️ mode ia → colle l’URL de l’API → coche "utiliser l’ia" → (option) coche "photo mannequin"
