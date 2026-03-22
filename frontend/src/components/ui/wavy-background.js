import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

export function WavyBackground({
  children,
  colors = [COLORS.accent.primaryDeep, COLORS.accent.primary, COLORS.accent.secondaryDeep, COLORS.accent.secondary, COLORS.border.subtle],
  backgroundFill = COLORS.background.primary,
  blur = 14,
  waveOpacity = 0.35,
  speed = 'slow',
  waveWidth = 50,
}) {
  const durationBase = speed === 'slow' ? 20000 : 10000;

  // Create animated blobs
  const blobs = colors.map(() => ({
    x: useSharedValue(Math.random() * width),
    y: useSharedValue(Math.random() * height),
    scale: useSharedValue(1),
  }));

  useEffect(() => {
    blobs.forEach((blob) => {
      blob.x.value = withRepeat(withTiming(Math.random() * width, { duration: durationBase + Math.random() * 5000, easing: Easing.linear }), -1, true);
      blob.y.value = withRepeat(withTiming(Math.random() * height, { duration: durationBase + Math.random() * 5000, easing: Easing.linear }), -1, true);
      blob.scale.value = withRepeat(withTiming(1.2 + Math.random() * 0.5, { duration: durationBase, easing: Easing.linear }), -1, true);
    });
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: backgroundFill, overflow: 'hidden' }]}>
      {colors.map((color, i) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: blobs[i].x.value - width * 0.5 },
            { translateY: blobs[i].y.value - height * 0.5 },
            { scale: blobs[i].scale.value },
          ],
          opacity: waveOpacity,
        }));
        
        return (
          <Animated.View
            key={`blob-${i}`}
            style={[
              {
                position: 'absolute',
                width: width * (waveWidth / 50) * 1.5,
                height: width * (waveWidth / 50) * 1.5,
                backgroundColor: color,
                borderRadius: width * (waveWidth / 50),
                filter: Platform.OS === 'web' ? `blur(${blur * 4}px)` : undefined,
              },
              animatedStyle,
            ]}
          />
        );
      })}
      
      {/* Fallback overlay for native if filter doesn't work */}
      {Platform.OS !== 'web' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: backgroundFill, opacity: 0.8 }]} />
      )}

      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}
