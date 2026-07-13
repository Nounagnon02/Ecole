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

const ROLES = [
  { key: 'directeur', label: 'Directeur', icon: '🏫' },
  { key: 'enseignant', label: 'Enseignant', icon: '👨‍🏫' },
  { key: 'eleve', label: 'Élève', icon: '🎓' },
  { key: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
  { key: 'comptable', label: 'Comptable', icon: '💰' },
  { key: 'surveillant', label: 'Surveillant', icon: '👁️' },
  { key: 'censeur', label: 'Censeur', icon: '⚖️' },
  { key: 'infirmier', label: 'Infirmier', icon: '🏥' },
  { key: 'bibliothecaire', label: 'Bibliothécaire', icon: '📚' },
  { key: 'secretaire', label: 'Secrétaire', icon: '📋' },
  { key: 'universite', label: 'Université', icon: '🏛️' },
  { key: 'admin', label: 'Admin', icon: '⚙️' },
];

const ROLE_COLORS = {
  directeur: '#1A3A3C', enseignant: '#5A7A63', eleve: '#5A7AAD',
  parent: '#B8562E', comptable: '#C4943A', surveillant: '#BA4A4A',
  censeur: '#8A5A7A', infirmier: '#5A8A8A', bibliothecaire: '#7A8A5A',
  secretaire: '#8A7A5A', universite: '#1A3A3C', admin: '#1A3A3C',
};

export default function LoginScreen({ navigation }) {
  const { colors, spacing, radius, typography } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('directeur');
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
      const userData = await login({ email: email.trim(), password, role });
      // Redirection vers le dashboard du rôle
      const route = userData?.role || role;
      if (navigation?.replace) {
        navigation.replace(`/(app)/${route}`);
      } else {
        navigation?.navigate(`/(app)/${route}`);
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

              {/* Sélecteur de rôle — badges déroulants */}
              <View style={{ gap: spacing.xs }}>
                <EruditText style={{
                  fontSize: 12, color: colors.textTertiary,
                  fontWeight: '500', letterSpacing: 0.3,
                }}>
                  Rôle
                </EruditText>
                <View style={{
                  flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
                }}>
                  {ROLES.map(r => (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setRole(r.key)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={r.label}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        paddingHorizontal: 10, paddingVertical: 6,
                        borderRadius: radius.md,
                        backgroundColor: role === r.key
                          ? (ROLE_COLORS[r.key] || colors.primary)
                          : colors.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: role === r.key
                          ? (ROLE_COLORS[r.key] || colors.primary)
                          : colors.border,
                      }}
                    >
                      <EruditText style={{ fontSize: 12 }}>{r.icon}</EruditText>
                      <EruditText style={{
                        fontSize: 11, fontWeight: '600',
                        color: role === r.key ? '#FFFFFF' : colors.textSecondary,
                      }}>
                        {r.label}
                      </EruditText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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