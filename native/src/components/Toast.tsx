import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors, Fonts, FontSize } from '@/theme';

type ToastVariant = 'success' | 'error' | 'info';

type Props = {
  message: string;
  variant?: ToastVariant;
  onHide: () => void;
  duration?: number;
};

export function Toast({ message, variant = 'success', onHide, duration = 2800 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 280, useNativeDriver: true }),
      ]).start(onHide);
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const borderColor =
    variant === 'success' ? Colors.gold :
    variant === 'error'   ? 'rgba(220,80,80,0.9)' :
                            Colors.textMuted;

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY }], borderLeftColor: borderColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

// Hook for easier usage
import { useState, useCallback } from 'react';

type ToastState = { id: number; message: string; variant: ToastVariant } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, message, variant });
  }, []);

  const hide = useCallback(() => setToast(null), []);

  const ToastComponent = toast ? (
    <Toast
      key={toast.id}
      message={toast.message}
      variant={toast.variant}
      onHide={hide}
    />
  ) : null;

  return { show, ToastComponent };
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 96,
    left: 20,
    right: 20,
    backgroundColor: Colors.navyDeep,
    borderWidth: 0.5,
    borderColor: Colors.goldLine,
    borderLeftWidth: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 999,
  },
  text: {
    fontFamily: Fonts.jakarta,
    fontSize: FontSize.sm,
    color: Colors.ivory,
    lineHeight: 16,
  },
});
