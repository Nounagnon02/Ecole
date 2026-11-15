/**
 * Écran de connexion du mobile (proposition C, maquette validée le 15/11/2026).
 *
 * Marque identique au web (livre, toit et soleil), identifiant ou e-mail et
 * mot de passe. Le rôle vient du serveur ; un compte hors du périmètre
 * mobile (administration, élève, étudiant) est déconnecté aussitôt.
 */
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { fonts } from '../theme/typography';
import { Bouton, Champ } from '../espaces/commun';
import { Logo } from '../espaces/Icone';
import { hrefDashboard } from '../navigation/routerBridge';

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      // Le rôle vient du serveur ; il n'est pas demandé à l'utilisateur.
      const userData = await login({ email: email.trim(), password });
      const href = hrefDashboard(userData?.role);
      if (!href) {
        // Compte hors du périmètre mobile : le jeton émis ne doit pas rester
        // sur le téléphone (session fermée côté serveur et stockage purgé).
        await logout();
        Alert.alert(
          'Application réservée',
          "Cette application est réservée aux parents et aux enseignants. L'administration utilise l'application de bureau de l'école ; les élèves et étudiants, le site web."
        );
        return;
      }
      if (navigation?.replace) navigation.replace(href);
      else navigation?.navigate(href);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 28, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View accessible accessibilityRole="image" accessibilityLabel="École" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Logo taille={56} couleur={colors.accent} reliure={colors.surface} />
          <Text style={{ fontFamily: fonts.heading, fontSize: 26, letterSpacing: -1, color: colors.textPrimary }}>École</Text>
        </View>

        <View style={{ gap: 6, marginTop: 16, marginBottom: 8 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 30, color: colors.textPrimary }}>Connexion</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.textSecondary }}>
            Suivez la scolarité de vos enfants ou gérez vos classes.
          </Text>
        </View>

        <Champ libelle="Identifiant ou e-mail" etiquette placeholder="exemple@ecole.bj" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" autoComplete="username" />

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.textPrimary }}>Mot de passe</Text>
            <Pressable onPress={() => setVisible((v) => !v)} accessibilityRole="button" hitSlop={10}
              accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} style={{ minHeight: 32, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.accent }}>{visible ? 'Masquer' : 'Afficher'}</Text>
            </Pressable>
          </View>
          <Champ libelle="Mot de passe" placeholder="••••••••" value={password} onChangeText={setPassword}
            secureTextEntry={!visible} autoCapitalize="none" autoComplete="password" onSubmitEditing={handleLogin} />
        </View>

        <Bouton titre="Se connecter" chargement={loading} onPress={handleLogin} style={{ minHeight: 52, marginTop: 4 }} />

        <Pressable onPress={() => navigation?.navigate('ForgotPassword')} accessibilityRole="link" accessibilityLabel="Mot de passe oublié"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.accent, textDecorationLine: 'underline' }}>Mot de passe oublié ?</Text>
        </Pressable>

        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18, textAlign: 'center', color: colors.textSecondary }}>
          Application réservée aux parents et aux enseignants.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
