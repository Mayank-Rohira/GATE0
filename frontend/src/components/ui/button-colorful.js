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
    scale.value = withSpring(0.96, { stiffness: 300, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 300, damping: 15 });
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
          borderRadius: 14,
          overflow: 'hidden', // to clip gradient
          opacity: loading ? 0.7 : 1,
        },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={[COLORS.accent.primaryDeep, COLORS.accent.primary, COLORS.accent.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.text.onPrimary} />
        ) : (
          <>
            {Icon && <Icon size={20} color={COLORS.text.onPrimary} style={{ marginRight: title ? 10 : 0 }} />}
            {title && <Text style={[{ color: COLORS.text.onPrimary, fontSize: 16, fontWeight: '800' }, textStyle]}>{title}</Text>}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
