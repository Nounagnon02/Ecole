/**
 * ============================================================================
 * LoginScreen — Érudit v4 (React Native)
 *
 * Écran de connexion refondu, charte Érudit.
 * Zéro react-native-paper.
 *
 * Fonctionnalités :
 * - Email / Mot de passe / Rôle
 * - Sélecteur de rôle type "segmented control" Érudit
 * - Lien "Mot de passe oublié ?"
 * - Animations douces, ambiance cabinet de lecture
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { EruditText } from '../components/EruditUtilities';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import EruditInput from '../components/EruditInput';
import EruditButton from '../components/EruditButton';
import EruditCard from '../components/EruditCard';
import { hrefDashboard } from '../navigation/routerBridge';

export default function LoginScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useTheme();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      // Le rôle vient du serveur ; il n'est plus demandé à l'utilisateur.
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
      if (navigation?.replace) {
        navigation.replace(href);
      } else {
        navigation?.navigate(href);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: spacing.lg }}
        >
          {/* Logo / Marque */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{
              width: 80, height: 80, borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: spacing.md,
              shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
            }}>
              <EruditText style={{ fontSize: 36, color: '#fff' }}>📖</EruditText>
            </View>
            <EruditText style={{
              fontFamily: typography.heading.fontFamily, fontSize: 28,
              color: colors.textPrimary, fontWeight: '700', letterSpacing: -0.5,
            }}>
              Érudit
            </EruditText>
            <EruditText style={{
              fontSize: 13, color: colors.textTertiary, marginTop: 4,
            }}>
              Gestion scolaire intelligente
            </EruditText>
          </View>

          {/* Carte de connexion */}
          <EruditCard variant="elevated">
            <EruditCard.Body style={{ gap: spacing.md }}>
              <EruditText style={{
                fontSize: 17, fontFamily: typography.heading.fontFamily,
                color: colors.textPrimary, fontWeight: '600', textAlign: 'center',
              }}>
                Connexion
              </EruditText>

              {/* Email */}
              <EruditInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="exemple@ecole.bj"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              {/* Mot de passe */}
              <EruditInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                rightAction={{
                  icon: showPassword ? '🙈' : '👁️',
                  onPress: () => setShowPassword(!showPassword),
                }}
              />

              {/* Bouton connexion */}
              <EruditButton
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleLogin}
                loading={loading}
                icon="🔑"
              >
                Se connecter
              </EruditButton>

              {/* Mot de passe oublié */}
              <TouchableOpacity
                onPress={() => navigation?.navigate('ForgotPassword')}
                style={{ alignItems: 'center', paddingVertical: spacing.sm }}
                accessibilityRole="link"
                accessibilityLabel="Mot de passe oublié"
              >
                <EruditText style={{
                  fontSize: 13, color: colors.accent, fontWeight: '500',
                }}>
                  Mot de passe oublié ?
                </EruditText>
              </TouchableOpacity>
            </EruditCard.Body>
          </EruditCard>

          {/* Footer */}
          <EruditText style={{
            textAlign: 'center', fontSize: 11, color: colors.textTertiary,
          }}>
            Version 4.0 — Érudit Mobile
          </EruditText>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}