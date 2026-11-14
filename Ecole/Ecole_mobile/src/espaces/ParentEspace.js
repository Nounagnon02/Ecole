/**
 * Espace parent du mobile — parité avec le web (mission du 14/11/2026).
 *
 * Web parent : tableau de bord, enfants, notes, bulletins, annonces, emploi
 * du temps, messagerie, paiements (et retour), paramètres. Chaque capacité a
 * ici son équivalent, avec les mêmes API et les mêmes règles (l'API vérifie
 * que l'enfant est rattaché au compte). Une moyenne, un rang ou un solde
 * inconnu s'affiche « — », jamais 0.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Switch, TextInput, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { fonts } from '../theme/typography';
import { Bouton, Carte, Ecran, Etat, Segments, Texte, dateFr, fcfa, liste, messageErreur, sur20, useRequete } from './commun';

const Tab = createBottomTabNavigator();
const EnfantContexte = createContext(null);
const useEnfant = () => useContext(EnfantContexte);

const nomEnfant = (e) => [e?.nom, e?.prenom].filter(Boolean).join(' ') || 'Enfant';

/* ─── Accueil : enfants, choix de l'enfant suivi, annonces ─────────────── */
function Accueil() {
  const { enfants, enfant, choisir, requete } = useEnfant();
  const annonces = useRequete('/communications');
  return (
    <Ecran titre="Mes enfants" onActualiser={() => { requete.recharger(); annonces.recharger(); }}>
      <Etat requete={requete} estVide={enfants.length === 0} vide="Aucun enfant n’est rattaché à votre compte. Contactez le secrétariat de l’école." />
      {enfants.map((e) => {
        const actif = e.id === enfant?.id;
        return (
          <Carte key={e.id} onPress={() => choisir(e.id)} accessibilityLabel={`Suivre ${nomEnfant(e)}`}
            style={actif ? { borderWidth: 2 } : undefined}>
            <Texte variante="sousTitre">{nomEnfant(e)}{actif ? ' · suivi' : ''}</Texte>
            <Texte variante="discret">{e.classe?.nom ?? e.classe?.nom_classe ?? 'Classe non renseignée'} · matricule {e.matricule ?? '—'}</Texte>
            <Texte>Moyenne : {sur20(e.moyenne_generale)} · Rang : {e.rang?.position ?? e.rang ?? '—'} · Absences : {e.absences_count ?? '—'}</Texte>
          </Carte>
        );
      })}
      <Texte variante="sousTitre" accessibilityRole="header">Annonces</Texte>
      <Etat requete={annonces} estVide={liste(annonces.donnees).length === 0} vide="Aucune annonce." />
      {liste(annonces.donnees).map((a) => (
        <Carte key={a.id}>
          <Texte variante="sousTitre">{a.titre}</Texte>
          <Texte variante="discret">{dateFr(a.created_at)}{a.categorie ? ` · ${a.categorie}` : ''}</Texte>
          <Texte>{a.contenu}</Texte>
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Scolarité : notes, absences, emploi du temps, bulletins ──────────── */
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function echapper(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function bulletinHtml(b) {
  const lignes = (b.moyennes_par_matiere ?? []).map((m) => `<tr><td>${echapper(m.matiere)}</td><td>${echapper(sur20(m.moyenne))}</td><td>${echapper(m.coefficient ?? '—')}</td><td>${echapper(m.rang?.position ? `${m.rang.position}/${m.rang.total_eleves}` : '—')}</td></tr>`).join('');
  return `<html><head><meta charset="utf-8"><style>
    body{font-family:Figtree,Arial,sans-serif;margin:32px;color:#17302E}
    h1{color:#0F5C4A;font-size:20px;border-bottom:2px solid #795300;padding-bottom:12px}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #DDD5C5;padding:8px;text-align:left}
    th{background:#F4F0E8}.bilan{margin-top:16px;background:#F4F0E8;padding:12px;border-radius:8px}
  </style></head><body>
    <h1>Bulletin — ${echapper(b.periode)}</h1>
    <p><strong>${echapper(b.eleve?.nom)} ${echapper(b.eleve?.prenom)}</strong> · ${echapper(b.eleve?.classe?.nom ?? '')} · matricule ${echapper(b.eleve?.matricule ?? '—')}</p>
    <table><thead><tr><th>Matière</th><th>Moyenne</th><th>Coefficient</th><th>Rang</th></tr></thead><tbody>${lignes || '<tr><td colspan="4">Aucune note publiée.</td></tr>'}</tbody></table>
    <div class="bilan">Moyenne générale : ${echapper(lignes ? sur20(b.moyenne_generale) : '—')} · Rang : ${echapper(b.rang?.position ? `${b.rang.position}/${b.rang.total_eleves}` : '—')}${b.appreciation ? ` · ${echapper(b.appreciation)}` : ''}</div>
  </body></html>`;
}

function Scolarite() {
  const { enfant } = useEnfant();
  const [vue, setVue] = useState('notes');
  const id = enfant?.id;
  const notes = useRequete(id && vue === 'notes' ? `/parent/enfants/${id}/notes` : null);
  const absences = useRequete(id && vue === 'absences' ? `/parent/enfants/${id}/absences` : null);
  const edt = useRequete(id && vue === 'edt' ? `/parent/enfants/${id}/emploi-du-temps` : null);
  const bulletins = useRequete(id && vue === 'bulletins' ? '/parent/bulletins' : null);
  const [envoi, setEnvoi] = useState(null);

  const partagerBulletin = async (periode) => {
    setEnvoi(periode);
    try {
      const { data } = await api.get(`/parent/bulletin/${id}/${encodeURIComponent(periode)}`);
      const { uri } = await Print.printToFileAsync({ html: bulletinHtml(data?.data ?? data) });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Bulletin ${periode}` });
      else Alert.alert('Bulletin', 'Le bulletin a été enregistré, mais le partage n’est pas disponible sur cet appareil.');
    } catch (err) {
      Alert.alert('Bulletin', messageErreur(err, 'Le bulletin n’a pas pu être généré.'));
    } finally {
      setEnvoi(null);
    }
  };

  if (!enfant) return <Ecran titre="Scolarité"><Carte><Texte variante="discret">Choisissez d’abord un enfant dans « Accueil ».</Texte></Carte></Ecran>;
  const parJour = JOURS.map((j) => ({ jour: j, cours: liste(edt.donnees).filter((c) => String(c.jour).toLowerCase() === j) })).filter((j) => j.cours.length);
  const absMeta = absences.donnees?.meta;

  return (
    <Ecran titre={`Scolarité · ${nomEnfant(enfant)}`}>
      <Segments valeur={vue} onChange={setVue} options={[
        { valeur: 'notes', libelle: 'Notes' }, { valeur: 'absences', libelle: 'Absences' },
        { valeur: 'edt', libelle: 'Emploi du temps' }, { valeur: 'bulletins', libelle: 'Bulletins' },
      ]} />
      {vue === 'notes' && <>
        <Etat requete={notes} estVide={liste(notes.donnees).length === 0} vide="Aucune note publiée pour l’instant." />
        {liste(notes.donnees).map((n) => (
          <Carte key={n.id}>
            <Texte variante="sousTitre">{n.matiere?.nom ?? n.matiere ?? 'Matière'} · {sur20(n.note ?? n.valeur)}</Texte>
            <Texte variante="discret">{n.type_evaluation ?? n.type ?? ''} {n.periode ? `· ${n.periode}` : ''} · {dateFr(n.date_evaluation ?? n.created_at)}</Texte>
          </Carte>
        ))}
      </>}
      {vue === 'absences' && <>
        {absMeta ? <Texte>Total : {absMeta.total} · justifiées : {absMeta.justifiees} · non justifiées : {absMeta.injustifiees}</Texte> : null}
        <Etat requete={absences} estVide={liste(absences.donnees).length === 0} vide="Aucune absence enregistrée." />
        {liste(absences.donnees).map((a) => (
          <Carte key={a.id}>
            <Texte variante="sousTitre">{dateFr(a.date)} · {a.type === 'retard' ? 'Retard' : 'Absence'}</Texte>
            <Texte variante="discret">{a.justifiee ? 'Justifiée' : 'Non justifiée'}{a.motif ? ` · ${a.motif}` : ''}</Texte>
          </Carte>
        ))}
      </>}
      {vue === 'edt' && <>
        <Etat requete={edt} estVide={parJour.length === 0} vide="Aucun cours planifié pour la classe." />
        {parJour.map(({ jour, cours }) => (
          <Carte key={jour}>
            <Texte variante="sousTitre">{jour.charAt(0).toUpperCase() + jour.slice(1)}</Texte>
            {cours.sort((x, y) => String(x.heure_debut).localeCompare(String(y.heure_debut))).map((c) => (
              <Texte key={c.id}>{String(c.heure_debut).slice(0, 5)}–{String(c.heure_fin).slice(0, 5)} · {c.matiere?.nom ?? c.matiere_nom ?? 'Cours'}{c.salle ? ` · salle ${c.salle}` : ''}</Texte>
            ))}
          </Carte>
        ))}
      </>}
      {vue === 'bulletins' && <>
        {(() => { const propres = liste(bulletins.donnees).filter((b) => String(b.enfant_id) === String(id)); return <>
          <Etat requete={bulletins} estVide={propres.length === 0} vide="Aucun bulletin arrêté pour cet enfant." />
          {propres.map((b) => (
            <Carte key={b.periode}>
              <Texte variante="sousTitre">{b.periode}</Texte>
              <Texte>Rang : {b.rang?.position ? `${b.rang.position}/${b.rang.total_eleves}` : '—'}</Texte>
              <Bouton titre="Ouvrir et partager (PDF)" variante="secondaire" chargement={envoi === b.periode} onPress={() => partagerBulletin(b.periode)} />
            </Carte>
          ))}
        </>; })()}
      </>}
    </Ecran>
  );
}

/* ─── Paiements : échéances, paiement en ligne, historique ─────────────── */
const STATUTS = { PAYE: 'Payé', PARTIEL: 'Partiel', EN_ATTENTE: 'À payer', EN_RETARD: 'En retard', ANNULE: 'Annulé' };

function Paiements() {
  const { enfant } = useEnfant();
  const requete = useRequete(enfant ? `/parent/enfants/${enfant.id}/paiements` : null);
  const [montants, setMontants] = useState({});
  const [envoi, setEnvoi] = useState(null);
  const meta = requete.donnees?.meta;

  const payer = async (e) => {
    const montant = Number(String(montants[e.id] ?? e.reste).replace(/\s/g, ''));
    if (!Number.isFinite(montant) || montant < 100 || montant > Number(e.reste)) {
      Alert.alert('Montant', `Indiquez un montant entre 100 et ${fcfa(e.reste)}.`);
      return;
    }
    setEnvoi(e.id);
    try {
      const { data } = await api.post('/payments/initialize', {
        eleve_id: enfant.id, paiement_eleve_id: e.id, amount: montant, type: 'scolarite', description: e.libelle, client: 'mobile',
      });
      const url = data?.data?.checkout_url;
      if (!data?.success || !url) throw new Error(data?.message || 'Le paiement n’a pas pu être ouvert.');
      // Le paiement n'est crédité qu'après confirmation de la passerelle au
      // serveur ; la liste se rafraîchit au retour dans l'application.
      await Linking.openURL(url);
      requete.recharger();
    } catch (err) {
      Alert.alert('Paiement', err?.response ? messageErreur(err) : (err?.message || 'Le paiement n’a pas pu être ouvert.'));
    } finally {
      setEnvoi(null);
    }
  };

  if (!enfant) return <Ecran titre="Paiements"><Carte><Texte variante="discret">Choisissez d’abord un enfant dans « Accueil ».</Texte></Carte></Ecran>;
  return (
    <Ecran titre={`Paiements · ${nomEnfant(enfant)}`} onActualiser={requete.recharger}>
      {meta ? <Carte><Texte>Total dû : {fcfa(meta.total_du)}</Texte><Texte>Déjà payé : {fcfa(meta.total_paye)}</Texte><Texte variante="sousTitre">Reste : {fcfa(meta.solde)}</Texte></Carte> : null}
      <Etat requete={requete} estVide={liste(requete.donnees).length === 0} vide="Aucune échéance pour cet enfant." />
      {liste(requete.donnees).map((e) => (
        <Carte key={e.id}>
          <Texte variante="sousTitre">{e.libelle} · {STATUTS[e.statut] ?? e.statut}</Texte>
          <Texte variante="discret">Échéance du {dateFr(e.date)} · réf. {e.reference ?? '—'}</Texte>
          <Texte>Total {fcfa(e.montant_total)} · payé {fcfa(e.montant_paye)} · reste {fcfa(e.reste)}</Texte>
          {e.paiement_en_cours
            ? <Texte variante="discret">Un paiement en ligne est en cours de confirmation.</Texte>
            : Number(e.reste) > 0 && <>
              <TextInput
                accessibilityLabel={`Montant à payer pour ${e.libelle}`}
                keyboardType="number-pad"
                defaultValue={String(e.reste)}
                onChangeText={(v) => setMontants((m) => ({ ...m, [e.id]: v }))}
                style={{ minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: fonts.body }}
              />
              <Bouton titre="Payer en ligne" chargement={envoi === e.id} onPress={() => payer(e)} />
            </>}
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Messages : conversations, fil, envoi, nouveau message ────────────── */
export function Messages() {
  const { user } = useAuth();
  const conversations = useRequete('/messages/conversations');
  const contacts = useRequete('/messages/contacts');
  const [ouverte, setOuverte] = useState(null);
  const fil = useRequete(ouverte ? `/messages/conversation/${ouverte.id}` : null);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (ouverte) api.put(`/messages/conversation/${ouverte.id}/read`).catch(() => {});
  }, [ouverte]);

  const envoyer = async () => {
    if (!texte.trim()) return;
    setEnvoi(true);
    try {
      await api.post('/messages', { destinataire: String(ouverte.id), contenu: texte.trim() });
      setTexte('');
      fil.recharger();
      conversations.recharger();
    } catch (err) {
      Alert.alert('Message', messageErreur(err, 'Le message n’a pas été envoyé.'));
    } finally {
      setEnvoi(false);
    }
  };

  if (ouverte) {
    return (
      <Ecran titre={ouverte.nom} sousTitre={ouverte.role}>
        <Bouton titre="← Toutes les conversations" variante="secondaire" onPress={() => setOuverte(null)} />
        <Etat requete={fil} estVide={liste(fil.donnees).length === 0} vide="Aucun message pour l’instant." />
        {liste(fil.donnees).map((m) => {
          const moi = String(m.expediteur) === String(user?.id);
          return (
            <Carte key={m.id} style={{ alignSelf: moi ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <Texte>{m.contenu}</Texte>
              <Texte variante="discret">{moi ? 'Vous' : ouverte.nom} · {dateFr(m.created_at)}{moi && m.lu ? ' · lu' : ''}</Texte>
            </Carte>
          );
        })}
        <TextInput accessibilityLabel="Votre message" multiline value={texte} onChangeText={setTexte} placeholder="Écrire un message…"
          style={{ minHeight: 88, borderWidth: 1, borderRadius: 10, padding: 12, fontFamily: fonts.body, textAlignVertical: 'top' }} />
        <Bouton titre="Envoyer" chargement={envoi} desactive={!texte.trim()} onPress={envoyer} />
      </Ecran>
    );
  }

  const convs = liste(conversations.donnees).map((c) => ({ id: c.id ?? c.contact_id, nom: c.contact_nom || 'Conversation', role: c.role, dernier: c.dernier_message, date: c.derniere_date, nonLus: Number(c.non_lus ?? 0) }));
  return (
    <Ecran titre="Messages" onActualiser={conversations.recharger}>
      <Etat requete={conversations} estVide={convs.length === 0} vide="Aucune conversation. Écrivez à un contact ci-dessous." />
      {convs.map((c) => (
        <Carte key={c.id} onPress={() => setOuverte(c)} accessibilityLabel={`Ouvrir la conversation avec ${c.nom}`}>
          <Texte variante="sousTitre">{c.nom}{c.nonLus ? ` · ${c.nonLus} non lu${c.nonLus > 1 ? 's' : ''}` : ''}</Texte>
          <Texte variante="discret" numberOfLines={1}>{c.dernier || ''} · {dateFr(c.date)}</Texte>
        </Carte>
      ))}
      <Texte variante="sousTitre" accessibilityRole="header">Nouveau message</Texte>
      <Etat requete={contacts} estVide={liste(contacts.donnees).length === 0} vide="Aucun contact disponible." />
      {liste(contacts.donnees).map((p) => (
        <Carte key={p.id} onPress={() => setOuverte({ id: p.id, nom: p.name, role: p.role })} accessibilityLabel={`Écrire à ${p.name}`}>
          <Texte>{p.name}</Texte>
          <Texte variante="discret">{p.role}</Texte>
        </Carte>
      ))}
    </Ecran>
  );
}

/* ─── Compte : avis SMS, mot de passe, déconnexion ─────────────────────── */
const AVIS = [['absences', 'Absences et retards'], ['notes', 'Notes et bulletins'], ['echeances', 'Rappels d’échéances'], ['recus', 'Reçus de paiement'], ['convocations', 'Convocations']];

function Compte() {
  const { user, logout } = useAuth();
  const prefs = useRequete('/parent/preferences');
  const [valeurs, setValeurs] = useState(null);
  const [mdp, setMdp] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (prefs.donnees?.data) setValeurs(prefs.donnees.data); }, [prefs.donnees]);

  const basculer = async (cle, v) => {
    const avant = valeurs;
    const apres = { ...valeurs, [cle]: v };
    setValeurs(apres);
    try { await api.put('/parent/preferences', apres); } catch (err) { setValeurs(avant); Alert.alert('Préférences', messageErreur(err, 'La préférence n’a pas été enregistrée.')); }
  };

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

  const champ = (cle, libelle) => (
    <TextInput key={cle} accessibilityLabel={libelle} placeholder={libelle} secureTextEntry autoComplete="password" value={mdp[cle]}
      onChangeText={(v) => setMdp((m) => ({ ...m, [cle]: v }))}
      style={{ minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: fonts.body }} />
  );

  return (
    <Ecran titre="Mon compte" sousTitre={[user?.prenom, user?.name ?? user?.nom].filter(Boolean).join(' ')}>
      <Texte variante="sousTitre" accessibilityRole="header">Avis par SMS</Texte>
      <Etat requete={prefs} estVide={false} />
      {valeurs && AVIS.map(([cle, libelle]) => (
        <Carte key={cle} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Texte>{libelle}</Texte>
          <Switch accessibilityLabel={libelle} value={!!valeurs[cle]} onValueChange={(v) => basculer(cle, v)} />
        </Carte>
      ))}
      <Texte variante="sousTitre" accessibilityRole="header">Mot de passe</Texte>
      {champ('current_password', 'Mot de passe actuel')}
      {champ('password', 'Nouveau mot de passe')}
      {champ('password_confirmation', 'Confirmer le nouveau mot de passe')}
      <Bouton titre="Changer le mot de passe" chargement={envoi} onPress={changerMdp} />
      <View style={{ height: 12 }} />
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={logout} />
    </Ecran>
  );
}

/* ─── Espace ───────────────────────────────────────────────────────────── */
export default function ParentEspace() {
  const { colors } = useTheme();
  const requete = useRequete('/parent/enfants');
  const enfants = useMemo(() => liste(requete.donnees), [requete.donnees]);
  const [idChoisi, setIdChoisi] = useState(null);
  const enfant = enfants.find((e) => e.id === idChoisi) ?? enfants[0] ?? null;
  const valeur = useMemo(() => ({ enfants, enfant, choisir: setIdChoisi, requete }), [enfants, enfant, requete]);

  return (
    <EnfantContexte.Provider value={valeur}>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surfaceRaised, borderTopColor: colors.border, minHeight: 56 },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarIcon: () => null,
      }}>
        <Tab.Screen name="Accueil" component={Accueil} />
        <Tab.Screen name="Scolarité" component={Scolarite} />
        <Tab.Screen name="Paiements" component={Paiements} />
        <Tab.Screen name="Messages" component={Messages} />
        <Tab.Screen name="Compte" component={Compte} />
      </Tab.Navigator>
    </EnfantContexte.Provider>
  );
}
