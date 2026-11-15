/**
 * Espace enseignant du mobile — parité avec le web (mission du 14/11/2026).
 *
 * Web enseignant : tableau de bord, classes, élèves, notes, saisie en grille,
 * bulletins, annonces, emploi du temps, messagerie, paramètres. L'API borne
 * l'enseignant à ses affectations et refuse les notes verrouillées ; la
 * grille l'affiche (note verrouillée en lecture seule). Un brouillon reste sur
 * le téléphone tant que l'API n'a pas confirmé l'enregistrement, et l'état
 * « en attente » est distinct de « enregistré ».
 *
 * Présentation (maquettes validées le 15/11/2026) : cinq onglets à icônes
 * (Semaine, Classes, Notes, Bulletins, Messages) ; le compte s'ouvre par la
 * pastille d'initiales de l'en-tête.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { lireTableurNotes } from './importNotes';
import { api } from '../services/api';
import { getBrouillon, listeBrouillons, setBrouillon } from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../theme/typography';
import {
  BarreOnglets, Bouton, Carte, Champ, Choix, Ecran, EspaceContexte, Etat, Liste, Pastille, Pile, Rang, SANS_ONGLET, Segments, Texte,
  dateFr, initiales, liste, messageErreur, onglet, sur20, useRequete, useTeintes,
} from './commun';
import { ChangerMotDePasse, Jour, Messages, nomCompte } from './ParentEspace';
import { Icone } from './Icone';

const Tab = createBottomTabNavigator();
export const TYPES = ['Devoir1', 'Devoir2', 'Interrogation', '1ère evaluation', '2ème evaluation', '3ème evaluation', '4ème evaluation', '5ème evaluation', '6ème evaluation'];
export const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** « 12,5 » → 12.5 ; vide → null ; hors 0–20 ou illisible → NaN (même règle que le web). */
export function lireNote(saisie) {
  const texte = String(saisie ?? '').trim().replace(',', '.');
  if (texte === '') return null;
  const v = Number(texte);
  return Number.isFinite(v) && v >= 0 && v <= 20 ? v : NaN;
}

function aujourdhui() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Porto-Novo', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

const nom = (e) => [e?.nom ?? e?.user?.name, e?.prenom ?? e?.user?.prenom].filter(Boolean).join(' ') || `Élève ${e?.id}`;
const effectif = (n) => `${n} élève${n > 1 ? 's' : ''}`;

/* ─── Classes et élèves ────────────────────────────────────────────────── */
function Classes() {
  const classes = useRequete('/enseignant/classes');
  const t = useTeintes();
  const [ouverte, setOuverte] = useState(null);
  const liste_ = liste(classes.donnees);
  if (ouverte) {
    const eleves = ouverte.eleves ?? [];
    return (
      <Ecran titre={ouverte.nom_classe} sousTitre={effectif(eleves.length)} onRetour={() => setOuverte(null)} retourLabel="Retour à mes classes">
        <Etat requete={{ chargement: false, erreur: null }} estVide={eleves.length === 0} vide="Aucun élève inscrit dans cette classe." />
        <Liste>
          {eleves.map((e) => (
            <Rang key={e.id} hauteur={56}>
              <Pastille nom={nom(e)} taille={36} />
              <Texte style={{ flex: 1, fontFamily: fonts.medium }}>{nom(e)}</Texte>
              <Texte variante="discret">{e.numero_matricule ?? e.matricule ?? '—'}</Texte>
            </Rang>
          ))}
        </Liste>
      </Ecran>
    );
  }
  return (
    <Ecran titre="Mes classes" onActualiser={classes.recharger}>
      <Etat requete={classes} estVide={liste_.length === 0} vide="Aucune classe ne vous est affectée. La direction fait les affectations." />
      {liste_.map((c) => (
        <Carte key={c.id} onPress={() => setOuverte(c)} accessibilityLabel={`Voir les élèves de ${c.nom_classe}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texte variante="sousTitre" style={{ fontSize: 17 }}>{c.nom_classe}</Texte>
            <Texte variante="discret">{[effectif((c.eleves ?? []).length), c.categorie_classe].filter(Boolean).join(' · ')}</Texte>
          </View>
          <Icone nom="suivant" couleur={t.colors.accent} />
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Saisie des notes en grille, avec brouillon ───────────────────────── */
export function Notes() {
  const classes = useRequete('/enseignant/classes');
  const t = useTeintes();
  const [ev, setEv] = useState({ classe: null, matiere: null, type: TYPES[0], periode: PERIODES[0], date: aujourdhui() });
  const params = ev.classe && `?${new URLSearchParams({ type_evaluation: ev.type, periode: ev.periode, date_evaluation: ev.date, ...(ev.matiere ? { matiere_id: String(ev.matiere) } : {}) })}`;
  const grilleReq = useRequete(ev.classe ? `/notes/grille/${ev.classe}${params}` : null);
  const grille = grilleReq.donnees?.data;
  const eleves = useMemo(() => grille?.eleves ?? [], [grille]);
  const matieres = useMemo(() => grille?.matieres ?? [], [grille]);
  const enregistrees = useMemo(() => Object.fromEntries((grille?.notes ?? []).map((n) => [n.eleve_id, n])), [grille]);
  const cle = ev.classe && ev.matiere ? `${ev.classe}:${ev.matiere}:${ev.type}:${ev.periode}:${ev.type === 'Interrogation' ? ev.date : ''}` : null;
  const [saisies, setSaisies] = useState({});
  const [etat, setEtat] = useState('repos'); // repos | envoi | enregistre | attente | erreur
  const [message, setMessage] = useState(null);

  useEffect(() => { if (!ev.matiere && matieres.length === 1) setEv((e) => ({ ...e, matiere: matieres[0].id })); }, [matieres, ev.matiere]);
  useEffect(() => {
    let actif = true;
    (async () => {
      if (!cle) return;
      const brouillon = await getBrouillon(cle);
      const base = Object.fromEntries(Object.values(enregistrees).map((n) => [n.eleve_id, String(n.note).replace('.', ',')]));
      if (actif) { setSaisies({ ...base, ...(brouillon ?? {}) }); setEtat(brouillon ? 'attente' : 'repos'); setMessage(brouillon ? 'Brouillon non enregistré retrouvé sur ce téléphone.' : null); }
    })();
    return () => { actif = false; };
  }, [cle, enregistrees]);

  const saisir = (id, valeur) => {
    const suivant = { ...saisies, [id]: valeur };
    setSaisies(suivant);
    if (cle) setBrouillon(cle, suivant).catch(() => {});
  };

  const invalides = eleves.filter((e) => Number.isNaN(lireNote(saisies[e.id])));
  const aEnvoyer = eleves.filter((e) => !enregistrees[e.id]?.locked)
    .map((e) => ({ eleve_id: e.id, note: lireNote(saisies[e.id]) })).filter((n) => n.note !== null && !Number.isNaN(n.note));

  const enregistrer = useCallback(async () => {
    if (invalides.length || aEnvoyer.length === 0) return;
    setEtat('envoi'); setMessage(null);
    try {
      const { data } = await api.post('/notes/bulk', {
        classe_id: Number(ev.classe), matiere_id: Number(ev.matiere), type_evaluation: ev.type, periode: ev.periode, date_evaluation: ev.date, notes: aEnvoyer,
      });
      await setBrouillon(cle, null);
      setEtat('enregistre');
      setMessage(data?.warnings?.length ? data.warnings.join(' ') : `${aEnvoyer.length} note(s) enregistrée(s).`);
      grilleReq.recharger();
    } catch (err) {
      // Sans réponse du serveur : le brouillon reste, rien n'est annoncé enregistré.
      setEtat(err?.response ? 'erreur' : 'attente');
      setMessage(err?.response ? messageErreur(err, 'Les notes n’ont pas été enregistrées.') : 'Hors connexion : notes gardées sur le téléphone, non enregistrées. Réessayez au retour du réseau.');
    }
  }, [invalides.length, aEnvoyer, ev, cle, grilleReq]);

  /** Import d'un tableur CSV (mêmes règles que le web) : remplit la grille, n'envoie rien. */
  const importer = async () => {
    try {
      const choix = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
      if (choix.canceled || !choix.assets?.[0]) return;
      const texte = await FileSystem.readAsStringAsync(choix.assets[0].uri);
      const r = lireTableurNotes(texte, eleves, lireNote);
      if (r.erreurs.some((e) => e.message === 'colonnes')) {
        setEtat('erreur');
        setMessage('Le fichier doit avoir une colonne « matricule » et une colonne « note ».');
        return;
      }
      // Une note verrouillée (bulletin arrêté) n'est pas remplacée par l'import.
      const lues = Object.fromEntries(Object.entries(r.saisies).filter(([id]) => !enregistrees[id]?.locked));
      const suivant = { ...saisies, ...lues };
      setSaisies(suivant);
      if (cle) await setBrouillon(cle, suivant);
      setEtat('attente');
      setMessage(`${Object.keys(lues).length} note(s) lue(s) · ${r.erreurs.length} ligne(s) ignorée(s). Vérifiez, puis enregistrez.`);
    } catch {
      Alert.alert('Import', 'Le fichier n’a pas pu être lu.');
    }
  };

  const listeClasses = liste(classes.donnees);
  const classe = listeClasses.find((c) => c.id === ev.classe);
  const couleurMessage = { erreur: t.colors.error, enregistre: t.colors.success, attente: t.colors.amber }[etat] ?? t.colors.textSecondary;
  return (
    <Ecran titre="Saisie des notes" sur={classe ? `${classe.nom_classe}${eleves.length ? ` · ${effectif(eleves.length)}` : ''}` : undefined}>
      <Etat requete={classes} estVide={listeClasses.length === 0} vide="Aucune classe ne vous est affectée." />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Choix libelle="Classe" valeur={ev.classe} onChange={(v) => setEv((e) => ({ ...e, classe: v, matiere: null }))}
            options={listeClasses.map((c) => ({ valeur: c.id, libelle: c.nom_classe }))} />
          <Choix libelle="Matière" valeur={ev.matiere} onChange={(v) => setEv((e) => ({ ...e, matiere: v }))} vide={ev.classe ? 'à choisir' : 'classe d’abord'}
            options={matieres.map((m) => ({ valeur: m.id, libelle: `${m.nom} (coef. ${m.coefficient ?? '—'})` }))} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Choix libelle="Évaluation" valeur={ev.type} onChange={(v) => setEv((e) => ({ ...e, type: v }))} options={TYPES.map((x) => ({ valeur: x, libelle: x }))} />
          <Choix libelle="Période" valeur={ev.periode} onChange={(v) => setEv((e) => ({ ...e, periode: v }))} options={PERIODES.map((p) => ({ valeur: p, libelle: p }))} />
        </View>
        {ev.type === 'Interrogation' && (
          <Champ libelle="Date de l’interrogation (AAAA-MM-JJ)" etiquette value={ev.date} onChangeText={(v) => setEv((e) => ({ ...e, date: v }))} />
        )}
      </View>
      {ev.classe && ev.matiere && <>
        <Etat requete={grilleReq} estVide={eleves.length === 0} vide="Aucun élève dans cette classe." />
        <Liste>
          {eleves.map((e) => {
            const verrouillee = !!enregistrees[e.id]?.locked;
            const invalide = Number.isNaN(lireNote(saisies[e.id]));
            const detail = verrouillee ? 'Note verrouillée (bulletin arrêté)' : invalide ? 'Note entre 0 et 20' : enregistrees[e.id] ? `Enregistrée : ${sur20(enregistrees[e.id].note)}` : undefined;
            return (
              <Rang key={e.id} hauteur={58}>
                <Pile titre={nom(e)} detail={detail} alerte={invalide} />
                <TextInput accessibilityLabel={`Note de ${nom(e)}`} editable={!verrouillee} keyboardType="decimal-pad" value={saisies[e.id] ?? ''}
                  onChangeText={(v) => saisir(e.id, v)}
                  style={{ width: 76, minHeight: 44, borderWidth: invalide ? 2 : 1, borderColor: invalide ? t.colors.error : t.colors.border, borderRadius: 10,
                    backgroundColor: t.colors.surface, color: invalide ? t.colors.error : t.colors.textPrimary, textAlign: 'center',
                    fontFamily: fonts.semibold, fontSize: 17, opacity: verrouillee ? 0.5 : 1 }} />
              </Rang>
            );
          })}
        </Liste>
        {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: couleurMessage }}>{message}</Texte> : null}
        {invalides.length ? <Texte variante="discret" style={{ color: t.colors.error }}>Corrigez les notes hors de 0 à 20 pour pouvoir enregistrer.</Texte> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Bouton titre="Importer (CSV)" accessibilityLabel="Importer un tableur (CSV)" variante="secondaire" onPress={importer} style={{ flex: 1 }} />
          <Bouton titre={`Enregistrer ${aEnvoyer.length} note(s)`} chargement={etat === 'envoi'} desactive={invalides.length > 0 || aEnvoyer.length === 0}
            onPress={enregistrer} style={{ flex: 1.3 }} />
        </View>
      </>}
    </Ecran>
  );
}

/* ─── Bulletins de la classe (consultation) ────────────────────────────── */
function Bulletins() {
  const classes = useRequete('/enseignant/classes');
  const listeClasses = liste(classes.donnees);
  const [choisie, setClasse] = useState(null);
  const classe = choisie ?? listeClasses[0]?.id ?? null;
  const [periode, setPeriode] = useState(PERIODES[0]);
  const req = useRequete(classe ? `/bulletins?${new URLSearchParams({ classe_id: String(classe), periode })}` : null);
  const bulletins = [...liste(req.donnees)].sort((a, b) => (a.rang ?? Infinity) - (b.rang ?? Infinity));
  return (
    <Ecran titre="Bulletins" puces={{ options: listeClasses.map((c) => ({ valeur: c.id, libelle: c.nom_classe })), valeur: classe, onChange: setClasse }}
      sousTitre={listeClasses.length === 1 ? listeClasses[0].nom_classe : undefined}>
      <Etat requete={classes} estVide={listeClasses.length === 0} vide="Aucune classe ne vous est affectée." />
      <Segments valeur={periode} onChange={setPeriode} options={PERIODES.map((p) => ({ valeur: p, libelle: p }))} />
      {classe && <>
        <Etat requete={req} estVide={bulletins.length === 0} vide="Aucun bulletin arrêté pour cette classe et cette période." />
        <Liste>
          {bulletins.map((b) => (
            <Rang key={b.id} hauteur={62}>
              <Pile titre={b.eleve?.nom ? nom(b.eleve) : `Élève ${b.eleve_id}`}
                detail={[b.rang ? `Rang ${b.rang}/${b.total_eleves ?? '—'}` : 'Rang —', b.mention].filter(Boolean).join(' · ')} />
              <Texte variante="titre" style={{ fontSize: 18 }}>{sur20(b.moyenne_generale)}</Texte>
            </Rang>
          ))}
        </Liste>
      </>}
    </Ecran>
  );
}

/* ─── Emploi du temps et annonces ──────────────────────────────────────── */
function Semaine() {
  const { user } = useAuth();
  const edt = useRequete('/emploi-du-temps');
  const annonces = useRequete('/communications');
  const cours = liste(edt.donnees);
  const parJour = JOURS.map((j) => ({ jour: j, cours: cours.filter((c) => String(c.jour).toLowerCase() === j) })).filter((j) => j.cours.length);
  return (
    <Ecran titre="Ma semaine" sur={nomCompte(user) ? `Bonjour, ${nomCompte(user)}` : undefined} onActualiser={() => { edt.recharger(); annonces.recharger(); }}>
      <Etat requete={edt} estVide={parJour.length === 0} vide="Aucun cours planifié." />
      {parJour.map(({ jour, cours: c }) => (
        <Jour key={jour} jour={jour} cours={c} intitule={(x) => [x.classe?.nom_classe, x.matiere?.nom].filter(Boolean).join(' · ') || 'Cours'} />
      ))}
      <Texte variante="sousTitre" accessibilityRole="header">Annonces</Texte>
      <Etat requete={annonces} estVide={liste(annonces.donnees).length === 0} vide="Aucune annonce." />
      {liste(annonces.donnees).map((a) => (
        <Carte key={a.id} style={{ gap: 4 }}>
          <Texte variante="fort">{a.titre}</Texte>
          <Texte variante="discret">{dateFr(a.created_at)}</Texte>
          <Texte>{a.contenu}</Texte>
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Compte : mot de passe, déconnexion prévenue ──────────────────────── */
/** Prévient avant d'effacer des notes non enregistrées (la déconnexion purge les brouillons). */
export async function confirmerDeconnexion(logout) {
  const enAttente = await listeBrouillons().catch(() => []);
  if (enAttente.length === 0) { logout(); return; }
  Alert.alert('Notes non enregistrées', `${enAttente.length} saisie(s) ne sont pas encore enregistrées et seront effacées de ce téléphone si vous vous déconnectez.`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Se déconnecter quand même', style: 'destructive', onPress: () => logout() },
  ]);
}

export function Compte({ navigation = undefined }) {
  const { user, logout } = useAuth();
  const t = useTeintes();
  const [enAttente, setEnAttente] = useState(0);
  useEffect(() => { listeBrouillons().then((l) => setEnAttente(l.length)).catch(() => {}); }, []);

  return (
    <Ecran titre="Mon compte" sousTitre={[nomCompte(user), 'enseignant'].filter(Boolean).join(' · ')} sansCompte
      onRetour={navigation ? () => navigation.navigate('Semaine') : undefined} retourLabel="Retour à ma semaine">
      <ChangerMotDePasse />
      {enAttente ? (
        <Carte ton="ocre" style={{ gap: 4, marginTop: 8 }}>
          <Texte variante="fort" style={{ fontSize: 14, color: t.colors.amber }}>{enAttente} saisie{enAttente > 1 ? 's' : ''} de notes non enregistrée{enAttente > 1 ? 's' : ''}</Texte>
          <Texte style={{ fontSize: 14 }}>Elles seront effacées de ce téléphone si vous vous déconnectez.</Texte>
        </Carte>
      ) : null}
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={() => confirmerDeconnexion(logout)} />
    </Ecran>
  );
}

export default function EnseignantEspace() {
  const { user } = useAuth();
  const espace = useMemo(() => ({ initiales: initiales(nomCompte(user)), compte: 'Compte' }), [user]);
  return (
    <EspaceContexte.Provider value={espace}>
      <Tab.Navigator tabBar={(p) => <BarreOnglets {...p} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Semaine" component={Semaine} options={onglet('calendrier')} />
        <Tab.Screen name="Classes" component={Classes} options={onglet('groupe')} />
        <Tab.Screen name="Notes" component={Notes} options={onglet('crayon')} />
        <Tab.Screen name="Bulletins" component={Bulletins} options={onglet('document')} />
        <Tab.Screen name="Messages" component={Messages} options={onglet('message')} />
        <Tab.Screen name="Compte" component={Compte} options={SANS_ONGLET} />
      </Tab.Navigator>
    </EspaceContexte.Provider>
  );
}
