# État réel et reprise — projet École

Document de suivi unique. Mis à jour le **17/11/2026 à 18 h 45** (Porto-Novo).

Statuts employés : **VALIDÉ** (exécuté sur la version indiquée, preuve à l'appui) · **ÉCHEC** · **NON TESTÉ** · **BLOQUÉ** · **HORS PÉRIMÈTRE JUSTIFIÉ**.

Les preuves citées (`PREUVES/…`, `outils/…`) se trouvent dans `audit/recette-multiplateforme/2026-11-14/`. Ce dossier est local et non suivi par Git.

---

## A. Périmètre attendu et version examinée

### Périmètre

| Plateforme | Public | Source de la décision |
|---|---|---|
| Mobile (Android) | parents et enseignants du secondaire | cadrage du 14/11/2026 |
| Mobile (Android) | **professeurs et étudiants d'université** | décision de l'utilisateur du 16/11/2026, postérieure au cadrage |
| Desktop (Electron, Windows) | administration, selon les droits de chaque métier : directeur, comptable, secrétaire, censeur, surveillant, infirmier, bibliothécaire, administrateur d'école | cadrage |
| Web | tous les rôles, cohérent avec le mobile et le desktop | cadrage |

Exigences transversales :
- la proposition graphique C ;
- la pertinence de chaque information et de chaque texte affiché.

### Version examinée

- **Code** : `94ca571`, branche `chore/world-class-additions`, PR #6.
- **Mobile** : le code n'a pas changé depuis `758cbd0`. L'APK de recette est construit sur `758cbd0` (`PREUVES/android/version-758cbd0/apk.sha256`).

### Environnement d'essai

- **API** : Laravel, servie par `php artisan serve --port=8000` sur la **base de recette** `ecole_audit_20261114`, dans le conteneur Docker `ecole-e2e-mysql`.
  - SMS et courriels en mode « log » : aucun envoi réel.
  - Aucune transaction financière réelle.
- **Mobile** : émulateur Android 15 `ecole_recette_api35`, fenêtre visible, `adb reverse tcp:8000 tcp:8000`.
- **Desktop** : Electron sous Linux, fenêtre visible. Interface construite depuis le code, API de recette.
- **Web** : Chromium piloté par Playwright, fenêtre visible. Serveur de développement Vite sur le port 3002, relié à l'API de recette.

### Comptes fictifs

- Mots de passe de recette posés le 16 et le 17/11 sur 6 comptes de la base de recette (étudiant, professeur, élève, recteur, doyen, personnel), dans des fichiers privés :
  - `~/VMs/acces-universite.txt` (droits 600) ;
  - `~/VMs/acces-web.txt` (droits 600).
- Les autres comptes fictifs utilisent le mot de passe `password` de la base de recette.

### Verdict au 17/11/2026, 18 h 45

| Plateforme | Verdict | Pourquoi |
|---|---|---|
| **Mobile** | **NON VALIDÉ, proche** | Tous les parcours exercés sur l'appareil réussissent sur la version actuelle : 71 étapes sur 71, dont le hors-connexion, la reprise, les refus, le petit écran et l'université. Restent non testés sur l'appareil : le paiement FedaPay (version actuelle), l'import CSV, la messagerie universitaire, TalkBack. R-03 (parité avec le web) reste incomplète. |
| **Desktop** | **NON VALIDÉ** | Les 82 pages des 8 métiers s'ouvrent et 11 actions réelles sont prouvées. Mais la plupart des actions métier ne sont pas exercées, Windows n'est pas rejoué sur la version actuelle, et un plantage reste inexpliqué (D8). |
| **Web** | **NON VALIDÉ** | Les 79 pages des 8 rôles s'ouvrent, et la parité étudiant a progressé (relevé). Mais 32 boutons sans action restent (D1), les 634 scénarios d'actions ne sont pas testés, et le planning universitaire de l'étudiant manque (D2). |

Une suite de tests verte ne vaut pas validation : seules les lignes VALIDÉ de la partie B sont démontrées.

---

## B. Réalisé ET vérifié

Une ligne VALIDÉ signifie que le parcours a été **exécuté** sur la version indiquée, avec les vrais composants et l'API de recette.

### Mobile (APK `758cbd0`, émulateur visible, API de recette)

| Scénario | Résultat | Preuve |
|---|---|---|
| Écrans parent : accueil, scolarité (notes, absences, emploi du temps, bulletins), paiements, messages, compte. Écrans enseignant : semaine, classes, notes, évaluations, bulletins, messages. Mémoire stable. | **VALIDÉ** 19/19 | `PREUVES/android/version-758cbd0/ecrans/`, `outils/verif_ecrans.py` |
| Appel d'une classe, devoir publié, devoir lu par le parent, message avec pièce jointe parent → enseignant, ouverture de la pièce jointe | **VALIDÉ** 12/12 | `…/version-758cbd0/nouveautes/` |
| Hors connexion (enseignant), voir le détail ci-dessous | **VALIDÉ** 10/10 | `…/version-758cbd0/parcours9/`, `outils/verif_parcours9.py` |
| Université, boucle complète, voir le détail ci-dessous | **VALIDÉ** 14/14 | `…/version-758cbd0/universite/`, `outils/verif_universite.py` |
| Robustesse, voir le détail ci-dessous | **VALIDÉ** 16/16 | `…/version-758cbd0/robustesse/`, `outils/verif_robustesse.py` |
| Permissions de l'espace mobile : un parent qui ouvre l'espace enseignant est renvoyé vers le sien, un étudiant qui ouvre l'espace professeur aussi | **VALIDÉ** (tests Jest, pas sur appareil) | `Ecole_mobile/__tests__/perimetre-layout.test.jsx` |

Détail du parcours hors connexion de l'enseignant :
1. Il saisit une note en mode avion : elle reste en brouillon, et rien n'est annoncé comme enregistré.
2. Il relance l'application toujours sans réseau : la session est gardée.
3. Ses classes et sa grille s'ouvrent depuis le téléphone, avec l'avis « Hors connexion » daté.
4. Le brouillon est retrouvé.
5. Au retour du réseau, l'enregistrement est confirmé par le serveur.

Détail du parcours université :
1. Le professeur saisit une note hors connexion (brouillon gardé, rien d'annoncé), puis l'enregistre au retour du réseau.
2. Il publie un devoir.
3. L'étudiant voit la note dans son relevé.
4. L'étudiant rend le devoir.
5. Le professeur note la copie.
6. L'étudiant voit « Noté 17/20 ».

Détail du parcours de robustesse :
- formulaire vide ;
- mauvais mot de passe ;
- compte de secrétariat refusé, sans session reprise au relancement ;
- reprise après fermeture forcée ;
- démarrage hors connexion : solde et scolarité déjà vus affichés, avis daté **une seule fois**, aucune valeur inventée ;
- petit écran (720 × 1280) avec une police à 130 % : rien de coupé ;
- déconnexion, avec la connexion redemandée au relancement.

### Desktop (Electron, menu réel de chaque compte, API de recette)

| Scénario | Résultat | Preuve |
|---|---|---|
| Pour chaque compte d'administration, ouverture de **chaque lien du menu affiché**, par un vrai clic, sans refus de l'API (≥ 400), sans page d'erreur, sans page « non autorisé » et sans page vide. Comptes : directeur (double authentification), comptable (double authentification), secrétaire, censeur, surveillant, infirmier, bibliothécaire, administrateur d'école (double authentification). | **VALIDÉ** sur l'interface `788f81b` : 82 pages sur 82 | `PREUVES/desktop/version-788f81b/<rôle>/`, `outils/desktop_menu.mjs` |
| Même passage sur `8786377` | **VALIDÉ** 82/82 | `PREUVES/desktop/version-8786377/` |
| **Actions réelles** sur `94ca571` :<br>- comptable : « Nouveau paiement » ouvre l'échéancier, élèves listés avec leur nom, curseur dans la recherche ; « Factures » ouvre les factures ;<br>- directeur : « Factures » non proposé (page fermée), « Exporter » présent, aucune session inventée dans Paramètres ;<br>- surveillant : signale un incident fictif et le retrouve dans la liste | **VALIDÉ** 11/11 | `PREUVES/desktop/version-94ca571/actions/`, `outils/desktop_actions.mjs` |
| Page Notes : notes « 13/20 », types « Devoir 1 », état « Modifiable » ou « Verrouillée » écrit en mots, bouton « Verrouiller » | **VALIDÉ**, constaté sur capture | `PREUVES/desktop/version-788f81b/directeur/06-notes.png` |

### Web (Chromium visible, menu réel de chaque rôle, API de recette)

| Scénario | Résultat | Preuve |
|---|---|---|
| Ouverture de chaque lien du menu : parent, enseignant, élève, professeur, recteur, doyen, personnel | **VALIDÉ** sur `788f81b` : 11/11, 12/12, 10/10, 10/10, 10/10, 11/11, 8/8 | `PREUVES/web/version-788f81b/<rôle>/`, `outils/web_menu.mjs` |
| Étudiant, avec la nouvelle page « Mes notes » (relevé réel affiché) et le fil d'Ariane corrigé | **VALIDÉ** 7/7 | `PREUVES/web/version-courante/etudiant/` |
| Même passage pour les 8 rôles sur `8786377` | **VALIDÉ** 79/79 | `PREUVES/web/version-8786377/` |

### API et CI

| Élément | Résultat | Preuve |
|---|---|---|
| Suite Pest complète sur MySQL | **VALIDÉ** sur `c999989`, 16/11 : 972 tests | journal de session |
| CI de la PR #6 : 35 jobs (Pest sous SQLite et MySQL, mutation, recherche de secrets, Jest, Vitest, Playwright, APK, installateur Windows installé en silence) | **VALIDÉ** sur `89d65ad` : 35/35 | `gh pr checks 6` |
| CI sur `94ca571` | en cours à 18 h 45 (7 jobs réussis, 11 en attente) : à relire | `gh pr checks 6` |
| Relevé LMD de l'étudiant, calcul refait à la main sur l'API de recette | **VALIDÉ** | `PREUVES/universite/LISEZMOI.md` |
| Historique Git nettoyé (R-46) : 3 clés KkiaPay et `.env.bak` retirés, 0 commit les contenant, gitleaks avec la configuration du dépôt sans fuite, job `secrets` vert | **VALIDÉ** | `ANOMALIES.md` (R-46) |

---

## C. Réalisé mais pas encore vérifié

| Élément | Statut | Ce qui manque |
|---|---|---|
| **Actions métier du desktop** autres que celles validées en B : inscrire, encaisser jusqu'au reçu, établir une facture, saisir et verrouiller une note, sanctionner, prêter un livre, etc. | **NON TESTÉ** | Les pages s'ouvrent toutes ; 11 actions sont prouvées (B). Les autres sont à exercer métier par métier. |
| **Actions page par page du web** (matrice : 634 scénarios d'actions) | **NON TESTÉ** | Même raison. |
| Desktop sous **Windows 11** sur la version actuelle | **NON TESTÉ** | La dernière preuve dans la VM date d'une version antérieure au 16/11. La CI construit et installe l'installateur sur `windows-2022`, mais ne lance pas l'application. |
| Paiement FedaPay en bac à sable depuis le mobile | **NON TESTÉ** sur `758cbd0` | Prouvé sur une version antérieure (`PREUVES/android/paiement-6c6cc0a/`). À rejouer. |
| Import d'un tableur CSV de notes sur l'appareil | **NON TESTÉ** sur appareil | Couvert par Jest seulement. |
| Messagerie mobile du professeur et de l'étudiant | **NON TESTÉ** sur appareil | Même écran que celui des parents (validé), avec d'autres règles de contacts. |
| Lecteur d'écran (TalkBack) et navigation au clavier du web | **NON TESTÉ** | Libellés d'accessibilité vérifiés par les tests ; aucun essai réel. |
| Suite Pest complète après `3745e4b` (correctif des copies) | **NON TESTÉ** localement | Tests universitaires 41/41. Suite complète verte en CI sur `89d65ad`. |

---

## D. Ce qui échoue, manque ou reste incomplet

| # | Constat | Statut | Gravité |
|---|---|---|---|
| D1 | **32 boutons sans action restants**, sur les 44 trouvés par analyse du code. Les 12 des pages d'administration du desktop (Paiements, Surveillance, Absences, Paramètres, Messagerie) sont corrigés (`474797a`). Restent : Configuration, Écoles, Facturation, Modules et Plans (administration de la plateforme) ; tableau de bord et classes de l'enseignant (web) ; pages universitaires (Cours, Départements, Enseignants, Étudiants, Facultés, Mes cours, Notes, Planning, Tâches). La liste exacte est figée dans `src/__tests__/boutons-sans-action.test.jsx` (`RESTANTS`), qui interdit tout nouveau bouton sans action. | **ÉCHEC** | majeure : un bouton qui ne fait rien trompe l'utilisateur |
| D7 | Gestion des sessions des autres appareils : la carte affichait des sessions **inventées** ; elle est retirée, mais la fonction n'existe pas (ni l'API ni l'écran) | **ÉCHEC** (fonction manquante) | moyenne |
| D2 | Web étudiant : pas de planning universitaire (le mobile l'a) | **ÉCHEC** (manque de parité) | moyenne |
| D3 | Mobile : à l'arrivée de l'avis « Hors connexion », le contenu de l'écran descend d'environ 140 px. Un toucher en cours peut tomber sur l'élément d'en dessous (constaté pendant un parcours). | **ÉCHEC** | mineure |
| D4 | R-03 : parité du mobile pour les parents et les enseignants. Une partie des capacités du web n'a pas d'écran mobile (`MATRICE_FONCTIONNELLE.csv`). | **ÉCHEC** (incomplet) | majeure |
| D5 | Université : aucun verrouillage des notes après délibération, et compensation entre UE non calculée. C'est voulu (règle propre à chaque établissement), mais c'est un manque fonctionnel. | **ÉCHEC** (incomplet) | moyenne |
| D6 | Typographie : « 68% » au lieu de « 68 % » sur les statistiques | **ÉCHEC** | mineure |
| D8 | Desktop : l'application s'est arrêtée (signal SIGTRAP) après une longue série de connexions automatisées. Cause inconnue : fuite de mémoire de l'application ou plantage du moteur de rendu sous pilotage. Pas reproduite après relance. | **NON TESTÉ** (à reproduire : mesurer la mémoire sur une longue session) | à qualifier |

Corrigés pendant cette contre-vérification (17/11) et prouvés après correction :

| Défaut | Correction et preuve |
|---|---|
| Sans réseau, la connexion mobile affichait « Identifiants incorrects » | `4daf884` ; test rouge puis vert. Constaté sur l'émulateur. |
| Aucune donnée déjà vue n'était consultable hors connexion | `758cbd0` ; 4 tests rouges puis verts ; preuves sur appareil (robustesse et parcours 9) |
| Page Notes : « 13.00/20.00 », « Devoir1 », deux cadenas de sens contraires | `788f81b` ; tests ; capture desktop |
| Fil d'Ariane : 14 liens vers des pages fermées au rôle connecté | `988f86b` ; test sur tous les rôles et toutes les pages |
| Pas de relevé de l'étudiant sur le web | `8786377` ; tests ; navigateur réel |
| Libellé « 1/2 copies rendue » | `89d65ad` |
| Page Paiements : aucun nom d'élève affiché, recherche par élève inopérante, échéancier vide (« Aucun élève trouvé ») ; le comptable ne pouvait pas encaisser par ce chemin. Cause : désaccord entre le format de l'API et celui de l'écran, masqué par des données de test au même mauvais format. | `94ca571` ; test rouge puis vert ; desktop réel : élèves listés |
| Boutons « Factures », « Exporter », « Nouveau paiement », « Nouvel incident » inertes ; sessions inventées ; icônes d'appel et de visio sans fonction | `474797a` ; 6 tests sur 7 rouges sur les anciennes pages ; desktop réel 11/11 |

---

## E. Blocages et moyens de les lever

| Blocage | Ce qu'il faut | Qui |
|---|---|---|
| Clés KkiaPay retirées de l'historique, mais pas désactivées | Les régénérer dans le tableau de bord KkiaPay | utilisateur |
| `APP_KEY` présente dans l'ancien `.env.bak` | Si la production l'utilise : la changer en déclarant l'ancienne dans `APP_PREVIOUS_KEYS` (les secrets 2FA sont chiffrés avec elle) | utilisateur |
| Anciennes références des PR fermées n° 1 à 4 sur GitHub | Demander leur purge au support GitHub | utilisateur |
| Lot C : compte FedaPay de production avec Celtiis, fournisseur SMS, HTTPS et noms de domaine, **certificat de signature de code Windows**, mentions légales | Contrats et certificats | utilisateur |
| iOS | **HORS PÉRIMÈTRE JUSTIFIÉ** (décision du 14/11) | — |

Rien d'autre n'est bloqué : les points de C et D peuvent avancer sans intervention.

---

## F. Fichiers modifiés et décisions importantes

### Commits de la contre-vérification (17/11)

| Commit | Objet |
|---|---|
| `94ca571` | Web : nom de l'élève sur la page Paiements, échéancier utilisable (`PaiementsPage.jsx`, données de test au format réel de l'API) |
| `474797a` | Web et desktop : boutons reliés ou retirés sur 5 pages, sessions inventées retirées, garde-fou contre les boutons sans action |
| `8786377` | Web : relevé de l'étudiant (`MesNotesPage.jsx`, route, menu, fil d'Ariane, traductions) |
| `988f86b` | Web : fil d'Ariane limité aux pages que le rôle connecté peut ouvrir (`Breadcrumb.jsx`) |
| `788f81b` | Web : notes lisibles (`noteSur`, `libelleEvaluation` dans `utils.js` ; `NotesPage.jsx`, `EnfantsPage.jsx`) |
| `758cbd0` | Mobile : consultation hors connexion (`useRequete` et `Ecran` dans `commun.js` ; cache purgé à la déconnexion dans `secureStorage.js`) |
| `4daf884` | Mobile : message réseau à la place de « Identifiants incorrects » (`AuthContext.js`) |
| `89d65ad` | Mobile : accord « 1 copie rendue sur 2 » |

### Commits du 16/11

| Commit | Objet |
|---|---|
| `3745e4b` | API : liste des copies d'un devoir (`DevoirController.php`) |
| `2be600a` | Mobile : espaces professeur et étudiant (`UniversiteEspace.js`, routes `professeur` et `etudiant`) |
| `c999989` | API : relevé LMD, notes bornées au professeur, grille et envoi par lot (`ReleveLmd.php`, `MesNotesController.php`, `NoteController.php`, `config/universite.php`) |
| `618353d` | API : dates portables entre bases (`App\Support\Sql`) |
| `891666a`, `9207c93`, `06e7578` | CI de la PR #6 |

Outils de recette, hors du dépôt :
- `verif_robustesse.py` ;
- `verif_universite.py` ;
- `desktop_menu.mjs` ;
- `web_menu.mjs` ;
- corrections de `verif_parcours9.py`.

### Décisions

- **Université sur le mobile** (utilisateur, 16/11) : professeur et étudiant.
- **Règles LMD** :
  - UE validée à 10/20 ;
  - moyenne du semestre pondérée par les crédits ;
  - part de l'examen à 60 %, réglable par `UNIVERSITE_POIDS_EXAMEN`, faute de règlement de l'UAC vérifié ;
  - relevé affiché « provisoire », la compensation relevant du jury.
- **Consultation hors connexion** :
  - la dernière réponse de chaque lecture est gardée sur le téléphone ;
  - elle est affichée seulement en l'absence totale de réponse du serveur, jamais après un refus ;
  - un avis daté s'affiche une seule fois par écran ;
  - tout est effacé à la déconnexion ;
  - les réponses de plus de 300 ko ne sont pas gardées.
- **Historique Git réécrit** (utilisateur, 16/11). Sauvegarde : `~/sauvegardes-ecole/ecole-avant-r46-20261116.bundle`. Tous les identifiants de commits antérieurs au 16/11 à 22 h ont changé.

---

## G. Tests exécutés, résultats et limites

| Commande / parcours | Version | Résultat | Limites |
|---|---|---|---|
| `npx -p node@20 jest` (mobile) | `758cbd0` | 135/135 | API simulée |
| `npx vitest run --no-file-parallelism` (web) | `94ca571` | 852/852 | API simulée |
| `pest tests/Feature/Api/University*Test.php` (MySQL) | `3745e4b` | 41/41 | — |
| `outils/verif_ecrans.py`, `verif_nouveautes.py`, `verif_parcours9.py`, `verif_universite.py`, `verif_robustesse.py` (émulateur visible) | APK `758cbd0` | 19/19 · 12/12 · 10/10 · 14/14 · 16/16 | API de recette ; un seul appareil (Android 15) |
| `outils/desktop_menu.mjs` × 8 comptes | `788f81b` | 82/82 pages | ouverture des pages seulement, pas les actions ; Linux, pas Windows |
| `outils/web_menu.mjs` × 8 rôles | `788f81b` (étudiant : `8786377`) | 79/80 → corrigé (fil d'Ariane), 7/7 | ouverture des pages seulement |
| Passages desktop et web sur `8786377` | `8786377` | desktop 82/82, web 79/79 | ouverture des pages seulement |
| `outils/desktop_actions.mjs` (desktop visible) | `94ca571` | 11/11 (10/11 sur `474797a` : curseur, puis échéancier vide découvert sur capture) | 3 métiers sur 8 |
| Analyse des boutons sans action (garde-fou Vitest) | `94ca571` | 44 trouvés, 12 corrigés, 32 restants listés | détecte les `<Button>` sans action, pas les autres éléments cliquables |
| Plantage d'Electron (SIGTRAP) après environ 20 connexions et 160 pages enchaînées | `474797a` | **non expliqué** ; pas reproduit après relance | voir D8 |

**Ce que les tests ne prouvent pas** :
- les actions métier du web et du desktop ;
- Windows sur la version actuelle ;
- les lecteurs d'écran ;
- d'autres appareils Android ;
- la charge.

**Erreurs de mes scripts**, corrigées et sans rapport avec l'application : notes déjà enregistrées par un passage précédent, champ non vidé, menu « Plus » non ouvert, toucher pendant un décalage d'écran. Chacune a été vérifiée sur capture avant d'être classée ainsi.

---

## H. Prochaine action concrète

1. **Relire la CI** de la PR #6 sur `94ca571` (`gh pr checks 6`) : elle était en cours à 18 h 45.
2. **D1, les 32 boutons restants**, page par page.
   - Le garde-fou `boutons-sans-action.test.jsx` en donne la liste exacte (`RESTANTS`), et chaque bouton corrigé doit en sortir.
   - Commencer par le tableau de bord et les classes de l'enseignant (web), puis les pages universitaires, puis l'administration de la plateforme.
   - Relier chaque bouton à la fonction existante ; sinon, retirer le contrôle qui promet une fonction absente, et le consigner.
3. **Actions par métier sur le desktop**, en prolongeant `outils/desktop_actions.mjs` :
   - secrétaire : inscrire un élève ;
   - comptable : encaisser une échéance jusqu'au reçu ;
   - directeur : verrouiller une note ;
   - censeur : sanctionner ;
   - bibliothécaire : prêter un livre ;
   - infirmier : ouvrir un dossier de soins.
4. **D8** : reproduire ou écarter le plantage d'Electron, en mesurant la mémoire sur une longue session.
5. Rejouer le desktop sous **Windows 11**, dans la VM (`~/VMs/lancer-win11.sh`), et le paiement FedaPay en bac à sable sur le mobile.

### Pour reprendre

- **Processus laissés actifs** :
  - API sur le port 8000 (base de recette) ;
  - serveur web Vite sur le port 3002 ;
  - application desktop Electron (port de débogage 9223) ;
  - émulateur Android ;
  - conteneur `ecole-e2e-mysql`.
- **Pour les relancer** :
  - si tous les tests échouent en « Connection refused », lancer `docker start ecole-e2e-mysql` ;
  - API : commande en A ;
  - Electron : `env -u ELECTRON_RUN_AS_NODE ECOLE_API_URL=http://127.0.0.1:8000/api npx electron . --remote-debugging-port=9223`, depuis `~/build-ecole-desktop/Ecole/Ecole_desktop` ;
  - APK : `git archive HEAD Ecole/Ecole_mobile/src Ecole/Ecole_mobile/app | tar -x -C ~/build-ecole-mobile`, puis `./gradlew assembleRelease`.
