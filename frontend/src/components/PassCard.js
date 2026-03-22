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
    const borderColorProgress = useSharedValue(0); 

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { stiffness: 300, damping: 15 });
        borderColorProgress.value = withTiming(1, { duration: 120 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 300, damping: 15 });
        borderColorProgress.value = withTiming(0, { duration: 120 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: interpolateColor(borderColorProgress.value, [0, 1], [COLORS.border.subtle, COLORS.accent.primary]),
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
                    borderWidth: 1,
                    borderRadius: 16,
                    marginBottom: 16,
                    overflow: 'hidden',
                    ...(variant === 'visitor' ? {
                        borderLeftWidth: 3,
                        borderLeftColor: pass.status === 'approved' ? COLORS.status.success : COLORS.accent.secondary,
                        opacity: pass.status === 'approved' ? 0.65 : 1,
                    } : {})
                },
                animatedStyle
            ]}
        >
            <View style={{ padding: 16 }}>
                {/* Top Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text.primary, fontFamily: 'Montserrat', flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {pass.service_name}
                    </Text>
                    <StatusBadge status={pass.status} />
                </View>

                {/* Second Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    {variant === 'resident' ? (
                        <>
                            <User size={12} color={COLORS.text.muted} />
                            <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.text.secondary, marginLeft: 6, fontFamily: 'Montserrat' }}>
                                {pass.visitor_name}
                            </Text>
                            
                            {pass.visitor_mobile && (
                                <>
                                    <Text style={{ color: COLORS.text.muted, marginHorizontal: 8 }}>·</Text>
                                    <Phone size={12} color={COLORS.text.muted} />
                                    <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.text.secondary, marginLeft: 6, fontFamily: 'Montserrat' }}>
                                        {pass.visitor_mobile}
                                    </Text>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <User size={12} color={COLORS.text.muted} />
                            <Text style={{ fontSize: 15, fontWeight: '400', color: COLORS.text.secondary, marginLeft: 6, fontFamily: 'Montserrat' }}>
                                Auth by: {pass.resident_name || 'Resident'}
                            </Text>
                        </>
                    )}
                </View>

                {/* Third Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{
                        backgroundColor: COLORS.background.surface,
                        borderWidth: 1,
                        borderColor: COLORS.border.subtle,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        maxWidth: '65%',
                    }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.text.primary, fontFamily: 'Montserrat' }} numberOfLines={1}>
                            {variant === 'visitor' ? `${pass.house_number}, ${pass.society_name}` : pass.house_number}
                        </Text>
                    </View>

                    <Text style={{ fontSize: 13, color: COLORS.text.muted, fontFamily: 'Courier' }}>
                        {formatDate(pass.created_at)}
                    </Text>
                </View>
            </View>
        </AnimatedTouchableOpacity>
    );
}
