import React from 'react';
import { Text, Pressable, ActivityIndicator, Platform, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ButtonColorful({ title, icon: Icon, onPress, loading, style, textStyle, width, height = 56, ...props }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { stiffness: 400, damping: 20 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 20 });
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={loading}
      style={[
        {
          height,
          width,
          borderRadius: 24, // 1.5rem = 24px
          overflow: 'hidden',
          opacity: loading ? 0.7 : 1,
          // Ambient Glow handled by wrapper if needed, but simple shadow here
          ...Platform.select({
            ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
            android: { elevation: 6 },
            web: { boxShadow: `0 8px 16px ${COLORS.accent.primary}30` }
          })
        },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={[COLORS.accent.primary, COLORS.accent.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.background.primary} />
        ) : (
          <>
            {Icon && <Icon size={20} color={COLORS.background.primary} style={{ marginRight: title ? 10 : 0 }} />}
            {title && <Text style={[{ color: COLORS.background.primary, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }, textStyle]}>{title}</Text>}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
