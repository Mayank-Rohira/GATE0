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
                    backgroundColor: COLORS.background.card,
                    borderRadius: 12,
                    marginBottom: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: COLORS.border.subtle,
                    // Tactile surfacing
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
                        android: { elevation: 3 },
                        web: { boxShadow: '0 4px 12px rgba(0,0,0,0.5)', userSelect: 'text' }
                    }),
                    ...(variant === 'visitor' && pass.status === 'approved' ? { opacity: 0.8 } : {})
                },
                animatedStyle
            ]}
        >
            {/* Top Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text selectable={true} style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    {pass.service_name}
                </Text>
                <StatusBadge status={pass.status} />
            </View>

            {/* Second Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                    <User size={18} color={COLORS.accent.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text selectable={true} style={{ fontSize: 17, fontWeight: '700', color: COLORS.text.primary, letterSpacing: -0.2 }}>
                        {variant === 'resident' ? pass.visitor_name : `${pass.resident_name || 'Resident'}`}
                    </Text>
                    {variant === 'resident' && pass.visitor_mobile && (
                        <Text selectable={true} style={{ fontSize: 13, color: COLORS.text.muted, marginTop: 2, letterSpacing: 0.5 }}>
                            {pass.visitor_mobile}
                        </Text>
                    )}
                </View>
            </View>

            {/* Third Row: Tactile Floor */}
            <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: COLORS.background.surface,
                marginHorizontal: -20,
                marginBottom: -20,
                marginTop: 4,
                padding: 16,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                borderTopWidth: 1,
                borderTopColor: COLORS.border.subtle
            }}>
                <Text selectable={true} style={{ fontSize: 11, fontWeight: '800', color: COLORS.accent.primary, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    LOC: {variant === 'visitor' ? `${pass.house_number}` : pass.house_number}
                </Text>

                <Text selectable={true} style={{ fontSize: 11, fontWeight: '600', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {formatDate(pass.created_at)}
                </Text>
            </View>
        </AnimatedTouchableOpacity>

    );
}
