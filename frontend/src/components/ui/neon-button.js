import React from 'react';
import { Text, Pressable, ActivityIndicator, Platform, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeonButton({ outlineColor = COLORS.accent.primary, title, icon: Icon, onPress, loading, style, textStyle, width, height = 44, ...props }) {
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: outlineColor,
          backgroundColor: Platform.OS === 'web' ? 'transparent' : 'rgba(203,166,247,0.05)',
          ...Platform.select({
            web: {
              boxShadow: `0 0 12px ${outlineColor}99`, // glow
            },
            default: {},
          }),
        },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={outlineColor} />
      ) : (
        <>
          {Icon && <Icon size={18} color={outlineColor} style={{ marginRight: title ? 8 : 0 }} />}
          {title && <Text style={[{ color: outlineColor, fontSize: 13, fontWeight: '600' }, textStyle]}>{title}</Text>}
        </>
      )}
    </AnimatedPressable>
  );
}
