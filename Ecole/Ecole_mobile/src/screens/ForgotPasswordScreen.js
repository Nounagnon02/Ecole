/**
 * ============================================================================
 * ForgotPasswordScreen — Érudit v4 (React Native)
 *
 * Écran de demande de réinitialisation de mot de passe.
 * - Saisie d'email
 * - Envoi lien de réinitialisation
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

export default function ForgotPasswordScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useTheme();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
      return;
    }
    setLoading(true);
    try {
      const message = await forgotPassword(email.trim());
      setSent(true);
      Alert.alert('Email envoyé', message);
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
              <EruditText style={{ fontSize: 32 }}>🔐</EruditText>
            </View>
            <EruditText style={{
              fontFamily: typography.heading.fontFamily, fontSize: 22,
              color: colors.textPrimary, fontWeight: '700',
            }}>
              Mot de passe oublié
            </EruditText>
            <EruditText style={{
              fontSize: 13, color: colors.textTertiary, marginTop: 4,
              textAlign: 'center', lineHeight: 20,
            }}>
              {sent
                ? 'Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.'
                : 'Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'
              }
            </EruditText>
          </View>

          {!sent && (
            <EruditCard variant="elevated">
              <EruditCard.Body style={{ gap: spacing.md }}>
                <EruditInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="exemple@ecole.bj"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <EruditButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleSubmit}
                  loading={loading}
                  icon="✉️"
                >
                  Envoyer le lien
                </EruditButton>
              </EruditCard.Body>
            </EruditCard>
          )}

          {/* Retour */}
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
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

