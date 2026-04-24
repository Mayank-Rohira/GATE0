import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function DockItem({ item, isActive, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { stiffness: 300, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 300, damping: 15 });
  };

  const Icon = item.icon;

  return (
    <AnimatedTouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          borderRadius: 16,
          backgroundColor: isActive ? COLORS.accent.primaryDeep : COLORS.background.card,
          borderWidth: 1,
          borderColor: isActive ? COLORS.accent.primary : COLORS.border.subtle,
          marginHorizontal: 4,
          ...Platform.select({
            web: isActive ? { boxShadow: `0 0 16px ${COLORS.accent.primaryDeep}80` } : {},
            default: {},
          }),
        },
        animatedStyle,
      ]}
    >
      <Icon size={24} color={isActive ? COLORS.text.primary : COLORS.accent.primary} />
      <Text style={{ 
        color: isActive ? COLORS.text.primary : COLORS.text.secondary, 
        fontSize: 10, 
        fontWeight: '600', 
        marginTop: 4 
      }}>
        {item.label}
      </Text>
    </AnimatedTouchableOpacity>
  );
}

export function Dock({ items, activeIndex, onSelect }) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: COLORS.background.surface,
      borderColor: COLORS.border.subtle,
      borderTopWidth: 1,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 12, // safe area padding
    }}>
      {items.map((item, index) => (
        <DockItem
          key={item.label}
          item={item}
          isActive={activeIndex === index}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}
