/**
 * ============================================================================
 * EruditModal — Modale Érudit v4 (React Native)
 *
 * Remplace le Modal de react-native-paper.
 * Backdrop semi-transparent + carte centrée avec animation fade/scale.
 *
 * Usage :
 *   <EruditModal visible={visible} onDismiss={() => setVisible(false)}>
 *     <EruditModal.Header title="Ajouter une note" />
 *     <EruditModal.Body>...</EruditModal.Body>
 *     <EruditModal.Footer>...</EruditModal.Footer>
 *   </EruditModal>
 * ============================================================================
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Pressable, Modal, Animated, StyleSheet,
  Dimensions, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useTheme } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ─── Composant principal ────────────────────────────────────────────────── */

export default function EruditModal({
  visible = false,
  onDismiss,
  children,
  title,
  maxHeight = SCREEN_HEIGHT * 0.75,
  showCloseButton = true,
  style,
}) {
  const { colors, shadows, radius, spacing } = useTheme();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 10, tension: 100, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.96, duration: 150, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  const cardStyle = useMemo(() => ({
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxHeight,
    overflow: 'hidden',
    ...shadows.level5,
  }), [colors, shadows, radius, maxHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Animated.View style={{
          flex: 1,
          backgroundColor: 'rgba(31,28,25,0.5)',
          opacity: backdropOpacity,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Pressable
            style={{ ...StyleSheet.absoluteFillObject }}
            onPress={onDismiss}
            accessibilityLabel="Fermer la modale"
          />
        </Animated.View>

        {/* Card */}
        <Animated.View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        }}>
          <View style={cardStyle}>
            {/* Header */}
            {title || showCloseButton ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: title ? spacing.md : 0,
              }}>
                {title ? (
                  <Text style={{
                    fontFamily: 'Georgia',
                    fontSize: 17,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    flex: 1,
                  }} numberOfLines={1}>
                    {title}
                  </Text>
                ) : <View style={{ flex: 1 }} />}
                {showCloseButton ? (
                  <Pressable
                    onPress={onDismiss}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Fermer"
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceSubtle,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Body */}
            <ScrollView
              style={{ maxHeight }}
              contentContainerStyle={{
                paddingHorizontal: spacing.lg,
                paddingVertical: title ? spacing.md : spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Sous-composants pratiques ──────────────────────────────────────────── */

function ModalHeader({ title, onDismiss, children }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    }}>
      {title ? (
        <Text style={{ fontFamily: 'Georgia', fontSize: 17, fontWeight: '600', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      {children}
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={12} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ModalBody({ children }) {
  const { spacing } = useTheme();
  return <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>{children}</View>;
}

function ModalFooter({ children }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: 0, gap: spacing.md,
      borderTopWidth: 1, borderTopColor: colors.border,
    }}>
      {children}
    </View>
  );
}

EruditModal.Header = ModalHeader;
EruditModal.Body = ModalBody;
EruditModal.Footer = ModalFooter;

