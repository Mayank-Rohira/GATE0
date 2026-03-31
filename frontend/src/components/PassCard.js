import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, interpolateColor } from 'react-native-reanimated';
import { User, Phone } from 'lucide-react-native';
import StatusBadge from './StatusBadge';
import { COLORS } from '../constants/colors';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
        ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function PassCard({ pass, variant = 'resident', onPress }) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.98, { stiffness: 400, damping: 20 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedTouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={[
                {
                    backgroundColor: COLORS.background.card, // surface-container-lowest (#ffffff)
                    borderRadius: 24, // md radius
                    marginBottom: 16,
                    padding: 20,
                    // Ambient Glow
                    ...Platform.select({
                        ios: { shadowColor: '#292e3d', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.06, shadowRadius: 32 },
                        android: { elevation: 2 },
                    }),
                    ...(variant === 'visitor' && pass.status === 'approved' ? { opacity: 0.8 } : {})
                },
                animatedStyle
            ]}
        >
            {/* Top Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, ...Platform.select({ web: { userSelect: 'text' } }) }}>
                <Text selectable={true} style={{ fontSize: 18, fontWeight: '800', color: COLORS.text.primary, flex: 1, marginRight: 8, letterSpacing: -0.5 }} numberOfLines={1}>
                    {pass.service_name}
                </Text>
                <StatusBadge status={pass.status} />
            </View>

            {/* Second Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <User size={16} color={COLORS.accent.primary} />
                </View>
                <View style={{ ...Platform.select({ web: { userSelect: 'text' } }) }}>
                    <Text selectable={true} style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary }}>
                        {variant === 'resident' ? pass.visitor_name : `Auth by: ${pass.resident_name || 'Resident'}`}
                    </Text>
                    {variant === 'resident' && pass.visitor_mobile && (
                        <Text selectable={true} style={{ fontSize: 13, color: COLORS.text.secondary, marginTop: 2 }}>
                            {pass.visitor_mobile}
                        </Text>
                    )}
                </View>
            </View>

            {/* Third Row: Tonal separation instead of border */}
            <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: COLORS.background.surface,
                marginHorizontal: -20,
                marginBottom: -20,
                padding: 16,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24
            }}>
                <View style={{
                    backgroundColor: COLORS.background.card,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    ...Platform.select({ web: { userSelect: 'text' } })
                }}>
                    <Text selectable={true} style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.accent.tertiary }} numberOfLines={1}>
                        {variant === 'visitor' ? `${pass.house_number}, ${pass.society_name}` : pass.house_number}
                    </Text>
                </View>

                <Text selectable={true} style={{ fontSize: 12, fontWeight: '600', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {formatDate(pass.created_at)}
                </Text>
            </View>
        </AnimatedTouchableOpacity>
    );
}
