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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { lireTableurNotes } from './importNotes';
import { api } from '../services/api';
import { getBrouillon, listeBrouillons, setBrouillon } from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../theme/typography';
import {
  BarreEtat, Bouton, Carte, Champ, Choix, Ecran, EspaceContexte, Etat, Liste, Onglets, Pastille, Pile, Rang, Segments, Texte,
  dateFr, initiales, libelleEvaluation, liste, messageErreur, sur20, useRequete, useTeintes,
} from './commun';
import { ChangerMotDePasse, Jour, Messages, nomCompte } from './ParentEspace';
import { Icone } from './Icone';

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

/* ─── Appel d'une classe (décision du 16/11/2026) ──────────────────────── */
const STATUTS_APPEL = [{ valeur: 'present', libelle: 'Présent' }, { valeur: 'absent', libelle: 'Absent' }, { valeur: 'retard', libelle: 'Retard' }];

/**
 * Appel du jour : tous présents par défaut, l'enseignant marque les absents
 * et les retards. L'API ne crée qu'une absence par élève et par jour : un
 * second enregistrement corrige le premier. « Enregistré » n'est affiché
 * qu'après la réponse du serveur.
 */
export function AppelClasse({ classe, onRetour }) {
  const t = useTeintes();
  const feuille = useRequete(`/enseignant/appel/${classe.id}`);
  const eleves = feuille.donnees?.data?.eleves ?? [];
  const [statuts, setStatuts] = useState({});
  const [etat, setEtat] = useState('repos');
  const [message, setMessage] = useState(null);
  useEffect(() => {
    setStatuts(Object.fromEntries(eleves.map((e) => [e.id, e.statut || 'present'])));
  }, [feuille.donnees]); // eslint-disable-line react-hooks/exhaustive-deps

  const absents = Object.values(statuts).filter((v) => v === 'absent').length;
  const retards = Object.values(statuts).filter((v) => v === 'retard').length;

  const enregistrer = async () => {
    setEtat('envoi'); setMessage(null);
    try {
      await api.post('/enseignant/appel', {
        classe_id: classe.id, date: feuille.donnees?.data?.date,
        eleves: eleves.map((e) => ({ eleve_id: e.id, statut: statuts[e.id] || 'present' })),
      });
      setEtat('enregistre');
      setMessage(`Appel enregistré : ${absents} absent(s), ${retards} retard(s).`);
    } catch (err) {
      setEtat('erreur');
      setMessage(err?.response ? messageErreur(err, 'L’appel n’a pas été enregistré.') : 'Hors connexion : l’appel n’a pas été enregistré. Réessayez au retour du réseau.');
    }
  };

  return (
    <Ecran titre={`Appel · ${classe.nom_classe}`} sousTitre={feuille.donnees?.data?.date ? `Le ${dateFr(feuille.donnees.data.date)}` : undefined}
      onRetour={onRetour} retourLabel={`Retour à ${classe.nom_classe}`}>
      <Etat requete={feuille} estVide={!feuille.chargement && eleves.length === 0} vide="Aucun élève inscrit dans cette classe." />
      {eleves.map((e) => (
        <Carte key={e.id} style={{ gap: 8 }}>
          <Texte variante="fort">{[e.nom, e.prenom].filter(Boolean).join(' ')}</Texte>
          <Segments valeur={statuts[e.id] || 'present'} onChange={(v) => setStatuts((x) => ({ ...x, [e.id]: v }))}
            options={STATUTS_APPEL.map((o) => ({ ...o, libelle: o.libelle }))} />
        </Carte>
      ))}
      {eleves.length ? <Texte variante="discret">{absents} absent(s) · {retards} retard(s) · {eleves.length - absents - retards} présent(s)</Texte> : null}
      {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: etat === 'erreur' ? t.colors.error : t.colors.success }}>{message}</Texte> : null}
      {eleves.length ? <Bouton titre="Enregistrer l’appel" chargement={etat === 'envoi'} onPress={enregistrer} /> : null}
    </Ecran>
  );
}

/* ─── Devoir donné à une classe (R-30, 16/11/2026) ─────────────────────── */
export function DevoirClasse({ classe, onRetour }) {
  const t = useTeintes();
  const [devoir, setDevoir] = useState({ titre: '', description: '', date_limite: '' });
  const [etat, setEtat] = useState('repos');
  const [message, setMessage] = useState(null);
  const dateValide = !devoir.date_limite || /^\d{4}-\d{2}-\d{2}$/.test(devoir.date_limite);
  const envoyer = async () => {
    setEtat('envoi'); setMessage(null);
    try {
      await api.post('/devoirs', { classe_id: classe.id, titre: devoir.titre.trim(), description: devoir.description.trim() || null,
        date_limite: devoir.date_limite || null, publie: true });
      setEtat('enregistre');
      setMessage(`Devoir publié pour la ${classe.nom_classe} : les familles le voient dans Scolarité › Devoirs.`);
      setDevoir({ titre: '', description: '', date_limite: '' });
    } catch (err) {
      setEtat('erreur');
      setMessage(err?.response ? messageErreur(err, 'Le devoir n’a pas été publié.') : 'Hors connexion : le devoir n’a pas été publié.');
    }
  };
  return (
    <Ecran titre={`Devoir · ${classe.nom_classe}`} onRetour={onRetour} retourLabel={`Retour à ${classe.nom_classe}`}>
      <Champ libelle="Consigne (titre)" etiquette value={devoir.titre} onChangeText={(v) => setDevoir((d) => ({ ...d, titre: v }))} />
      <Champ libelle="Détails (facultatif)" etiquette multiline value={devoir.description} onChangeText={(v) => setDevoir((d) => ({ ...d, description: v }))}
        style={{ minHeight: 96, textAlignVertical: 'top', paddingVertical: 12 }} />
      <Champ libelle="À rendre le (AAAA-MM-JJ, facultatif)" etiquette value={devoir.date_limite} onChangeText={(v) => setDevoir((d) => ({ ...d, date_limite: v }))} />
      {!dateValide ? <Texte variante="discret" style={{ color: t.colors.error }}>Date attendue sous la forme AAAA-MM-JJ.</Texte> : null}
      {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: etat === 'erreur' ? t.colors.error : t.colors.success }}>{message}</Texte> : null}
      <Bouton titre="Publier le devoir" chargement={etat === 'envoi'} desactive={!devoir.titre.trim() || !dateValide} onPress={envoyer} />
    </Ecran>
  );
}

/* ─── Classes et élèves ────────────────────────────────────────────────── */
function Classes() {
  const classes = useRequete('/enseignant/classes');
  const t = useTeintes();
  const [ouverte, setOuverte] = useState(null);
  const [appel, setAppel] = useState(false);
  const [devoir, setDevoir] = useState(false);
  const liste_ = liste(classes.donnees);
  if (ouverte && appel) return <AppelClasse classe={ouverte} onRetour={() => setAppel(false)} />;
  if (ouverte && devoir) return <DevoirClasse classe={ouverte} onRetour={() => setDevoir(false)} />;
  if (ouverte) {
    const eleves = ouverte.eleves ?? [];
    return (
      <Ecran titre={ouverte.nom_classe} sousTitre={effectif(eleves.length)} onRetour={() => setOuverte(null)} retourLabel="Retour à mes classes">
        {eleves.length ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Bouton titre="Faire l’appel" onPress={() => setAppel(true)} style={{ flex: 1 }} />
            <Bouton titre="Donner un devoir" variante="secondaire" onPress={() => setDevoir(true)} style={{ flex: 1 }} />
          </View>
        ) : null}
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
    // `base` : la note telle que chargée ici. Si un autre appareil l'a changée
    // entre-temps, l'API refuse d'écraser et renvoie le conflit (R-28).
    .map((e) => ({ eleve_id: e.id, note: lireNote(saisies[e.id]), base: enregistrees[e.id] ? Number(enregistrees[e.id].note) : null }))
    .filter((n) => n.note !== null && !Number.isNaN(n.note));

  const enregistrer = useCallback(async (forcer = false) => {
    if (invalides.length || aEnvoyer.length === 0) return;
    setEtat('envoi'); setMessage(null);
    try {
      const { data } = await api.post('/notes/bulk', {
        classe_id: Number(ev.classe), matiere_id: Number(ev.matiere), type_evaluation: ev.type, periode: ev.periode, date_evaluation: ev.date, notes: aEnvoyer,
        ...(forcer ? { forcer: true } : {}),
      });
      await setBrouillon(cle, null);
      setEtat('enregistre');
      setMessage(data?.warnings?.length ? data.warnings.join(' ') : `${aEnvoyer.length} note(s) enregistrée(s).`);
      grilleReq.recharger();
    } catch (err) {
      if (err?.response?.status === 409 && Array.isArray(err.response.data?.conflits)) {
        // Note modifiée entre-temps sur un autre appareil : rien n'a été
        // enregistré ; l'enseignant choisit en connaissance de cause.
        const lignes = err.response.data.conflits.map((c) => {
          const e = eleves.find((x) => x.id === c.eleve_id);
          return `${e ? nom(e) : `Élève ${c.eleve_id}`} : enregistrée ${sur20(c.enregistree)}, la vôtre ${sur20(c.envoyee)}`;
        });
        setEtat('erreur');
        setMessage('Conflit : rien n’a été enregistré.');
        Alert.alert('Notes modifiées sur un autre appareil', `${lignes.join('\n')}\n\nRien n’a été enregistré.`, [
          { text: 'Garder les notes enregistrées', style: 'cancel', onPress: () => { setBrouillon(cle, null).catch(() => {}); grilleReq.recharger(); } },
          { text: 'Remplacer par les miennes', style: 'destructive', onPress: () => enregistrer(true) },
        ]);
        return;
      }
      // Sans réponse du serveur : le brouillon reste, rien n'est annoncé enregistré.
      setEtat(err?.response ? 'erreur' : 'attente');
      setMessage(err?.response ? messageErreur(err, 'Les notes n’ont pas été enregistrées.') : 'Hors connexion : notes gardées sur le téléphone, non enregistrées. Réessayez au retour du réseau.');
    }
  }, [invalides.length, aEnvoyer, ev, cle, grilleReq, eleves]);

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
          <Choix libelle="Évaluation" valeur={ev.type} onChange={(v) => setEv((e) => ({ ...e, type: v }))} options={TYPES.map((x) => ({ valeur: x, libelle: libelleEvaluation(x) }))} />
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
        <Texte variante="discret">{eleves.filter((e) => lireNote(saisies[e.id]) !== null).length} note(s) saisie(s) sur {effectif(eleves.length)}</Texte>
        {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: couleurMessage }}>{message}</Texte> : null}
        {invalides.length ? <Texte variante="discret" style={{ color: t.colors.error }}>Corrigez les notes hors de 0 à 20 pour pouvoir enregistrer.</Texte> : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Bouton titre="Importer (CSV)" accessibilityLabel="Importer un tableur (CSV)" variante="secondaire" onPress={importer} style={{ flex: 1 }} />
          <Bouton titre={`Enregistrer ${aEnvoyer.length} note(s)`} chargement={etat === 'envoi'} desactive={invalides.length > 0 || aEnvoyer.length === 0}
            onPress={() => enregistrer(false)} style={{ flex: 1.3 }} />
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
/**
 * Identifiant enseignant (≠ identifiant du compte), lu dans les affectations.
 * Sans filtre, `/emploi-du-temps` renvoie les cours de toute l'école : un
 * enseignant y voyait ceux de ses collègues (constaté le 15/11/2026).
 */
export function idEnseignant(classes) {
  return liste(classes).map((c) => c.pivot?.enseignant_id).find((id) => id !== undefined && id !== null) ?? null;
}

function Semaine() {
  const { user } = useAuth();
  const classes = useRequete('/enseignant/classes');
  const id = idEnseignant(classes.donnees);
  const edt = useRequete(id !== null ? `/emploi-du-temps?enseignant_id=${id}` : null);
  const annonces = useRequete('/communications');
  const cours = liste(edt.donnees);
  const parJour = JOURS.map((j) => ({ jour: j, cours: cours.filter((c) => String(c.jour).toLowerCase() === j) })).filter((j) => j.cours.length);
  const pret = !classes.chargement && !edt.chargement;
  return (
    <Ecran titre="Ma semaine" sur={nomCompte(user) ? `Bonjour, ${nomCompte(user)}` : undefined}
      onActualiser={() => { classes.recharger(); edt.recharger(); annonces.recharger(); }}>
      <Etat requete={classes.erreur ? classes : edt} estVide={pret && parJour.length === 0}
        vide={id === null ? 'Aucune classe ne vous est affectée : pas d’emploi du temps à afficher.' : 'Aucun cours ne vous est attribué dans l’emploi du temps.'} />
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

const ECRANS_ENSEIGNANT = [
  { nom: 'Semaine', icone: 'calendrier', composant: Semaine },
  { nom: 'Classes', icone: 'groupe', composant: Classes },
  { nom: 'Notes', icone: 'crayon', composant: Notes },
  { nom: 'Bulletins', icone: 'document', composant: Bulletins },
  { nom: 'Messages', icone: 'message', composant: Messages },
  { nom: 'Compte', composant: Compte, sansOnglet: true },
];

export default function EnseignantEspace() {
  const { user } = useAuth();
  const espace = useMemo(() => ({ initiales: initiales(nomCompte(user)), compte: 'Compte' }), [user]);
  return (
    <EspaceContexte.Provider value={espace}>
      <BarreEtat />
      <Onglets ecrans={ECRANS_ENSEIGNANT} />
    </EspaceContexte.Provider>
  );
}
