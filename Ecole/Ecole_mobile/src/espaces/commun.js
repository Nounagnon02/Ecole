/**
 * Socle commun des espaces parent et enseignant (proposition C).
 *
 * - `liste()` : extrait une liste des enveloppes de l'API (`data`, paginée…) ;
 * - `useRequete()` : chargement, erreur, actualisation — un état inconnu
 *   reste inconnu, jamais remplacé par une valeur rassurante ;
 * - composants de base aux couleurs et à la police de la proposition C,
 *   conformes aux maquettes validées le 15/11/2026 : en-tête vert, barre
 *   d'onglets à icônes, compte ouvert par la pastille d'initiales.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Modal, Pressable, RefreshControl, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useTheme } from '../theme';
import { fonts } from '../theme/typography';
import { Icone } from './Icone';

export function liste(reponse) {
  const d = reponse?.data ?? reponse;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  return [];
}

export function messageErreur(err, defaut = 'Le chargement a échoué.') {
  if (!err?.response) return 'Pas de connexion au serveur. Vérifiez le réseau puis réessayez.';
  return err.response?.data?.message || defaut;
}

/** Requête GET avec états ; `chemin` nul = rien à charger. */
export function useRequete(chemin) {
  const [etat, setEtat] = useState({ donnees: null, chargement: !!chemin, erreur: null });
  const charger = useCallback(async () => {
    if (!chemin) { setEtat({ donnees: null, chargement: false, erreur: null }); return; }
    setEtat((e) => ({ ...e, chargement: true, erreur: null }));
    try {
      const { data } = await api.get(chemin);
      setEtat({ donnees: data, chargement: false, erreur: null });
    } catch (err) {
      setEtat({ donnees: null, chargement: false, erreur: messageErreur(err) });
    }
  }, [chemin]);
  useEffect(() => { charger(); }, [charger]);
  return { ...etat, recharger: charger };
}

const formatFcfa = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
/** Montant en FCFA, ou « — » s'il est inconnu. */
export function fcfa(montant) {
  const n = Number(montant);
  return montant === null || montant === undefined || !Number.isFinite(n) ? '—' : `${formatFcfa.format(n).replace(/[  ]/g, ' ')} FCFA`;
}

/** Date JJ/MM/AAAA à l'heure de Porto-Novo, ou « — ». */
export function dateFr(valeur) {
  if (!valeur) return '—';
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? String(valeur) : new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Porto-Novo' }).format(d);
}

/** Note ou moyenne sur 20, ou « — » si inconnue (jamais 0 par défaut). */
export function sur20(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  const n = Number(valeur);
  return Number.isFinite(n) ? `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}/20` : '—';
}

/**
 * Rôle tel que l'utilisateur le comprend : la fonction ou le service, jamais
 * le code interne (« directeurM » → « Direction (maternelle) »).
 */
const ROLES = {
  parent: 'Parent', eleve: 'Élève', etudiant: 'Étudiant',
  enseignant: 'Enseignant', enseignement: 'Enseignant', enseignementM: 'Enseignant (maternelle)', enseignementP: 'Enseignant (primaire)', professeur: 'Enseignant',
  directeur: 'Direction', directeurM: 'Direction (maternelle)', directeurP: 'Direction (primaire)', directeurS: 'Direction (secondaire)',
  censeur: 'Censorat', surveillant: 'Surveillance', secretaire: 'Secrétariat', comptable: 'Comptabilité', infirmier: 'Infirmerie',
  bibliothecaire: 'Bibliothèque', admin: 'Administration', 'super-admin': 'Administration', personnel: 'Personnel',
};
export function libelleRole(role) {
  return ROLES[role] ?? (role ? String(role).charAt(0).toUpperCase() + String(role).slice(1) : '');
}
/** Le rôle relève-t-il de l'équipe enseignante (sinon : administration et services) ? */
export const estEnseignant = (role) => /^(enseignant|enseignement|professeur)/.test(String(role ?? ''));

/** Groupe d'un contact de messagerie, dans l'ordre d'affichage. */
export const GROUPES_CONTACTS = ['Administration et services', 'Enseignants', 'Parents', 'Élèves et étudiants'];
export function groupeContact(role) {
  const r = String(role ?? '');
  if (estEnseignant(r)) return 'Enseignants';
  if (r === 'parent') return 'Parents';
  if (r === 'eleve' || r === 'etudiant') return 'Élèves et étudiants';
  return 'Administration et services';
}

/** Nom lisible d'une évaluation ; la valeur envoyée à l'API reste inchangée. */
export function libelleEvaluation(type) {
  const t = String(type ?? '');
  const devoir = t.match(/^Devoir\s*(\d+)$/i);
  if (devoir) return `Devoir ${devoir[1]}`;
  const rang = t.match(/^(\d+)(?:ère|ème|e)\s+[ée]valuation$/i);
  if (rang) return `${rang[1]}${rang[1] === '1' ? 're' : 'e'} évaluation`;
  return t;
}

/** Initiales d'un nom (« AHO Kossi » → « AK »), pour les pastilles. */
export function initiales(nom) {
  const mots = String(nom ?? '').replace(/^(M\.|Mme|Mlle)\s+/i, '').split(/\s+/).filter(Boolean);
  return ((mots[0]?.[0] ?? '') + (mots[1]?.[0] ?? '')).toUpperCase() || '?';
}

/**
 * Contexte d'un espace : initiales du compte et nom de l'écran « compte »,
 * pour la pastille de l'en-tête. Absent (écran monté seul, hors navigateur) :
 * pas de pastille.
 */
export const EspaceContexte = createContext(null);

/** Couleurs dérivées de la proposition C qui ne sont pas des jetons du thème. */
export function useTeintes() {
  const { colors, isDark } = useTheme();
  return {
    colors,
    entete: isDark ? '#16382F' : '#0F5C4A',
    surEntete: '#FFFDF8',
    discretEntete: isDark ? '#BCCBC0' : '#CFE6DC',
    teinte: colors.accentSubtle,
    piste: isDark ? '#22362C' : '#E9E2D3',
    alerteFond: isDark ? '#4A2A22' : '#F6DDD6',
    surAccent: colors.surfaceRaised,
    ondulation: isDark ? '#3C5145' : '#DDD5C5',
  };
}

export function Texte({ style = undefined, variante = 'corps', children = null, ...props }) {
  const { colors } = useTheme();
  const base = {
    titre: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
    sousTitre: { fontFamily: fonts.heading, fontSize: 16, color: colors.textPrimary },
    fort: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textPrimary },
    corps: { fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary },
    discret: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  }[variante];
  return <Text style={[base, style]} {...props}>{children}</Text>;
}

/**
 * Écran d'un espace : en-tête vert (sur-titre, titre, sous-titre, retour,
 * pastille du compte, puces de choix), contenu défilant, pied fixe éventuel.
 */
export function Ecran({
  titre = undefined, sur = undefined, sousTitre = undefined, onRetour = undefined, retourLabel = 'Retour', puces = undefined,
  sansCompte = false, onActualiser = undefined, actualisation = false, pied = null, children = null,
}) {
  const t = useTeintes();
  const marges = useContext(SafeAreaInsetsContext) ?? { top: 0 };
  const espace = useContext(EspaceContexte);
  const navigation = useContext(NavigationEspace);
  // Bouton Retour d'Android : ferme d'abord ce sous-écran (classe ouverte,
  // appel, conversation, compte) plutôt que de changer d'onglet (constaté
  // sur l'émulateur le 16/11/2026).
  const retourRef = useRef(onRetour);
  retourRef.current = onRetour;
  const aRetour = !!onRetour;
  useEffect(() => {
    if (!aRetour || !navigation?.enregistrerRetour) return undefined;
    return navigation.enregistrerRetour(() => retourRef.current?.());
  }, [aRetour, navigation]);
  const compte = !sansCompte && espace?.compte && navigation ? { initiales: espace.initiales, ouvrir: () => navigation.navigate(espace.compte) } : null;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <View style={{ backgroundColor: t.entete, paddingTop: (marges.top ?? 0) + 16, paddingBottom: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 }}>
          {onRetour ? (
            <Pressable onPress={onRetour} accessibilityRole="button" accessibilityLabel={retourLabel} hitSlop={8}
              style={{ width: 44, height: 44, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }}>
              <Icone nom="retour" couleur={t.surEntete} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {sur ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: t.discretEntete }}>{sur}</Text> : null}
            {titre ? <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 26, color: t.surEntete }}>{titre}</Text> : null}
            {sousTitre ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: t.discretEntete }}>{sousTitre}</Text> : null}
          </View>
          {compte ? (
            <Pressable onPress={compte.ouvrir} accessibilityRole="button" accessibilityLabel="Mon compte"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.surEntete, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 15, color: t.entete }}>{compte.initiales}</Text>
            </Pressable>
          ) : null}
        </View>
        {puces && puces.options.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
            {puces.options.map((o) => {
              const actif = o.valeur === puces.valeur;
              return (
                <Pressable key={String(o.valeur)} onPress={() => puces.onChange(o.valeur)} accessibilityRole="tab" accessibilityLabel={o.libelle}
                  accessibilityState={{ selected: actif }}
                  style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', borderWidth: 1,
                    backgroundColor: actif ? t.surEntete : 'transparent', borderColor: actif ? t.surEntete : t.discretEntete }}>
                  <Text style={{ fontFamily: actif ? fonts.heading : fonts.medium, fontSize: 14, color: actif ? t.entete : t.surEntete }}>{o.libelle}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onActualiser ? <RefreshControl refreshing={actualisation} onRefresh={onActualiser} tintColor={t.colors.accent} /> : undefined}
      >
        {children}
      </ScrollView>
      {pied}
    </View>
  );
}

export function Carte({ children = null, style = undefined, onPress = undefined, accessibilityLabel = undefined, ton = undefined }) {
  const t = useTeintes();
  const ocre = ton === 'ocre';
  const contenu = (
    <View style={[{ backgroundColor: ocre ? t.colors.amberSubtle : t.colors.surfaceRaised, borderColor: t.colors.border, borderWidth: ocre ? 0 : 1,
      borderRadius: 16, padding: 16, gap: 8 }, style]}>
      {children}
    </View>
  );
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ minHeight: 44 }}>{contenu}</Pressable>
    : contenu;
}

/** Liste groupée dans une seule carte : un `Rang` par ligne, séparés d'un filet. */
export function Liste({ children = null }) {
  const { colors } = useTheme();
  const rangs = React.Children.toArray(children);
  if (rangs.length === 0) return null;
  return (
    <View style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>
      {rangs.map((rang, i) => (
        <View key={rang.key ?? i} style={i < rangs.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}>{rang}</View>
      ))}
    </View>
  );
}

export function Rang({ children = null, onPress = undefined, accessibilityLabel = undefined, hauteur = 60 }) {
  const t = useTeintes();
  const style = { minHeight: hauteur, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 };
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} android_ripple={{ color: t.ondulation }} style={style}>{children}</Pressable>
    : <View style={style}>{children}</View>;
}

/** Titre et détail empilés, qui occupent la largeur restante d'un `Rang`. */
export function Pile({ titre, detail = undefined, alerte = false, lignes = 1 }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Texte variante="fort">{titre}</Texte>
      {detail ? <Texte variante="discret" numberOfLines={lignes} style={alerte ? { color: colors.error } : undefined}>{detail}</Texte> : null}
    </View>
  );
}

/** Chiffre clé ; lu d'un bloc par les lecteurs d'écran (« Moyenne : 13,4/20 »). */
export function Tuile({ libelle, valeur, surCarte = true }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${libelle} : ${valeur}`}
      style={{ flex: 1, backgroundColor: surCarte ? colors.surface : colors.surfaceRaised, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 2 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>{libelle}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.heading, fontSize: 19, color: colors.textPrimary }}>{valeur}</Text>
    </View>
  );
}

export function Tuiles({ children = null }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}

export function Badge({ texte, ton = 'neutre' }) {
  const t = useTeintes();
  const [fond, couleur] = {
    succes: [t.teinte, t.colors.success],
    alerte: [t.alerteFond, t.colors.error],
    ocre: [t.colors.amberSubtle, t.colors.amber],
    neutre: [t.piste, t.colors.textSecondary],
  }[ton];
  return (
    <View style={{ backgroundColor: fond, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: couleur }}>{texte}</Text>
    </View>
  );
}

export function Pastille({ nom, taille = 40 }) {
  const t = useTeintes();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2, backgroundColor: t.teinte, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: t.colors.accent }}>{initiales(nom)}</Text>
    </View>
  );
}

export function Bouton({ titre, onPress, variante = 'principal', chargement = false, desactive = false, accessibilityLabel = undefined, style = undefined }) {
  const t = useTeintes();
  const inactif = desactive || chargement;
  const [fond, texte, bord] = {
    principal: [t.colors.accent, t.surAccent, t.colors.accent],
    secondaire: [t.colors.surfaceRaised, t.colors.accent, t.colors.accent],
    ocre: [t.colors.amber, t.colors.amberSubtle, t.colors.amber],
  }[variante];
  return (
    <Pressable
      onPress={inactif ? undefined : onPress}
      disabled={inactif}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titre}
      accessibilityState={{ disabled: inactif, busy: chargement }}
      style={[{ minHeight: 48, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: fond, borderWidth: 1, borderColor: bord, opacity: inactif ? 0.5 : 1 }, style]}
    >
      {chargement
        ? <ActivityIndicator color={texte} />
        : <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: texte, textAlign: 'center' }}>{titre}</Text>}
    </Pressable>
  );
}

/** Chargement, erreur (avec « Réessayer ») ou vide ; rien si les données sont là. */
export function Etat({ requete, vide = '', estVide = false }) {
  const { colors } = useTheme();
  if (requete.chargement && !requete.donnees) {
    return <View style={{ padding: 24, alignItems: 'center' }} accessibilityLabel="Chargement"><ActivityIndicator color={colors.accent} /></View>;
  }
  if (requete.erreur) {
    return (
      <Carte>
        <Texte accessibilityRole="alert">{requete.erreur}</Texte>
        <Bouton titre="Réessayer" variante="secondaire" onPress={requete.recharger} />
      </Carte>
    );
  }
  if (estVide) return <Carte><Texte variante="discret">{vide}</Texte></Carte>;
  return null;
}

/** Sélecteur segmenté sur une piste (accessible, 44 px) ; défile s'il déborde. */
export function Segments({ options, valeur, onChange }) {
  const t = useTeintes();
  return (
    <View style={{ backgroundColor: t.piste, borderRadius: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ padding: 4, gap: 2, flexGrow: 1 }}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <Pressable key={String(o.valeur)} onPress={() => onChange(o.valeur)} accessibilityRole="tab" accessibilityLabel={o.libelle} accessibilityState={{ selected: actif }}
              style={{ flexGrow: 1, minHeight: 44, paddingHorizontal: 10, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                backgroundColor: actif ? t.colors.surfaceRaised : 'transparent' }}>
              <Text style={{ fontFamily: actif ? fonts.heading : fonts.medium, fontSize: 13, color: actif ? t.colors.textPrimary : t.colors.textSecondary }}>{o.libelle}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * Champ de saisie ; `libelle` est son nom accessible. `etiquette` affiche ce
 * libellé (true) ou un texte plus court (chaîne) au-dessus du champ.
 */
export function Champ({ libelle, etiquette = false, style = undefined, ...props }) {
  const { colors } = useTheme();
  const visible = typeof etiquette === 'string' ? etiquette : etiquette ? libelle : null;
  return (
    <View style={{ gap: 6 }}>
      {visible ? <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.textPrimary }}>{visible}</Text> : null}
      <TextInput accessibilityLabel={libelle} placeholder={visible ? undefined : libelle} placeholderTextColor={colors.textTertiary} {...props}
        style={[{ minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: colors.surfaceRaised,
          color: colors.textPrimary, fontFamily: fonts.body, fontSize: 15 }, style]} />
    </View>
  );
}

/** Liste déroulante : bouton « libellé / valeur », choix dans un volet du bas. */
export function Choix({ libelle, valeur, options, onChange, vide = 'à choisir' }) {
  const t = useTeintes();
  const [ouvert, setOuvert] = useState(false);
  const actuel = options.find((o) => o.valeur === valeur)?.libelle ?? vide;
  return (
    <>
      <Pressable onPress={() => setOuvert(true)} accessibilityRole="button" accessibilityLabel={`${libelle} : ${actuel}`}
        style={{ flex: 1, minHeight: 56, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: t.colors.border, borderRadius: 12,
          backgroundColor: t.colors.surfaceRaised, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: t.colors.textSecondary }}>{libelle}</Text>
          <Text numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 14, color: t.colors.textPrimary }}>{actuel}</Text>
        </View>
        <Icone nom="bas" taille={18} couleur={t.colors.textSecondary} />
      </Pressable>
      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={() => setOuvert(false)}>
        <Pressable onPress={() => setOuvert(false)} accessibilityLabel="Fermer la liste" style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16, 30, 25, 0.5)' }}>
          <Pressable onPress={() => {}} accessible={false} style={{ maxHeight: '70%', backgroundColor: t.colors.surfaceRaised, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 24 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 16, color: t.colors.textPrimary, paddingHorizontal: 20, paddingBottom: 8 }}>{libelle}</Text>
            <ScrollView>
              {options.length === 0 ? <Texte variante="discret" style={{ paddingHorizontal: 20, paddingVertical: 12 }}>Aucun choix disponible.</Texte> : null}
              {options.map((o) => {
                const actif = o.valeur === valeur;
                return (
                  <Pressable key={String(o.valeur)} onPress={() => { onChange(o.valeur); setOuvert(false); }} accessibilityRole="menuitem" accessibilityLabel={o.libelle}
                    accessibilityState={{ selected: actif }} android_ripple={{ color: t.ondulation }}
                    style={{ minHeight: 52, paddingHorizontal: 20, justifyContent: 'center', backgroundColor: actif ? t.teinte : 'transparent' }}>
                    <Text style={{ fontFamily: actif ? fonts.heading : fonts.body, fontSize: 15, color: t.colors.textPrimary }}>{o.libelle}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * Contexte de navigation d'un espace : `navigate(nom)` et `setOptions(opts)`
 * (`opts.tabBarStyle.display === 'none'` masque la barre d'onglets, par
 * exemple pendant la lecture d'une conversation).
 */
const NavigationEspace = createContext(null);
export const useNavigationEspace = () => useContext(NavigationEspace);

function BarreOnglets({ onglets, actif, onChoisir }) {
  const t = useTeintes();
  const marges = useContext(SafeAreaInsetsContext) ?? { bottom: 0 };
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: t.colors.surfaceRaised, borderTopWidth: 1, borderTopColor: t.colors.border,
      paddingTop: 8, paddingBottom: 8 + (marges.bottom ?? 0), paddingHorizontal: 4 }}>
      {onglets.map((o) => {
        const choisi = o.nom === actif;
        return (
          <Pressable key={o.nom} onPress={() => onChoisir(o.nom)} accessibilityRole="tab" accessibilityLabel={o.nom} accessibilityState={{ selected: choisi }}
            style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <View style={{ width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: choisi ? t.teinte : 'transparent' }}>
              <Icone nom={o.icone} taille={22} couleur={choisi ? t.colors.accent : t.colors.textSecondary} />
            </View>
            <Text style={{ fontFamily: choisi ? fonts.heading : fonts.medium, fontSize: 12, color: choisi ? t.colors.textPrimary : t.colors.textSecondary }}>{o.nom}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Onglets d'un espace, sans conteneur natif. Le navigateur d'onglets de
 * react-navigation, avec react-native-screens 4.4 (Expo SDK 52), faisait
 * tourner le rendu sans fin dès qu'un deuxième onglet s'affichait : fil
 * JavaScript saturé, plus aucun appui pris en compte, mémoire en hausse
 * jusqu'à l'arrêt de l'application (émulateur, 15/11/2026 ; défaut présent
 * avant la refonte, APK 493b14b). Ici, chaque écran visité reste monté
 * (son état est conservé) et seul l'écran actif est affiché.
 *
 * `ecrans` : [{ nom, icone, composant, sansOnglet }] ; un écran `sansOnglet`
 * (le compte) n'a pas d'onglet et masque la barre. Le bouton Retour
 * d'Android ramène au premier écran.
 */
export function Onglets({ ecrans }) {
  const premier = ecrans[0].nom;
  const [actif, setActif] = useState(premier);
  const [visites, setVisites] = useState([premier]);
  const [masquees, setMasquees] = useState({});
  const aller = useCallback((nom) => {
    setActif(nom);
    setVisites((v) => (v.includes(nom) ? v : [...v, nom]));
  }, []);
  // Sous-écrans ouverts, par onglet : le plus récent répond au bouton Retour.
  const retours = useRef({});
  const navigations = React.useMemo(() => Object.fromEntries(ecrans.map((e) => [e.nom, {
    navigate: aller,
    enregistrerRetour: (fn) => {
      const pile = (retours.current[e.nom] ??= []);
      pile.push(fn);
      return () => { retours.current[e.nom] = pile.filter((f) => f !== fn); };
    },
    setOptions: (opts) => {
      const masquee = opts?.tabBarStyle?.display === 'none';
      setMasquees((m) => (!!m[e.nom] === masquee ? m : { ...m, [e.nom]: masquee }));
    },
  }])), [ecrans, aller]);

  useEffect(() => {
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      const pile = retours.current[actif] ?? [];
      if (pile.length) { pile[pile.length - 1](); return true; }
      if (actif === premier) return false;
      aller(premier);
      return true;
    });
    return () => abonnement.remove();
  }, [actif, premier, aller]);

  const courant = ecrans.find((e) => e.nom === actif);
  const barreVisible = !courant?.sansOnglet && !masquees[actif];
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {ecrans.filter((e) => visites.includes(e.nom)).map((e) => {
          const Composant = e.composant;
          return (
            <View key={e.nom} style={e.nom === actif ? { flex: 1 } : { display: 'none' }}>
              <NavigationEspace.Provider value={navigations[e.nom]}>
                <Composant navigation={navigations[e.nom]} />
              </NavigationEspace.Provider>
            </View>
          );
        })}
      </View>
      {barreVisible ? <BarreOnglets onglets={ecrans.filter((e) => !e.sansOnglet)} actif={actif} onChoisir={aller} /> : null}
    </View>
  );
}

/** Barre d'état aux couleurs de l'en-tête : une seule par espace. */
export function BarreEtat() {
  const t = useTeintes();
  return <StatusBar barStyle="light-content" backgroundColor={t.entete} />;
}
