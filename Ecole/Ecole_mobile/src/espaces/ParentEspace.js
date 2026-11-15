/**
 * Espace parent du mobile — parité avec le web (mission du 14/11/2026).
 *
 * Web parent : tableau de bord, enfants, notes, bulletins, annonces, emploi
 * du temps, messagerie, paiements (et retour), paramètres. Chaque capacité a
 * ici son équivalent, avec les mêmes API et les mêmes règles (l'API vérifie
 * que l'enfant est rattaché au compte). Une moyenne, un rang ou un solde
 * inconnu s'affiche « — », jamais 0.
 *
 * Présentation (maquettes validées le 15/11/2026) : quatre onglets à icônes ;
 * le compte s'ouvre par la pastille d'initiales de l'en-tête ; l'enfant suivi
 * se choisit dans l'en-tête de Scolarité et de Paiements.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Switch, TextInput, View } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../theme/typography';
import {
  Badge, BarreOnglets, Bouton, Carte, Champ, Ecran, EspaceContexte, Etat, Liste, Pastille, Pile, Rang, SANS_ONGLET, Segments, Texte, Tuile, Tuiles,
  dateFr, fcfa, initiales, liste, messageErreur, onglet, sur20, useRequete, useTeintes,
} from './commun';
import { Icone } from './Icone';

const Tab = createBottomTabNavigator();
const EnfantContexte = createContext(null);
const useEnfant = () => useContext(EnfantContexte);

const nomEnfant = (e) => [e?.nom, e?.prenom].filter(Boolean).join(' ') || 'Enfant';
const classeEnfant = (e) => e?.classe?.nom ?? e?.classe?.nom_classe ?? 'Classe non renseignée';
export const nomCompte = (u) => [u?.prenom, u?.name ?? u?.nom].filter(Boolean).join(' ');

/** Puces de l'en-tête pour changer d'enfant (masquées s'il n'y en a qu'un). */
function usePucesEnfants() {
  const { enfants, enfant, choisir } = useEnfant();
  return { options: enfants.map((e) => ({ valeur: e.id, libelle: e.prenom || nomEnfant(e) })), valeur: enfant?.id, onChange: choisir };
}

/* ─── Accueil : enfants, prochaine échéance, annonces ──────────────────── */
function Accueil({ navigation }) {
  const { user } = useAuth();
  const { enfants, enfant, choisir, requete } = useEnfant();
  const t = useTeintes();
  const annonces = useRequete('/communications');
  const paiements = useRequete(enfant ? `/parent/enfants/${enfant.id}/paiements` : null);
  const echeance = liste(paiements.donnees).find((e) => Number(e.reste) > 0 && !e.paiement_en_cours);
  const suivre = (e) => { choisir(e.id); navigation.navigate('Scolarité'); };

  return (
    <Ecran titre="Mes enfants" sur={nomCompte(user) ? `Bonjour, ${nomCompte(user)}` : undefined}
      onActualiser={() => { requete.recharger(); annonces.recharger(); paiements.recharger(); }}>
      <Etat requete={requete} estVide={enfants.length === 0} vide="Aucun enfant n’est rattaché à votre compte. Contactez le secrétariat de l’école." />
      {enfants.map((e) => {
        const actif = enfants.length > 1 && e.id === enfant?.id;
        return (
          <Carte key={e.id} onPress={() => suivre(e)} accessibilityLabel={`Voir la scolarité de ${nomEnfant(e)}`}
            style={actif ? { borderColor: t.colors.accent, borderWidth: 2, gap: 12 } : { gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pastille nom={nomEnfant(e)} taille={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Texte variante="sousTitre" style={{ fontSize: 17 }}>{nomEnfant(e)}</Texte>
                <Texte variante="discret">{classeEnfant(e)} · matricule {e.matricule ?? '—'}</Texte>
              </View>
              <Icone nom="suivant" couleur={t.colors.accent} />
            </View>
            <Tuiles>
              <Tuile libelle="Moyenne" valeur={sur20(e.moyenne_generale)} />
              <Tuile libelle="Rang" valeur={String(e.rang?.position ?? e.rang ?? '—')} />
              <Tuile libelle="Absences" valeur={String(e.absences_count ?? '—')} />
            </Tuiles>
          </Carte>
        );
      })}
      {echeance ? (
        <Carte ton="ocre">
          <Texte variante="fort" style={{ fontSize: 13, color: t.colors.amber }}>Échéance du {dateFr(echeance.date)}</Texte>
          <Texte>{echeance.libelle} · {nomEnfant(enfant)}</Texte>
          <View accessible accessibilityLabel={`${echeance.libelle} : ${fcfa(echeance.reste)} restant`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <Texte variante="titre" style={{ fontSize: 26 }}>{fcfa(echeance.reste)}</Texte>
            <Texte variante="discret" style={{ color: t.colors.amber }}>reste à payer</Texte>
          </View>
          <Bouton titre="Payer en ligne" accessibilityLabel={`Aller payer ${echeance.libelle} en ligne`} variante="ocre" onPress={() => navigation.navigate('Paiements')} />
        </Carte>
      ) : null}
      <Texte variante="sousTitre" accessibilityRole="header">Annonces</Texte>
      <Etat requete={annonces} estVide={liste(annonces.donnees).length === 0} vide="Aucune annonce." />
      {liste(annonces.donnees).map((a) => (
        <Carte key={a.id} style={{ gap: 4 }}>
          <Texte variante="fort">{a.titre}</Texte>
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

/**
 * Bulletin arrêté, tel que le web l'affiche (`GET /bulletins`) : lignes par
 * matière avec coefficient et rang, moyenne générale pondérée calculée par
 * l'API. Le mobile ne recalcule rien (même résultat sur les deux plateformes).
 */
export function bulletinHtml(b, nomEleve, classe) {
  const lignes = (b.data ?? []).map((m) => `<tr><td>${echapper(m.matiere)}</td><td>${echapper(sur20(m.moyenne))}</td><td>${echapper(m.coefficient ?? '—')}</td><td>${echapper(m.rang ?? '—')}</td></tr>`).join('');
  return `<html><head><meta charset="utf-8"><style>
    body{font-family:Figtree,Arial,sans-serif;margin:32px;color:#17302E}
    h1{color:#0F5C4A;font-size:20px;border-bottom:2px solid #795300;padding-bottom:12px}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #DDD5C5;padding:8px;text-align:left}
    th{background:#F4F0E8}.bilan{margin-top:16px;background:#F4F0E8;padding:12px;border-radius:8px}
  </style></head><body>
    <h1>Bulletin — ${echapper(b.periode)} ${echapper(b.annee_scolaire ?? '')}</h1>
    <p><strong>${echapper(nomEleve)}</strong> · ${echapper(classe ?? '')}</p>
    <table><thead><tr><th>Matière</th><th>Moyenne</th><th>Coefficient</th><th>Rang</th></tr></thead><tbody>${lignes || '<tr><td colspan="4">Aucune matière notée.</td></tr>'}</tbody></table>
    <div class="bilan">Moyenne générale : ${echapper(sur20(b.moyenne_generale))} · Rang : ${echapper(b.rang ? `${b.rang}/${b.total_eleves ?? '—'}` : '—')}${b.mention ? ` · ${echapper(b.mention)}` : ''}${b.appreciation ? ` · ${echapper(b.appreciation)}` : ''}</div>
  </body></html>`;
}

/** Une journée de cours : horaire, intitulé, salle. */
export function Jour({ jour, cours, intitule }) {
  const { colors } = useTeintes();
  return (
    <Carte style={{ gap: 6 }}>
      <Texte variante="sousTitre" style={{ fontSize: 15 }}>{jour.charAt(0).toUpperCase() + jour.slice(1)}</Texte>
      {[...cours].sort((x, y) => String(x.heure_debut).localeCompare(String(y.heure_debut))).map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 24 }}>
          <Texte style={{ width: 92, fontSize: 14, color: colors.textSecondary }}>{String(c.heure_debut).slice(0, 5)}–{String(c.heure_fin).slice(0, 5)}</Texte>
          <Texte variante="fort" style={{ flex: 1, fontSize: 14 }}>{intitule(c)}</Texte>
          {c.salle ? <Texte variante="discret">salle {c.salle}</Texte> : null}
        </View>
      ))}
    </Carte>
  );
}

function Scolarite() {
  const { enfant } = useEnfant();
  const puces = usePucesEnfants();
  const [vue, setVue] = useState('notes');
  const id = enfant?.id;
  const notes = useRequete(id && vue === 'notes' ? `/parent/enfants/${id}/notes` : null);
  const absences = useRequete(id && vue === 'absences' ? `/parent/enfants/${id}/absences` : null);
  const edt = useRequete(id && vue === 'edt' ? `/parent/enfants/${id}/emploi-du-temps` : null);
  const bulletins = useRequete(id && vue === 'bulletins' ? '/bulletins' : null);
  const [envoi, setEnvoi] = useState(null);

  const partagerBulletin = async (b) => {
    setEnvoi(b.id);
    try {
      const { uri } = await Print.printToFileAsync({ html: bulletinHtml(b, nomEnfant(enfant), classeEnfant(enfant)) });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Bulletin ${b.periode}` });
      else Alert.alert('Bulletin', 'Le bulletin a été enregistré, mais le partage n’est pas disponible sur cet appareil.');
    } catch (err) {
      Alert.alert('Bulletin', messageErreur(err, 'Le bulletin n’a pas pu être généré.'));
    } finally {
      setEnvoi(null);
    }
  };

  if (!enfant) return <Ecran titre="Scolarité"><Carte><Texte variante="discret">Aucun enfant n’est rattaché à votre compte.</Texte></Carte></Ecran>;
  const parJour = JOURS.map((j) => ({ jour: j, cours: liste(edt.donnees).filter((c) => String(c.jour).toLowerCase() === j) })).filter((j) => j.cours.length);
  const absMeta = absences.donnees?.meta;
  const propres = liste(bulletins.donnees).filter((b) => String(b.eleve_id) === String(id));

  return (
    <Ecran titre="Scolarité" sousTitre={puces.options.length > 1 ? undefined : nomEnfant(enfant)} puces={puces}>
      <Segments valeur={vue} onChange={setVue} options={[
        { valeur: 'notes', libelle: 'Notes' }, { valeur: 'absences', libelle: 'Absences' },
        { valeur: 'edt', libelle: 'Emploi du temps' }, { valeur: 'bulletins', libelle: 'Bulletins' },
      ]} />
      {vue === 'notes' && <>
        <Etat requete={notes} estVide={liste(notes.donnees).length === 0} vide="Aucune note publiée pour l’instant." />
        <Liste>
          {liste(notes.donnees).map((n) => (
            <Rang key={n.id} hauteur={64}>
              <Pile titre={n.matiere?.nom ?? n.matiere ?? 'Matière'}
                detail={[n.type_evaluation ?? n.type, n.periode, dateFr(n.date_evaluation ?? n.created_at)].filter(Boolean).join(' · ')} />
              <Texte variante="titre" style={{ fontSize: 20 }}>{sur20(n.note ?? n.valeur)}</Texte>
            </Rang>
          ))}
        </Liste>
      </>}
      {vue === 'absences' && <>
        {absMeta ? (
          <Tuiles>
            <Tuile surCarte={false} libelle="Total" valeur={String(absMeta.total ?? '—')} />
            <Tuile surCarte={false} libelle="Justifiées" valeur={String(absMeta.justifiees ?? '—')} />
            <Tuile surCarte={false} libelle="Non justifiées" valeur={String(absMeta.injustifiees ?? '—')} />
          </Tuiles>
        ) : null}
        <Etat requete={absences} estVide={liste(absences.donnees).length === 0} vide="Aucune absence enregistrée." />
        <Liste>
          {liste(absences.donnees).map((a) => (
            <Rang key={a.id} hauteur={68}>
              <Pile titre={`${dateFr(a.date)} · ${a.type === 'retard' ? 'Retard' : 'Absence'}`} detail={a.motif || 'Aucun motif transmis'} />
              <Badge texte={a.justifiee ? 'Justifiée' : 'Non justifiée'} ton={a.justifiee ? 'succes' : 'alerte'} />
            </Rang>
          ))}
        </Liste>
      </>}
      {vue === 'edt' && <>
        <Etat requete={edt} estVide={parJour.length === 0} vide="Aucun cours planifié pour la classe." />
        {parJour.map(({ jour, cours }) => (
          <Jour key={jour} jour={jour} cours={cours} intitule={(c) => c.matiere?.nom ?? c.matiere_nom ?? 'Cours'} />
        ))}
      </>}
      {vue === 'bulletins' && <>
        <Etat requete={bulletins} estVide={propres.length === 0} vide="Aucun bulletin arrêté pour cet enfant." />
        {propres.map((b) => (
          <Carte key={b.id} style={{ gap: 12 }}>
            <Texte variante="sousTitre">{b.periode} {b.annee_scolaire ?? ''}</Texte>
            <Tuiles>
              <Tuile libelle="Moyenne" valeur={sur20(b.moyenne_generale)} />
              <Tuile libelle="Rang" valeur={b.rang ? `${b.rang}/${b.total_eleves ?? '—'}` : '—'} />
              {b.mention ? <Tuile libelle="Mention" valeur={b.mention} /> : null}
            </Tuiles>
            <Bouton titre="Ouvrir et partager (PDF)" variante="secondaire" chargement={envoi === b.id} onPress={() => partagerBulletin(b)} />
          </Carte>
        ))}
      </>}
    </Ecran>
  );
}

/* ─── Paiements : solde, échéances, paiement en ligne, historique ──────── */
const STATUTS = { PAYE: ['Payé', 'succes'], PARTIEL: ['Partiel', 'ocre'], EN_ATTENTE: ['À payer', 'ocre'], EN_RETARD: ['En retard', 'alerte'], ANNULE: ['Annulé', 'neutre'] };

function Paiements() {
  const { enfant } = useEnfant();
  const puces = usePucesEnfants();
  const t = useTeintes();
  const requete = useRequete(enfant ? `/parent/enfants/${enfant.id}/paiements` : null);
  const [montants, setMontants] = useState({});
  const [envoi, setEnvoi] = useState(null);
  const meta = requete.donnees?.meta;
  const du = Number(meta?.total_du);
  const part = Number.isFinite(du) && du > 0 ? Math.min(1, Math.max(0, Number(meta?.total_paye) / du)) : null;

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

  if (!enfant) return <Ecran titre="Paiements"><Carte><Texte variante="discret">Aucun enfant n’est rattaché à votre compte.</Texte></Carte></Ecran>;
  const echeances = liste(requete.donnees);
  return (
    <Ecran titre="Paiements" sousTitre={puces.options.length > 1 ? undefined : nomEnfant(enfant)} puces={puces} onActualiser={requete.recharger}>
      {meta ? (
        <Carte style={{ gap: 6 }}>
          <View accessible accessibilityLabel={`Reste à payer : ${fcfa(meta.solde)}`} style={{ gap: 2 }}>
            <Texte variante="discret">Reste à payer</Texte>
            <Texte variante="titre" style={{ fontSize: 28 }}>{fcfa(meta.solde)}</Texte>
          </View>
          {part !== null ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 8, borderRadius: 4, backgroundColor: t.piste, marginTop: 4 }}>
              <View style={{ width: `${Math.round(part * 100)}%`, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
            </View>
          ) : null}
          <Texte variante="discret">{fcfa(meta.total_paye)} payés sur {fcfa(meta.total_du)}</Texte>
        </Carte>
      ) : null}
      <Etat requete={requete} estVide={echeances.length === 0} vide="Aucune échéance pour cet enfant." />
      {echeances.length ? <Texte variante="sousTitre" accessibilityRole="header">Échéances</Texte> : null}
      {echeances.map((e) => {
        const [statut, ton] = STATUTS[e.statut] ?? [e.statut, 'neutre'];
        const soldee = Number(e.reste) <= 0;
        return (
          <Carte key={e.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pile titre={e.libelle} lignes={2}
                detail={soldee ? `${fcfa(e.montant_total)} · réf. ${e.reference ?? '—'}` : `Échéance : ${dateFr(e.date)} · reste ${fcfa(e.reste)}`} />
              <Badge texte={statut} ton={ton} />
            </View>
            {e.paiement_en_cours
              ? <Texte variante="discret">Un paiement en ligne est en cours de confirmation.</Texte>
              : !soldee && (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    <Champ libelle={`Montant à payer pour ${e.libelle}`} keyboardType="number-pad" defaultValue={String(e.reste)}
                      onChangeText={(v) => setMontants((m) => ({ ...m, [e.id]: v }))} style={{ backgroundColor: t.colors.surface, fontFamily: fonts.semibold, fontSize: 16 }} />
                  </View>
                  <Bouton titre="Payer en ligne" chargement={envoi === e.id} onPress={() => payer(e)} />
                </View>
              )}
          </Carte>
        );
      })}
      {echeances.length ? <Texte variante="discret">Le paiement est crédité après confirmation de l’opérateur.</Texte> : null}
    </Ecran>
  );
}

/* ─── Messages : conversations, fil, envoi, nouveau message ────────────── */
export function Messages() {
  const { user } = useAuth();
  const navigation = useContext(NavigationContext);
  const t = useTeintes();
  const conversations = useRequete('/messages/conversations');
  const contacts = useRequete('/messages/contacts');
  const [ouverte, setOuverte] = useState(null);
  const fil = useRequete(ouverte ? `/messages/conversation/${ouverte.id}` : null);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (ouverte) api.put(`/messages/conversation/${ouverte.id}/read`).catch(() => {});
    // Le fil occupe tout l'écran : la barre d'onglets laisse place à la saisie.
    navigation?.setOptions?.({ tabBarStyle: ouverte ? { display: 'none' } : undefined });
  }, [ouverte, navigation]);

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
    const bloque = envoi || !texte.trim();
    const pied = (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: t.colors.surfaceRaised,
        borderTopWidth: 1, borderTopColor: t.colors.border }}>
        <TextInput accessibilityLabel="Votre message" multiline value={texte} onChangeText={setTexte} placeholder="Votre message"
          placeholderTextColor={t.colors.textTertiary}
          style={{ flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: t.colors.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: t.colors.surface, color: t.colors.textPrimary, fontFamily: fonts.body, fontSize: 15 }} />
        <Pressable onPress={bloque ? undefined : envoyer} accessibilityRole="button" accessibilityLabel="Envoyer" accessibilityState={{ disabled: bloque, busy: envoi }}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', opacity: bloque ? 0.5 : 1 }}>
          <Icone nom="envoyer" couleur={t.surAccent} taille={22} />
        </Pressable>
      </View>
    );
    return (
      <Ecran titre={ouverte.nom} sousTitre={ouverte.role} onRetour={() => setOuverte(null)} retourLabel="Retour à toutes les conversations" sansCompte pied={pied}>
        <Etat requete={fil} estVide={liste(fil.donnees).length === 0} vide="Aucun message pour l’instant." />
        {liste(fil.donnees).map((m) => {
          const moi = String(m.expediteur) === String(user?.id);
          return (
            <View key={m.id} style={{ alignSelf: moi ? 'flex-end' : 'flex-start', maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 14, gap: 4,
              backgroundColor: moi ? t.colors.accent : t.colors.surfaceRaised, borderWidth: moi ? 0 : 1, borderColor: t.colors.border,
              borderRadius: 16, borderBottomRightRadius: moi ? 4 : 16, borderBottomLeftRadius: moi ? 16 : 4 }}>
              <Texte style={{ color: moi ? t.surAccent : t.colors.textPrimary, lineHeight: 20 }}>{m.contenu}</Texte>
              <Texte variante="discret" style={{ fontSize: 11, alignSelf: 'flex-end', color: moi ? t.discretEntete : t.colors.textSecondary }}>
                {dateFr(m.created_at)}{moi && m.lu ? ' · lu' : ''}
              </Texte>
            </View>
          );
        })}
      </Ecran>
    );
  }

  const convs = liste(conversations.donnees).map((c) => ({ id: c.id ?? c.contact_id, nom: c.contact_nom || 'Conversation', role: c.role, dernier: c.dernier_message, date: c.derniere_date, nonLus: Number(c.non_lus ?? 0) }));
  return (
    <Ecran titre="Messages" onActualiser={conversations.recharger}>
      <Etat requete={conversations} estVide={convs.length === 0} vide="Aucune conversation. Écrivez à un contact ci-dessous." />
      <Liste>
        {convs.map((c) => (
          <Rang key={c.id} hauteur={72} onPress={() => setOuverte(c)}
            accessibilityLabel={`Ouvrir la conversation avec ${c.nom}${c.nonLus ? `, ${c.nonLus} non lu${c.nonLus > 1 ? 's' : ''}` : ''}`}>
            <Pastille nom={c.nom} />
            <Pile titre={c.role ? `${c.nom} · ${c.role}` : c.nom} detail={c.dernier || ' '} />
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Texte variante="discret" style={{ fontSize: 12 }}>{dateFr(c.date)}</Texte>
              {c.nonLus ? (
                <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Texte variante="fort" style={{ fontSize: 12, color: t.surAccent }}>{c.nonLus}</Texte>
                </View>
              ) : null}
            </View>
          </Rang>
        ))}
      </Liste>
      <Texte variante="sousTitre" accessibilityRole="header">Nouveau message</Texte>
      <Etat requete={contacts} estVide={liste(contacts.donnees).length === 0} vide="Aucun contact disponible." />
      <Liste>
        {liste(contacts.donnees).map((p) => (
          <Rang key={p.id} onPress={() => setOuverte({ id: p.id, nom: p.name, role: p.role })} accessibilityLabel={`Écrire à ${p.name}`}>
            <Pastille nom={p.name} taille={36} />
            <Pile titre={p.name} detail={p.role} />
            <Icone nom="suivant" taille={20} couleur={t.colors.textSecondary} />
          </Rang>
        ))}
      </Liste>
    </Ecran>
  );
}

/* ─── Mot de passe (commun aux deux espaces) ───────────────────────────── */
export function ChangerMotDePasse() {
  const [mdp, setMdp] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [envoi, setEnvoi] = useState(false);
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
  return <>
    <Texte variante="sousTitre" accessibilityRole="header">Mot de passe</Texte>
    {[['current_password', 'Mot de passe actuel'], ['password', 'Nouveau mot de passe'], ['password_confirmation', 'Confirmer le nouveau mot de passe']].map(([c, l]) => (
      <Champ key={c} libelle={l} secureTextEntry autoComplete="password" value={mdp[c]} onChangeText={(v) => setMdp((m) => ({ ...m, [c]: v }))} />
    ))}
    <Bouton titre="Changer le mot de passe" chargement={envoi} onPress={changerMdp} />
  </>;
}

/* ─── Compte : avis SMS, mot de passe, déconnexion ─────────────────────── */
const AVIS = [['absences', 'Absences et retards'], ['notes', 'Notes et bulletins'], ['echeances', 'Rappels d’échéances'], ['recus', 'Reçus de paiement'], ['convocations', 'Convocations']];

function Compte({ navigation }) {
  const { user, logout } = useAuth();
  const t = useTeintes();
  const prefs = useRequete('/parent/preferences');
  const [valeurs, setValeurs] = useState(null);
  useEffect(() => { if (prefs.donnees?.data) setValeurs(prefs.donnees.data); }, [prefs.donnees]);

  const basculer = async (cle, v) => {
    const avant = valeurs;
    const apres = { ...valeurs, [cle]: v };
    setValeurs(apres);
    try { await api.put('/parent/preferences', apres); } catch (err) { setValeurs(avant); Alert.alert('Préférences', messageErreur(err, 'La préférence n’a pas été enregistrée.')); }
  };

  return (
    <Ecran titre="Mon compte" sousTitre={[nomCompte(user), 'parent'].filter(Boolean).join(' · ')} sansCompte
      onRetour={() => navigation.navigate('Accueil')} retourLabel="Retour à l’accueil">
      <Texte variante="sousTitre" accessibilityRole="header">Avis par SMS</Texte>
      <Etat requete={prefs} estVide={false} />
      {valeurs ? (
        <Liste>
          {AVIS.map(([cle, libelle]) => (
            <Rang key={cle} hauteur={52}>
              <Texte style={{ flex: 1 }}>{libelle}</Texte>
              <Switch accessibilityLabel={libelle} value={!!valeurs[cle]} onValueChange={(v) => basculer(cle, v)}
                trackColor={{ true: t.colors.accent, false: '#8A8474' }} thumbColor={t.surAccent} />
            </Rang>
          ))}
        </Liste>
      ) : null}
      <ChangerMotDePasse />
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={logout} />
    </Ecran>
  );
}

/* ─── Espace ───────────────────────────────────────────────────────────── */
export default function ParentEspace() {
  const { user } = useAuth();
  const requete = useRequete('/parent/enfants');
  const enfants = useMemo(() => liste(requete.donnees), [requete.donnees]);
  const [idChoisi, setIdChoisi] = useState(null);
  const enfant = enfants.find((e) => e.id === idChoisi) ?? enfants[0] ?? null;
  const valeur = useMemo(() => ({ enfants, enfant, choisir: setIdChoisi, requete }), [enfants, enfant, requete]);
  const espace = useMemo(() => ({ initiales: initiales(nomCompte(user)), compte: 'Compte' }), [user]);

  return (
    <EspaceContexte.Provider value={espace}>
      <EnfantContexte.Provider value={valeur}>
        <Tab.Navigator tabBar={(p) => <BarreOnglets {...p} />} screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Accueil" component={Accueil} options={onglet('accueil')} />
          <Tab.Screen name="Scolarité" component={Scolarite} options={onglet('livre')} />
          <Tab.Screen name="Paiements" component={Paiements} options={onglet('carte')} />
          <Tab.Screen name="Messages" component={Messages} options={onglet('message')} />
          <Tab.Screen name="Compte" component={Compte} options={SANS_ONGLET} />
        </Tab.Navigator>
      </EnfantContexte.Provider>
    </EspaceContexte.Provider>
  );
}
