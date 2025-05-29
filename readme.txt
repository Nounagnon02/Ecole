Nous avons été chargés de réaliser une application web de gestion d'examens et de délibération. 
Pour atteindre ce but, nous avons utilisé react pour le front-end et laravel pour le backend.
Voici comment marche notre application : 
Au Lancement, il y a une page de connexion dans laquelle l'utilisateur devra entrer ses informations (email, mot de passe), s'il n'a pas encore de compte, il devra en crérr un en cliquant sur le bouton s'inscrire qui lui renverra un formulaire dans lequel il pourra entrer ses différentes informations ( nom , email, role, et mot de passe ) . Il Pourra ensuite se connecter selon son rôle. 

-Connexion en tant qu'administrateur :

Une fois connecté, l'administrateur pourra effectuer les tâches suivantes : 

-Création de session : Il pourra créer une session, avec le nom de la session, les matières spécifiques à la session et le statut (Ouverte ou fermée ) 
-Consulter les informations disponibles par rapport à une session : L'administrateur peut voir les candidats inscrits dans la session spécifique, les notes de ces candidats dans les différentes matières de la session et leur moyenne coefficiée selon leur série (les coefficients sont déterminés et calculés directement dans notre backend laravel qui applique directement les coefficients pour calculer la moyenne).
-Ajouter des Notes aux candidats pour les différentes matières : Il pourra ajouter directement les notes spécifiques pour chaque candidat sans se préocupper de sa série et du coefficient

Par Ailleurs, il ne pourra ajouter les notes que si la session est ouverte, si elle est fermée, cette fonction est automatiquement désactivée.


-Connexion en tant qu'Ecole : 
Une fois connectée, l'école pourra effectuer les tâches suivantes : 
- Ajout de candidats et ajout de candidats à une session,
- Voir les informations relatives à chacune des sessions et voir les notes et moyennes de tous les candidats inscrits pour la session
Par Ailleurs, il ne pourra ajouter les candidats que si la session est ouverte, si elle est fermée, cette fonction est automatiquement désactivée.

-Connexion en tant qu'étudiant : 
Une fois connecté, l'étudiant pourra rechercher son relevé en inscrivant son numéro matricule, il pourra ensuite le télécharger en pdf au besoin

Pour notre base de données, nous avons utilisé les tables suivantes : 

Users : name, role, email, password
Candidats : nom, prenom, serie, numero_matricule, email
Matieres : nom
Moyennes : moyenne, candidats_id, sessions_id
notes : notes, candidats_id, matieres_id, sessions_id
Sessions : nom, statut, date_debut, date_fin

Par ailleurs, nous avons utilisé des tables pivots ( candidats_matieres, candidats_notes, sessions_moyennes, sessions_notes, candidats_sessions) pour les différentes relations entre les tables
