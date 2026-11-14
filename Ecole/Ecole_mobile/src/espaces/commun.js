/**
 * Socle commun des espaces parent et enseignant (proposition C).
 *
 * - `liste()` : extrait une liste des enveloppes de l'API (`data`, paginée…) ;
 * - `useRequete()` : chargement, erreur, actualisation — un état inconnu
 *   reste inconnu, jamais remplacé par une valeur rassurante ;
 * - composants de base aux couleurs et à la police de la proposition C.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../theme';
import { fonts } from '../theme/typography';

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
  return montant === null || montant === undefined || !Number.isFinite(n) ? '—' : `${formatFcfa.format(n).replace(/[  ]/g, ' ')} FCFA`;
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

export function Texte({ style = undefined, variante = 'corps', children = null, ...props }) {
  const { colors } = useTheme();
  const base = {
    titre: { fontFamily: fonts.heading, fontSize: 22, color: colors.textPrimary },
    sousTitre: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
    corps: { fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary },
    discret: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  }[variante];
  return <Text style={[base, style]} {...props}>{children}</Text>;
}

export function Ecran({ titre = undefined, sousTitre = undefined, onActualiser = undefined, actualisation = false, children = null }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={onActualiser ? <RefreshControl refreshing={actualisation} onRefresh={onActualiser} tintColor={colors.accent} /> : undefined}
    >
      {titre ? <Texte variante="titre" accessibilityRole="header">{titre}</Texte> : null}
      {sousTitre ? <Texte variante="discret">{sousTitre}</Texte> : null}
      {children}
    </ScrollView>
  );
}

export function Carte({ children = null, style = undefined, onPress = undefined, accessibilityLabel = undefined }) {
  const { colors } = useTheme();
  const contenu = (
    <View style={[{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 }, style]}>
      {children}
    </View>
  );
  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ minHeight: 44 }}>{contenu}</Pressable>
    : contenu;
}

export function Bouton({ titre, onPress, variante = 'principal', chargement = false, desactive = false, accessibilityLabel = undefined }) {
  const { colors } = useTheme();
  const principal = variante === 'principal';
  const inactif = desactive || chargement;
  return (
    <Pressable
      onPress={inactif ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titre}
      accessibilityState={{ disabled: inactif, busy: chargement }}
      style={{ minHeight: 44, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: principal ? colors.accent : colors.surfaceRaised, borderWidth: principal ? 0 : 1, borderColor: colors.border, opacity: inactif ? 0.6 : 1 }}
    >
      {chargement
        ? <ActivityIndicator color={principal ? colors.surfaceRaised : colors.accent} />
        : <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: principal ? colors.surfaceRaised : colors.accent }}>{titre}</Text>}
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

/** Sélecteur à onglets segmentés (accessibles, 44 px). */
export function Segments({ options, valeur, onChange }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable key={o.valeur} onPress={() => onChange(o.valeur)} accessibilityRole="tab" accessibilityState={{ selected: actif }}
            style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center',
              backgroundColor: actif ? colors.accent : colors.surfaceRaised, borderWidth: 1, borderColor: actif ? colors.accent : colors.border }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: actif ? colors.surfaceRaised : colors.textPrimary }}>{o.libelle}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
