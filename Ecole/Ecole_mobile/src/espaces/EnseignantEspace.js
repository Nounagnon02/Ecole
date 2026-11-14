/**
 * Espace enseignant du mobile — parité avec le web (mission du 14/11/2026).
 *
 * Web enseignant : tableau de bord, classes, élèves, notes, saisie en grille,
 * bulletins, annonces, emploi du temps, messagerie, paramètres. L'API borne
 * l'enseignant à ses affectations et refuse les notes verrouillées ; la
 * grille l'affiche (note verrouillée en lecture seule). Un brouillon reste sur
 * le téléphone tant que l'API n'a pas confirmé l'enregistrement, et l'état
 * « en attente » est distinct de « enregistré ».
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { api } from '../services/api';
import { getBrouillon, listeBrouillons, setBrouillon } from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { fonts } from '../theme/typography';
import { Bouton, Carte, Ecran, Etat, Segments, Texte, dateFr, liste, messageErreur, sur20, useRequete } from './commun';
import { Messages } from './ParentEspace';

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

/* ─── Classes et élèves ────────────────────────────────────────────────── */
function Classes() {
  const classes = useRequete('/enseignant/classes');
  const [ouverte, setOuverte] = useState(null);
  const liste_ = liste(classes.donnees);
  if (ouverte) {
    return (
      <Ecran titre={ouverte.nom_classe} sousTitre={`${(ouverte.eleves ?? []).length} élève(s)`}>
        <Bouton titre="← Mes classes" variante="secondaire" onPress={() => setOuverte(null)} />
        <Etat requete={{ chargement: false, erreur: null }} estVide={(ouverte.eleves ?? []).length === 0} vide="Aucun élève inscrit dans cette classe." />
        {(ouverte.eleves ?? []).map((e) => (
          <Carte key={e.id}><Texte>{nom(e)}</Texte><Texte variante="discret">Matricule {e.numero_matricule ?? e.matricule ?? '—'}</Texte></Carte>
        ))}
      </Ecran>
    );
  }
  return (
    <Ecran titre="Mes classes" onActualiser={classes.recharger}>
      <Etat requete={classes} estVide={liste_.length === 0} vide="Aucune classe ne vous est affectée. La direction fait les affectations." />
      {liste_.map((c) => (
        <Carte key={c.id} onPress={() => setOuverte(c)} accessibilityLabel={`Voir les élèves de ${c.nom_classe}`}>
          <Texte variante="sousTitre">{c.nom_classe}</Texte>
          <Texte variante="discret">{(c.eleves ?? []).length} élève(s) · {c.categorie_classe ?? ''}</Texte>
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Saisie des notes en grille, avec brouillon ───────────────────────── */
export function Notes() {
  const classes = useRequete('/enseignant/classes');
  const [ev, setEv] = useState({ classe: null, matiere: null, type: TYPES[0], periode: PERIODES[0], date: aujourdhui() });
  const params = ev.classe && `?${new URLSearchParams({ type_evaluation: ev.type, periode: ev.periode, date_evaluation: ev.date, ...(ev.matiere ? { matiere_id: String(ev.matiere) } : {}) })}`;
  const grilleReq = useRequete(ev.classe ? `/notes/grille/${ev.classe}${params}` : null);
  const grille = grilleReq.donnees?.data;
  const eleves = useMemo(() => grille?.eleves ?? [], [grille]);
  const matieres = grille?.matieres ?? [];
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

  const listeClasses = liste(classes.donnees);
  return (
    <Ecran titre="Saisie des notes">
      <Etat requete={classes} estVide={listeClasses.length === 0} vide="Aucune classe ne vous est affectée." />
      <Texte variante="sousTitre">Classe</Texte>
      <Segments valeur={ev.classe} onChange={(v) => setEv((e) => ({ ...e, classe: v, matiere: null }))} options={listeClasses.map((c) => ({ valeur: c.id, libelle: c.nom_classe }))} />
      {ev.classe && <>
        <Texte variante="sousTitre">Matière</Texte>
        <Segments valeur={ev.matiere} onChange={(v) => setEv((e) => ({ ...e, matiere: v }))} options={matieres.map((m) => ({ valeur: m.id, libelle: `${m.nom} (coef. ${m.coefficient ?? '—'})` }))} />
        <Texte variante="sousTitre">Évaluation</Texte>
        <Segments valeur={ev.type} onChange={(v) => setEv((e) => ({ ...e, type: v }))} options={TYPES.map((t) => ({ valeur: t, libelle: t }))} />
        <Segments valeur={ev.periode} onChange={(v) => setEv((e) => ({ ...e, periode: v }))} options={PERIODES.map((p) => ({ valeur: p, libelle: p }))} />
        {ev.type === 'Interrogation' && (
          <TextInput accessibilityLabel="Date de l’interrogation (AAAA-MM-JJ)" value={ev.date} onChangeText={(v) => setEv((e) => ({ ...e, date: v }))}
            style={{ minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: fonts.body }} />
        )}
      </>}
      {ev.classe && ev.matiere && <>
        <Etat requete={grilleReq} estVide={eleves.length === 0} vide="Aucun élève dans cette classe." />
        {eleves.map((e) => {
          const verrouillee = !!enregistrees[e.id]?.locked;
          const invalide = Number.isNaN(lireNote(saisies[e.id]));
          return (
            <Carte key={e.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Texte>{nom(e)}</Texte>
                <Texte variante="discret">{verrouillee ? 'Note verrouillée (bulletin arrêté)' : invalide ? 'Note entre 0 et 20' : enregistrees[e.id] ? `Enregistrée : ${sur20(enregistrees[e.id].note)}` : ' '}</Texte>
              </View>
              <TextInput accessibilityLabel={`Note de ${nom(e)}`} editable={!verrouillee} keyboardType="decimal-pad" value={saisies[e.id] ?? ''}
                onChangeText={(v) => saisir(e.id, v)}
                style={{ width: 80, minHeight: 44, borderWidth: invalide ? 2 : 1, borderRadius: 10, textAlign: 'center', fontFamily: fonts.semibold, opacity: verrouillee ? 0.5 : 1 }} />
            </Carte>
          );
        })}
        {message ? <Carte><Texte accessibilityRole="alert">{etat === 'attente' ? '⏳ ' : etat === 'enregistre' ? '✓ ' : ''}{message}</Texte></Carte> : null}
        <Bouton titre={`Enregistrer ${aEnvoyer.length} note(s)`} chargement={etat === 'envoi'} desactive={invalides.length > 0 || aEnvoyer.length === 0} onPress={enregistrer} />
      </>}
    </Ecran>
  );
}

/* ─── Bulletins de la classe (consultation) ────────────────────────────── */
function Bulletins() {
  const classes = useRequete('/enseignant/classes');
  const [classe, setClasse] = useState(null);
  const [periode, setPeriode] = useState(PERIODES[0]);
  const req = useRequete(classe ? `/bulletins?${new URLSearchParams({ classe_id: String(classe), periode })}` : null);
  return (
    <Ecran titre="Bulletins">
      <Segments valeur={classe} onChange={setClasse} options={liste(classes.donnees).map((c) => ({ valeur: c.id, libelle: c.nom_classe }))} />
      <Segments valeur={periode} onChange={setPeriode} options={PERIODES.map((p) => ({ valeur: p, libelle: p }))} />
      {classe && <>
        <Etat requete={req} estVide={liste(req.donnees).length === 0} vide="Aucun bulletin arrêté pour cette classe et cette période." />
        {liste(req.donnees).map((b) => (
          <Carte key={b.id}>
            <Texte variante="sousTitre">{b.eleve?.nom ? nom(b.eleve) : `Élève ${b.eleve_id}`}</Texte>
            <Texte>Moyenne : {sur20(b.moyenne_generale)} · Rang : {b.rang ? `${b.rang}/${b.total_eleves ?? '—'}` : '—'}{b.mention ? ` · ${b.mention}` : ''}</Texte>
          </Carte>
        ))}
      </>}
    </Ecran>
  );
}

/* ─── Emploi du temps et annonces ──────────────────────────────────────── */
function Semaine() {
  const edt = useRequete('/emploi-du-temps');
  const annonces = useRequete('/communications');
  const cours = liste(edt.donnees);
  const parJour = JOURS.map((j) => ({ jour: j, cours: cours.filter((c) => String(c.jour).toLowerCase() === j) })).filter((j) => j.cours.length);
  return (
    <Ecran titre="Ma semaine" onActualiser={() => { edt.recharger(); annonces.recharger(); }}>
      <Etat requete={edt} estVide={parJour.length === 0} vide="Aucun cours planifié." />
      {parJour.map(({ jour, cours: c }) => (
        <Carte key={jour}>
          <Texte variante="sousTitre">{jour.charAt(0).toUpperCase() + jour.slice(1)}</Texte>
          {c.sort((x, y) => String(x.heure_debut).localeCompare(String(y.heure_debut))).map((x) => (
            <Texte key={x.id}>{String(x.heure_debut).slice(0, 5)}–{String(x.heure_fin).slice(0, 5)} · {x.classe?.nom_classe ?? ''} · {x.matiere?.nom ?? ''}{x.salle ? ` · salle ${x.salle}` : ''}</Texte>
          ))}
        </Carte>
      ))}
      <Texte variante="sousTitre" accessibilityRole="header">Annonces</Texte>
      <Etat requete={annonces} estVide={liste(annonces.donnees).length === 0} vide="Aucune annonce." />
      {liste(annonces.donnees).map((a) => (
        <Carte key={a.id}><Texte variante="sousTitre">{a.titre}</Texte><Texte variante="discret">{dateFr(a.created_at)}</Texte><Texte>{a.contenu}</Texte></Carte>
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

export function Compte() {
  const { user, logout } = useAuth();
  const [mdp, setMdp] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [envoi, setEnvoi] = useState(false);

  const deconnecter = () => confirmerDeconnexion(logout);

  const changerMdp = async () => {
    if (mdp.password.length < 8 || mdp.password !== mdp.password_confirmation) {
      Alert.alert('Mot de passe', 'Le nouveau mot de passe doit compter au moins 8 caractères et être confirmé à l’identique.');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/auth/change-password', mdp);
      setMdp({ current_password: '', password: '', password_confirmation: '' });
      Alert.alert('Mot de passe', 'Votre mot de passe a été changé.');
    } catch (err) {
      Alert.alert('Mot de passe', messageErreur(err, 'Le mot de passe n’a pas été changé.'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Ecran titre="Mon compte" sousTitre={[user?.prenom, user?.name ?? user?.nom].filter(Boolean).join(' ')}>
      {[['current_password', 'Mot de passe actuel'], ['password', 'Nouveau mot de passe'], ['password_confirmation', 'Confirmer le nouveau mot de passe']].map(([c, l]) => (
        <TextInput key={c} accessibilityLabel={l} placeholder={l} secureTextEntry value={mdp[c]} onChangeText={(v) => setMdp((m) => ({ ...m, [c]: v }))}
          style={{ minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: fonts.body }} />
      ))}
      <Bouton titre="Changer le mot de passe" chargement={envoi} onPress={changerMdp} />
      <View style={{ height: 12 }} />
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={deconnecter} />
    </Ecran>
  );
}

export default function EnseignantEspace() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { backgroundColor: colors.surfaceRaised, borderTopColor: colors.border, minHeight: 56 },
      tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
      tabBarIcon: () => null,
    }}>
      <Tab.Screen name="Classes" component={Classes} />
      <Tab.Screen name="Notes" component={Notes} />
      <Tab.Screen name="Bulletins" component={Bulletins} />
      <Tab.Screen name="Semaine" component={Semaine} />
      <Tab.Screen name="Messages" component={Messages} />
      <Tab.Screen name="Compte" component={Compte} />
    </Tab.Navigator>
  );
}
