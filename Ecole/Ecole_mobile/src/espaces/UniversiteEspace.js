/**
 * Espaces universitaires du mobile : professeur et étudiant (décision du
 * 16/11/2026, système LMD).
 *
 * Professeur : ses séances des deux prochaines semaines, ses UE, la saisie des
 * notes par évaluation (CC, TP, examen) avec brouillon gardé sur le téléphone
 * tant que l'API n'a pas confirmé, ses devoirs et la notation des copies.
 *
 * Étudiant : le planning de sa filière, ses UE, son relevé (moyennes d'UE,
 * crédits acquis, moyenne de semestre pondérée par les crédits — provisoire
 * jusqu'à la délibération du jury), ses devoirs et leur remise.
 *
 * L'API borne chacun à ce qui le concerne ; l'application n'affiche jamais
 * « enregistré » ou « rendu » avant la réponse du serveur.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../services/api';
import { getBrouillon, listeBrouillons, setBrouillon } from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../theme/typography';
import {
  Badge, BarreEtat, Bouton, Carte, Champ, Choix, Ecran, EspaceContexte, Etat, Liste, Onglets, Pile, Rang, Segments, Texte, Tuile, Tuiles,
  dateFr, initiales, liste, messageErreur, sur20, useRequete, useTeintes,
} from './commun';
import { ChangerMotDePasse, Jour, Messages, nomCompte } from './ParentEspace';
import { confirmerDeconnexion, lireNote } from './EnseignantEspace';
import { Icone } from './Icone';

/* ─── Dates à l'heure de Porto-Novo ────────────────────────────────────── */
const FUSEAU = 'Africa/Porto-Novo';

/** Jour AAAA-MM-JJ à Porto-Novo, décalé de `decalage` jours. */
export function jourIso(decalage = 0, maintenant = Date.now()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(maintenant + decalage * 86400000)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** « lundi 17 novembre » pour un jour AAAA-MM-JJ. */
export function libelleDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? String(iso) : new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}

const dateValide = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
const nombre = (v) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const nomEtudiant = (e) => [e?.nom, e?.prenom].filter(Boolean).join(' ') || `Étudiant ${e?.id}`;

const TYPES_SEANCE = { cours: 'Cours', td: 'TD', tp: 'TP', examen: 'Examen', soutenance: 'Soutenance', conference: 'Conférence', reunion: 'Réunion', evenement: 'Événement' };
export const TYPES_EVALUATION = [
  { valeur: 'CC', libelle: 'Contrôle continu' },
  { valeur: 'TP', libelle: 'TP' },
  { valeur: 'Examen', libelle: 'Examen' },
];
const libelleEvaluationUniv = (type) => TYPES_EVALUATION.find((t) => t.valeur === type)?.libelle ?? type;

/* ─── Planning des deux prochaines semaines ────────────────────────────── */
export function Planning({ perso = false }) {
  const { user } = useAuth();
  const chemin = `/universite/planning?${new URLSearchParams({ date_debut: jourIso(0), date_fin: jourIso(13), per_page: '100', ...(perso ? { perso: '1' } : {}) })}`;
  const req = useRequete(chemin);
  const seances = liste(req.donnees);
  const parDate = useMemo(() => {
    const groupes = new Map();
    seances.forEach((s) => {
      const jour = String(s.date ?? '').slice(0, 10);
      groupes.set(jour, [...(groupes.get(jour) ?? []), s]);
    });
    return [...groupes.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [seances]);

  const intitule = (s) => [
    s.statut === 'annule' ? 'Annulé' : null,
    TYPES_SEANCE[s.type] ?? null,
    s.matiere?.code ?? s.titre,
    perso ? s.filiere?.nom : null,
  ].filter(Boolean).join(' · ');

  return (
    <Ecran titre="Mon planning" sur={nomCompte(user) ? `Bonjour, ${nomCompte(user)}` : undefined} sousTitre="Les deux prochaines semaines" onActualiser={req.recharger}>
      <Etat requete={req} estVide={!req.chargement && parDate.length === 0}
        vide={perso ? 'Aucune séance ne vous est programmée dans les deux prochaines semaines.' : 'Aucune séance programmée pour votre filière dans les deux prochaines semaines.'} />
      {parDate.map(([jour, cours]) => <Jour key={jour} jour={libelleDate(jour)} cours={cours} intitule={intitule} />)}
    </Ecran>
  );
}

/* ─── Mes UE ───────────────────────────────────────────────────────────── */
export function MesCours({ profil }) {
  const req = useRequete('/universite/mes-cours');
  const cours = liste(req.donnees);
  return (
    <Ecran titre="Mes cours" sousTitre={cours.length ? pluriel(cours.length, 'UE') : undefined} onActualiser={req.recharger}>
      <Etat requete={req} estVide={!req.chargement && cours.length === 0}
        vide={profil === 'etudiant' ? 'Aucune UE n’est encore programmée pour votre filière.' : 'Aucune UE ne vous est attribuée. Le décanat fait les attributions.'} />
      {cours.map((c) => (
        <Carte key={c.id} style={{ gap: 6 }}>
          <Texte variante="fort">{c.code} · {c.intitule}</Texte>
          <Texte variante="discret">
            {[pluriel(Number(c.credit ?? 0), 'crédit'), c.semestre, profil === 'etudiant' ? c.enseignant : c.filiere, profil === 'etudiant' ? null : pluriel(Number(c.etudiants ?? 0), 'étudiant')]
              .filter(Boolean).join(' · ')}
          </Texte>
          <Texte style={{ fontSize: 14 }}>
            {c.prochain_cours
              ? `Prochaine séance : ${libelleDate(c.prochain_cours)}, ${c.horaire}${c.salle && c.salle !== '—' ? `, ${c.salle}` : ''}`
              : 'Aucune séance programmée.'}
          </Texte>
          {c.seances ? <Texte variante="discret">{c.seances_faites}/{pluriel(c.seances, 'séance')} faite{c.seances_faites > 1 ? 's' : ''} · {c.progression} %</Texte> : null}
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Relevé de l'étudiant ─────────────────────────────────────────────── */
export function statutUe(ue) {
  if (ue.validee === true) return { texte: 'Validée', ton: 'succes' };
  if (ue.validee === false) return { texte: 'Non validée', ton: 'alerte' };
  return { texte: ue.notes?.length ? 'En cours' : 'Pas de note', ton: 'neutre' };
}

export function Releve() {
  const req = useRequete('/universite/mes-notes');
  const releve = req.donnees?.data;
  const semestres = releve?.semestres ?? [];
  const [choisi, setChoisi] = useState(null);
  const [ouverte, setOuverte] = useState(null);
  // Par défaut le dernier semestre : celui en cours.
  const semestre = semestres.find((s) => s.semestre_id === choisi) ?? semestres[semestres.length - 1];
  const poids = releve?.regles?.poids_examen;

  return (
    <Ecran titre="Mes notes" sousTitre={releve ? [releve.etudiant?.filiere, releve.etudiant?.niveau].filter(Boolean).join(' · ') : undefined}
      onActualiser={req.recharger}
      puces={semestres.length > 1 ? { options: semestres.map((s) => ({ valeur: s.semestre_id, libelle: s.libelle })), valeur: semestre?.semestre_id, onChange: setChoisi } : undefined}>
      <Etat requete={req} estVide={!!releve && semestres.length === 0} vide="Aucune UE n’est encore programmée pour votre filière." />
      {releve ? (
        <Carte ton="ocre" style={{ gap: 4 }}>
          <Texte variante="fort" style={{ fontSize: 14 }}>Relevé provisoire</Texte>
          <Texte style={{ fontSize: 14 }}>Les résultats officiels (compensation, rattrapage) sont ceux de la délibération du jury.</Texte>
          {poids !== undefined && poids !== null ? (
            <Texte variante="discret">
              Moyenne d’UE : {Math.round((1 - poids) * 100)} % contrôle continu (CC, TP), {Math.round(poids * 100)} % examen · UE validée à {releve.regles.seuil_validation}/20.
            </Texte>
          ) : null}
        </Carte>
      ) : null}
      {semestre ? <>
        <Tuiles>
          <Tuile libelle={`Moyenne ${semestre.libelle}`} valeur={sur20(semestre.moyenne)} />
          <Tuile libelle="Crédits acquis" valeur={`${semestre.credits_acquis}/${semestre.credits_total}`} />
        </Tuiles>
        {!semestre.complet ? <Texte variante="discret">Moyenne du semestre calculée sur les seules UE dont l’examen est noté.</Texte> : null}
        <Liste>
          {semestre.ues.map((u) => {
            const statut = statutUe(u);
            const detail = [pluriel(u.credit, 'crédit'), u.controle_continu !== null ? `CC ${nombre(u.controle_continu)}` : null, u.examen !== null ? `Examen ${nombre(u.examen)}` : null]
              .filter(Boolean).join(' · ');
            return (
              <View key={u.matiere_id}>
                <Rang hauteur={66} onPress={() => setOuverte(ouverte === u.matiere_id ? null : u.matiere_id)}
                  accessibilityLabel={`${u.code} ${u.intitule} : ${u.moyenne === null ? 'pas encore de note' : sur20(u.moyenne)}, ${statut.texte}`}>
                  <Pile titre={`${u.code} · ${u.intitule}`} detail={detail} lignes={2} />
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Texte variante="fort">{sur20(u.moyenne)}</Texte>
                    <Badge texte={statut.texte} ton={statut.ton} />
                  </View>
                </Rang>
                {ouverte === u.matiere_id ? (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 4 }}>
                    {u.enseignant ? <Texte variante="discret">Enseignant : {u.enseignant}</Texte> : null}
                    {u.notes.length === 0 ? <Texte variante="discret">Aucune note pour le moment.</Texte> : null}
                    {u.notes.map((n, i) => (
                      <Texte key={`${n.type}-${n.date}-${i}`} style={{ fontSize: 14 }}>{libelleEvaluationUniv(n.type)} du {dateFr(n.date)} : {sur20(n.note)}</Texte>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </Liste>
      </> : null}
    </Ecran>
  );
}

/* ─── Devoirs de l'étudiant ────────────────────────────────────────────── */
export function etatDevoir(devoir, maintenant = Date.now()) {
  const m = devoir.ma_soumission;
  if (m?.note !== null && m?.note !== undefined) return { texte: `Noté ${sur20(m.note)}`, ton: 'succes' };
  if (m?.rendu) return { texte: 'Rendu', ton: 'succes' };
  if (devoir.date_limite && new Date(devoir.date_limite).getTime() < maintenant) return { texte: 'En retard', ton: 'alerte' };
  return { texte: 'À rendre', ton: 'ocre' };
}

const TYPES_FICHIER = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text', 'text/plain', 'image/jpeg', 'image/png', 'image/webp', 'application/zip'];

export function RemiseDevoir({ devoir, onRetour }) {
  const t = useTeintes();
  const [reponse, setReponse] = useState('');
  const [fichier, setFichier] = useState(null);
  const [etat, setEtat] = useState('repos');
  const [message, setMessage] = useState(null);
  const note = devoir.ma_soumission?.note;
  const notee = note !== null && note !== undefined;

  const choisir = async () => {
    const choix = await DocumentPicker.getDocumentAsync({ type: TYPES_FICHIER, copyToCacheDirectory: true });
    if (!choix.canceled && choix.assets?.[0]) setFichier(choix.assets[0]);
  };

  const rendre = async () => {
    setEtat('envoi'); setMessage(null);
    const url = `/universite/devoirs/${devoir.id}/soumettre`;
    try {
      if (fichier) {
        const corps = new FormData();
        if (reponse.trim()) corps.append('reponse', reponse.trim());
        corps.append('fichier', { uri: fichier.uri, name: fichier.name ?? 'copie', type: fichier.mimeType ?? 'application/octet-stream' });
        await api.post(url, corps, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(url, { reponse: reponse.trim() });
      }
      setEtat('rendu');
      setMessage('Devoir rendu. Votre enseignant le voit dans ses copies.');
    } catch (err) {
      setEtat('erreur');
      setMessage(err?.response ? messageErreur(err, 'Le devoir n’a pas été rendu.') : 'Hors connexion : le devoir n’a pas été rendu. Réessayez au retour du réseau.');
    }
  };

  return (
    <Ecran titre={devoir.titre} sousTitre={[devoir.cours?.code, devoir.date_limite ? `À rendre le ${dateFr(devoir.date_limite)}` : null].filter(Boolean).join(' · ')}
      onRetour={onRetour} retourLabel="Retour à mes devoirs">
      {devoir.description ? <Carte><Texte>{devoir.description}</Texte></Carte> : null}
      {notee ? (
        <Carte style={{ gap: 4 }}>
          <Texte variante="fort">Note : {sur20(note)}</Texte>
          {devoir.ma_soumission?.commentaire ? <Texte>{devoir.ma_soumission.commentaire}</Texte> : null}
          <Texte variante="discret">Devoir noté : la remise est close.</Texte>
        </Carte>
      ) : <>
        {devoir.ma_soumission?.rendu ? <Texte variante="discret">Déjà rendu le {dateFr(devoir.ma_soumission.date_remise)}. Un nouvel envoi remplace le précédent.</Texte> : null}
        <Champ libelle="Votre réponse" etiquette multiline value={reponse} onChangeText={setReponse} style={{ minHeight: 120, textAlignVertical: 'top', paddingVertical: 12 }} />
        <Bouton titre={fichier ? `Fichier : ${fichier.name}` : 'Joindre un fichier (PDF, Word, photo…)'} variante="secondaire" onPress={choisir} />
        {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: etat === 'erreur' ? t.colors.error : t.colors.success }}>{message}</Texte> : null}
        <Bouton titre="Rendre le devoir" chargement={etat === 'envoi'} desactive={etat === 'rendu' || (!reponse.trim() && !fichier)} onPress={rendre} />
      </>}
    </Ecran>
  );
}

function DevoirsEtudiant() {
  const t = useTeintes();
  const req = useRequete('/universite/devoirs');
  const [ouvert, setOuvert] = useState(null);
  const devoirs = liste(req.donnees);
  if (ouvert) return <RemiseDevoir devoir={ouvert} onRetour={() => { setOuvert(null); req.recharger(); }} />;
  return (
    <Ecran titre="Mes devoirs" onActualiser={req.recharger}>
      <Etat requete={req} estVide={!req.chargement && devoirs.length === 0} vide="Aucun devoir publié pour votre filière." />
      {devoirs.map((d) => {
        const statut = etatDevoir(d);
        return (
          <Carte key={d.id} onPress={() => setOuvert(d)} accessibilityLabel={`${d.titre}, ${statut.texte}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Texte variante="fort">{d.titre}</Texte>
              <Texte variante="discret">{[d.cours?.code, d.date_limite ? `À rendre le ${dateFr(d.date_limite)}` : 'Sans date limite'].filter(Boolean).join(' · ')}</Texte>
              <View style={{ flexDirection: 'row' }}><Badge texte={statut.texte} ton={statut.ton} /></View>
            </View>
            <Icone nom="suivant" couleur={t.colors.accent} />
          </Carte>
        );
      })}
    </Ecran>
  );
}

/* ─── Saisie des notes du professeur ───────────────────────────────────── */
export function NotesUniversite() {
  const t = useTeintes();
  const cours = useRequete('/universite/mes-cours');
  const ues = liste(cours.donnees);
  const [ev, setEv] = useState({ ue: null, type: 'CC', date: jourIso(0) });
  const dateOk = dateValide(ev.date);
  const grilleReq = useRequete(ev.ue && dateOk ? `/universite/matieres/${ev.ue}/grille?${new URLSearchParams({ type: ev.type, date: ev.date })}` : null);
  const grille = grilleReq.donnees?.data;
  const etudiants = useMemo(() => grille?.etudiants ?? [], [grille]);
  const enregistrees = useMemo(() => Object.fromEntries((grille?.notes ?? []).map((n) => [n.etudiant_id, Number(n.note)])), [grille]);
  const cle = ev.ue && dateOk ? `univ:${ev.ue}:${ev.type}:${ev.date}` : null;
  const [saisies, setSaisies] = useState({});
  const [etat, setEtat] = useState('repos'); // repos | envoi | enregistre | attente | erreur
  const [message, setMessage] = useState(null);

  useEffect(() => { if (!ev.ue && ues.length === 1) setEv((e) => ({ ...e, ue: ues[0].id })); }, [ues, ev.ue]);

  // Un rechargement après envoi n'efface pas la confirmation (même règle
  // que la grille du secondaire, parcours 9).
  const cleAffichee = useRef(null);
  useEffect(() => {
    let actif = true;
    (async () => {
      if (!cle) return;
      const brouillon = await getBrouillon(cle);
      const base = Object.fromEntries(Object.entries(enregistrees).map(([id, n]) => [id, String(n).replace('.', ',')]));
      if (!actif) return;
      const memeGrille = cleAffichee.current === cle;
      cleAffichee.current = cle;
      setSaisies({ ...base, ...(brouillon ?? {}) });
      if (brouillon) {
        setEtat('attente'); setMessage('Brouillon non enregistré retrouvé sur ce téléphone.');
      } else if (!memeGrille) {
        setEtat('repos'); setMessage(null);
      }
    })();
    return () => { actif = false; };
  }, [cle, enregistrees]);

  const saisir = (id, valeur) => {
    const suivant = { ...saisies, [id]: valeur };
    setSaisies(suivant);
    if (cle) setBrouillon(cle, suivant).catch(() => {});
  };

  const invalides = etudiants.filter((e) => Number.isNaN(lireNote(saisies[e.id])));
  const aEnvoyer = etudiants
    .map((e) => ({ etudiant_id: e.id, note: lireNote(saisies[e.id]) }))
    .filter((n) => n.note !== null && !Number.isNaN(n.note) && n.note !== enregistrees[n.etudiant_id]);

  const enregistrer = useCallback(async () => {
    if (invalides.length || aEnvoyer.length === 0) return;
    setEtat('envoi'); setMessage(null);
    try {
      const { data } = await api.post('/universite/notes/lot', { matiere_id: Number(ev.ue), type: ev.type, date_evaluation: ev.date, notes: aEnvoyer });
      await setBrouillon(cle, null);
      setEtat('enregistre');
      setMessage(`${data?.enregistrees ?? aEnvoyer.length} note(s) enregistrée(s).`);
      grilleReq.recharger();
    } catch (err) {
      // Sans réponse du serveur : le brouillon reste, rien n'est annoncé enregistré.
      setEtat(err?.response ? 'erreur' : 'attente');
      setMessage(err?.response ? messageErreur(err, 'Les notes n’ont pas été enregistrées.') : 'Hors connexion : notes gardées sur le téléphone, non enregistrées. Réessayez au retour du réseau.');
    }
  }, [invalides.length, aEnvoyer, ev, cle, grilleReq]);

  const ue = ues.find((u) => u.id === ev.ue);
  const couleurMessage = { erreur: t.colors.error, enregistre: t.colors.success, attente: t.colors.amber }[etat] ?? t.colors.textSecondary;
  return (
    <Ecran titre="Saisie des notes" sur={ue ? `${ue.code} · ${pluriel(etudiants.length, 'étudiant')}` : undefined}>
      <Etat requete={cours} estVide={!cours.chargement && ues.length === 0} vide="Aucune UE ne vous est attribuée." />
      <View style={{ gap: 8 }}>
        <Choix libelle="UE" valeur={ev.ue} onChange={(v) => setEv((e) => ({ ...e, ue: v }))}
          options={ues.map((u) => ({ valeur: u.id, libelle: `${u.code} · ${u.intitule}` }))} />
        <Segments valeur={ev.type} onChange={(v) => setEv((e) => ({ ...e, type: v }))} options={TYPES_EVALUATION} />
        <Champ libelle="Date de l’évaluation (AAAA-MM-JJ)" etiquette value={ev.date} onChangeText={(v) => setEv((e) => ({ ...e, date: v.trim() }))} />
        {!dateOk ? <Texte variante="discret" style={{ color: t.colors.error }}>Date attendue sous la forme AAAA-MM-JJ.</Texte> : null}
      </View>
      {ev.ue && dateOk ? <>
        <Etat requete={grilleReq} estVide={!grilleReq.chargement && etudiants.length === 0} vide="Aucun étudiant inscrit dans la filière de cette UE." />
        <Liste>
          {etudiants.map((e) => {
            const invalide = Number.isNaN(lireNote(saisies[e.id]));
            const detail = invalide ? 'Note entre 0 et 20' : enregistrees[e.id] !== undefined ? `Enregistrée : ${sur20(enregistrees[e.id])}` : e.matricule;
            return (
              <Rang key={e.id} hauteur={58}>
                <Pile titre={nomEtudiant(e)} detail={detail} alerte={invalide} />
                <TextInput accessibilityLabel={`Note de ${nomEtudiant(e)}`} keyboardType="decimal-pad" value={saisies[e.id] ?? ''}
                  onChangeText={(v) => saisir(e.id, v)}
                  style={{ width: 76, minHeight: 44, borderWidth: invalide ? 2 : 1, borderColor: invalide ? t.colors.error : t.colors.border, borderRadius: 10,
                    backgroundColor: t.colors.surface, color: invalide ? t.colors.error : t.colors.textPrimary, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 17 }} />
              </Rang>
            );
          })}
        </Liste>
        {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: couleurMessage }}>{message}</Texte> : null}
        {invalides.length ? <Texte variante="discret" style={{ color: t.colors.error }}>Corrigez les notes hors de 0 à 20 pour pouvoir enregistrer.</Texte> : null}
        <Bouton titre={`Enregistrer ${aEnvoyer.length} note(s)`} chargement={etat === 'envoi'} desactive={invalides.length > 0 || aEnvoyer.length === 0} onPress={enregistrer} />
      </> : null}
    </Ecran>
  );
}

/* ─── Devoirs du professeur ────────────────────────────────────────────── */
export function NouveauDevoirUniv({ onRetour }) {
  const t = useTeintes();
  const cours = useRequete('/universite/mes-cours');
  const ues = liste(cours.donnees);
  const [devoir, setDevoir] = useState({ ue: null, titre: '', description: '', date_limite: '' });
  const [etat, setEtat] = useState('repos');
  const [message, setMessage] = useState(null);
  const dateOk = !devoir.date_limite || dateValide(devoir.date_limite);
  const publier = async () => {
    setEtat('envoi'); setMessage(null);
    try {
      await api.post('/universite/devoirs', { matiere_id: devoir.ue, titre: devoir.titre.trim(), description: devoir.description.trim() || null,
        date_limite: devoir.date_limite || null, type: 'devoir', publie: true });
      setEtat('publie');
      setMessage('Devoir publié : les étudiants de la filière le voient dans leurs devoirs.');
      setDevoir((d) => ({ ...d, titre: '', description: '', date_limite: '' }));
    } catch (err) {
      setEtat('erreur');
      setMessage(err?.response ? messageErreur(err, 'Le devoir n’a pas été publié.') : 'Hors connexion : le devoir n’a pas été publié.');
    }
  };
  return (
    <Ecran titre="Nouveau devoir" onRetour={onRetour} retourLabel="Retour à mes devoirs">
      <Choix libelle="UE" valeur={devoir.ue} onChange={(v) => setDevoir((d) => ({ ...d, ue: v }))} options={ues.map((u) => ({ valeur: u.id, libelle: `${u.code} · ${u.intitule}` }))} />
      <Champ libelle="Consigne (titre)" etiquette value={devoir.titre} onChangeText={(v) => setDevoir((d) => ({ ...d, titre: v }))} />
      <Champ libelle="Détails (facultatif)" etiquette multiline value={devoir.description} onChangeText={(v) => setDevoir((d) => ({ ...d, description: v }))}
        style={{ minHeight: 96, textAlignVertical: 'top', paddingVertical: 12 }} />
      <Champ libelle="À rendre le (AAAA-MM-JJ, facultatif)" etiquette value={devoir.date_limite} onChangeText={(v) => setDevoir((d) => ({ ...d, date_limite: v.trim() }))} />
      {!dateOk ? <Texte variante="discret" style={{ color: t.colors.error }}>Date attendue sous la forme AAAA-MM-JJ.</Texte> : null}
      {message ? <Texte accessibilityRole="alert" variante="discret" style={{ color: etat === 'erreur' ? t.colors.error : t.colors.success }}>{message}</Texte> : null}
      <Bouton titre="Publier le devoir" chargement={etat === 'envoi'} desactive={!devoir.ue || !devoir.titre.trim() || !dateOk} onPress={publier} />
    </Ecran>
  );
}

export function CopiesDevoir({ devoir, onRetour }) {
  const t = useTeintes();
  const req = useRequete(`/universite/devoirs/${devoir.id}`);
  // `copies` : la liste ; `soumissions` reste le compteur. Une forme
  // inattendue donne un état vide, jamais un écran blanc (16/11/2026).
  const copies = Array.isArray(req.donnees?.data?.copies) ? req.donnees.data.copies : [];
  const [saisies, setSaisies] = useState({});
  const [retours, setRetours] = useState({});

  const noter = async (c) => {
    const note = lireNote(saisies[c.etudiant_id]);
    if (note === null || Number.isNaN(note)) return;
    setRetours((r) => ({ ...r, [c.etudiant_id]: { etat: 'envoi' } }));
    try {
      await api.post(`/universite/devoirs/${devoir.id}/etudiants/${c.etudiant_id}/noter`, { note });
      setRetours((r) => ({ ...r, [c.etudiant_id]: { etat: 'ok', texte: `Note enregistrée : ${sur20(note)}` } }));
      req.recharger();
    } catch (err) {
      setRetours((r) => ({ ...r, [c.etudiant_id]: { etat: 'erreur', texte: err?.response ? messageErreur(err, 'Note non enregistrée.') : 'Hors connexion : note non enregistrée.' } }));
    }
  };

  const rendues = copies.filter((c) => c.rendu);
  return (
    <Ecran titre={devoir.titre} sousTitre={`${rendues.length}/${pluriel(copies.length, 'copie')} rendue${rendues.length > 1 ? 's' : ''}`}
      onRetour={onRetour} retourLabel="Retour à mes devoirs" onActualiser={req.recharger}>
      <Etat requete={req} estVide={!req.chargement && copies.length === 0} vide="Aucun étudiant concerné par ce devoir." />
      <Liste>
        {[...copies].sort((a, b) => Number(b.rendu) - Number(a.rendu) || String(a.nom).localeCompare(String(b.nom))).map((c) => {
          const retour = retours[c.etudiant_id];
          const invalide = Number.isNaN(lireNote(saisies[c.etudiant_id]));
          return (
            <Rang key={c.etudiant_id} hauteur={64}>
              <Pile titre={c.nom} lignes={2} alerte={retour?.etat === 'erreur' || invalide}
                detail={retour?.texte ?? (invalide ? 'Note entre 0 et 20' : c.rendu ? `Rendu le ${dateFr(c.date_remise)}${c.note !== null && c.note !== undefined ? ` · ${sur20(c.note)}` : ''}` : 'Pas encore rendu')} />
              {c.rendu ? (
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TextInput accessibilityLabel={`Note de ${c.nom}`} keyboardType="decimal-pad" value={saisies[c.etudiant_id] ?? ''}
                    onChangeText={(v) => setSaisies((s) => ({ ...s, [c.etudiant_id]: v }))}
                    style={{ width: 64, minHeight: 44, borderWidth: 1, borderColor: invalide ? t.colors.error : t.colors.border, borderRadius: 10,
                      backgroundColor: t.colors.surface, color: t.colors.textPrimary, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16 }} />
                  <Bouton titre="Noter" accessibilityLabel={`Noter ${c.nom}`} chargement={retour?.etat === 'envoi'}
                    desactive={lireNote(saisies[c.etudiant_id]) === null || invalide} onPress={() => noter(c)} />
                </View>
              ) : null}
            </Rang>
          );
        })}
      </Liste>
    </Ecran>
  );
}

function DevoirsProfesseur() {
  const t = useTeintes();
  const req = useRequete('/universite/devoirs');
  const [vue, setVue] = useState(null);
  const devoirs = liste(req.donnees);
  const fermer = () => { setVue(null); req.recharger(); };
  if (vue === 'nouveau') return <NouveauDevoirUniv onRetour={fermer} />;
  if (vue) return <CopiesDevoir devoir={vue} onRetour={fermer} />;
  return (
    <Ecran titre="Mes devoirs" onActualiser={req.recharger}>
      <Bouton titre="Donner un devoir" onPress={() => setVue('nouveau')} />
      <Etat requete={req} estVide={!req.chargement && devoirs.length === 0} vide="Vous n’avez donné aucun devoir." />
      {devoirs.map((d) => (
        <Carte key={d.id} onPress={() => setVue(d)} accessibilityLabel={`Copies de ${d.titre}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Texte variante="fort">{d.titre}</Texte>
            <Texte variante="discret">{[d.cours?.code, d.date_limite ? `À rendre le ${dateFr(d.date_limite)}` : 'Sans date limite', `${d.soumissions}/${d.total_etudiants} rendu(s)`].filter(Boolean).join(' · ')}</Texte>
          </View>
          <Icone nom="suivant" couleur={t.colors.accent} />
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Compte ───────────────────────────────────────────────────────────── */
function CompteUniversite({ profil, navigation = undefined }) {
  const { user, logout } = useAuth();
  const t = useTeintes();
  const [enAttente, setEnAttente] = useState(0);
  useEffect(() => { listeBrouillons().then((l) => setEnAttente(l.length)).catch(() => {}); }, []);
  return (
    <Ecran titre="Mon compte" sousTitre={[nomCompte(user), profil === 'etudiant' ? 'étudiant' : 'enseignant'].filter(Boolean).join(' · ')} sansCompte
      onRetour={navigation ? () => navigation.navigate('Planning') : undefined} retourLabel="Retour à mon planning">
      <ChangerMotDePasse />
      {enAttente ? (
        <Carte ton="ocre" style={{ gap: 4, marginTop: 8 }}>
          <Texte variante="fort" style={{ fontSize: 14, color: t.colors.amber }}>{pluriel(enAttente, 'saisie')} de notes non enregistrée{enAttente > 1 ? 's' : ''}</Texte>
          <Texte style={{ fontSize: 14 }}>Elles seront effacées de ce téléphone si vous vous déconnectez.</Texte>
        </Carte>
      ) : null}
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={() => confirmerDeconnexion(logout)} />
    </Ecran>
  );
}

const PlanningProfesseur = () => <Planning perso />;
const CoursProfesseur = () => <MesCours profil="professeur" />;
const CompteProfesseur = (props) => <CompteUniversite profil="professeur" {...props} />;
const CoursEtudiant = () => <MesCours profil="etudiant" />;
const CompteEtudiant = (props) => <CompteUniversite profil="etudiant" {...props} />;

const ECRANS_PROFESSEUR = [
  { nom: 'Planning', icone: 'calendrier', composant: PlanningProfesseur },
  { nom: 'Cours', icone: 'livre', composant: CoursProfesseur },
  { nom: 'Notes', icone: 'crayon', composant: NotesUniversite },
  { nom: 'Devoirs', icone: 'document', composant: DevoirsProfesseur },
  { nom: 'Messages', icone: 'message', composant: Messages },
  { nom: 'Compte', composant: CompteProfesseur, sansOnglet: true },
];

const ECRANS_ETUDIANT = [
  { nom: 'Planning', icone: 'calendrier', composant: Planning },
  { nom: 'Cours', icone: 'livre', composant: CoursEtudiant },
  { nom: 'Notes', icone: 'crayon', composant: Releve },
  { nom: 'Devoirs', icone: 'document', composant: DevoirsEtudiant },
  { nom: 'Messages', icone: 'message', composant: Messages },
  { nom: 'Compte', composant: CompteEtudiant, sansOnglet: true },
];

function EspaceUniversite({ ecrans }) {
  const { user } = useAuth();
  const espace = useMemo(() => ({ initiales: initiales(nomCompte(user)), compte: 'Compte' }), [user]);
  return (
    <EspaceContexte.Provider value={espace}>
      <BarreEtat />
      <Onglets ecrans={ecrans} />
    </EspaceContexte.Provider>
  );
}

export function ProfesseurEspace() {
  return <EspaceUniversite ecrans={ECRANS_PROFESSEUR} />;
}

export function EtudiantEspace() {
  return <EspaceUniversite ecrans={ECRANS_ETUDIANT} />;
}
