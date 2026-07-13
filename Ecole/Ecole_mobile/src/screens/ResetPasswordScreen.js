/**
 * ============================================================================
 * ResetPasswordScreen — Érudit v4 (React Native)
 *
 * Écran de réinitialisation du mot de passe avec token.
 * - Token + Email + Nouveau mot de passe + Confirmation
 * - Design Érudit, animations douces
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

export default function ResetPasswordScreen({ navigation, route }) {
  const { colors, spacing, typography } = useTheme();
  const { resetPassword } = useAuth();

  const tokenFromRoute = route?.params?.token || '';
  const emailFromRoute = route?.params?.email || '';

  const [email, setEmail] = useState(emailFromRoute);
  const [token, setToken] = useState(tokenFromRoute);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!email.trim() || !password.trim() || !passwordConfirmation.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const message = await resetPassword({
        token: token || undefined,
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      Alert.alert('Succès', message, [
        { text: 'OK', onPress: () => navigation?.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message);
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
          {/* Icône */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{
              width: 72, height: 72, borderRadius: 20,
              backgroundColor: colors.accentSubtle,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: spacing.md,
            }}>
              <EruditText style={{ fontSize: 32 }}>🔑</EruditText>
            </View>
            <EruditText style={{
              fontFamily: typography.heading.fontFamily, fontSize: 22,
              color: colors.textPrimary, fontWeight: '700',
            }}>
              Nouveau mot de passe
            </EruditText>
            <EruditText style={{
              fontSize: 13, color: colors.textTertiary, marginTop: 4,
              textAlign: 'center',
            }}>
              Choisissez un mot de passe sécurisé.
            </EruditText>
          </View>

          <EruditCard variant="elevated">
            <EruditCard.Body style={{ gap: spacing.md }}>
              <EruditInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="exemple@ecole.bj"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailFromRoute}
              />

              {!tokenFromRoute && (
                <EruditInput
                  label="Token de réinitialisation"
                  value={token}
                  onChangeText={setToken}
                  placeholder="Token reçu par email"
                  autoCapitalize="none"
                />
              )}

              <EruditInput
                label="Nouveau mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                rightAction={{
                  icon: showPassword ? '🙈' : '👁️',
                  onPress: () => setShowPassword(!showPassword),
                }}
              />

              <EruditInput
                label="Confirmer le mot de passe"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="••••••••"
                secureTextEntry
              />

              <EruditButton
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleReset}
                loading={loading}
                icon="🔑"
              >
                Réinitialiser
              </EruditButton>
            </EruditCard.Body>
          </EruditCard>

          <TouchableOpacity
            onPress={() => navigation?.navigate('Login')}
            style={{ alignItems: 'center', paddingVertical: spacing.sm }}
          >
            <EruditText style={{
              fontSize: 13, color: colors.accent, fontWeight: '500',
            }}>
              ← Retour à la connexion
            </EruditText>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

