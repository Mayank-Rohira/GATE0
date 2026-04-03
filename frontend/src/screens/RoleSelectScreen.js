import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Shield, User, ChevronRight } from 'lucide-react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay,
    Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Ellipse, Circle } from 'react-native-svg';

import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROLE_DATA = [
    { id: 'resident', label: 'Resident', icon: Home, description: 'Manage your household access' },
    { id: 'visitor', label: 'Visitor', icon: User, description: 'Enter with a pass code' },
    { id: 'guard', label: 'Security', icon: Shield, description: 'Monitor and scan tokens' },
];

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function Skyscraper({ x, y, width, height, color, delay, duration }) {
    const scaleY = useSharedValue(0);

    useEffect(() => {
        scaleY.value = withDelay(delay, withTiming(1, { 
            duration, 
            easing: Easing.bezier(0.2, 0, 0.2, 1) 
        }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: height * (1 - scaleY.value) },
            { scaleY: scaleY.value }
        ],
    }));

    return (
        <AnimatedRect 
            x={x} y={y} 
            width={width} height={height} 
            fill={color} 
            style={animatedStyle}
        />
    );
}

function RoleCard({ label, description, icon: Icon, onPress, index }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        // Appears after the brand and building (around 3.5s)
        opacity.value = withDelay(3500 + index * 300, withTiming(1, { duration: 600 }));
        translateY.value = withDelay(3500 + index * 300, withTiming(0, { duration: 600 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <AnimatedTouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.roleBtn, animatedStyle]}
        >
            <View style={styles.roleBtnIcon}>
                <Icon size={18} color={COLORS.accent.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.roleTitle}>{label}</Text>
                <Text style={styles.roleDesc}>{description}</Text>
            </View>
            <ChevronRight size={16} color={COLORS.text.muted} />
        </AnimatedTouchableOpacity>
    );
}

export default function RoleSelectScreen({ navigation }) {
    const pillOpacity = useSharedValue(0);
    const brandOpacity = useSharedValue(0);
    const subOpacity = useSharedValue(0);

    useEffect(() => {
        // Timeline for 5-second majestic load
        // Building blocks (0s - 2.5s)
        // Pill appears (2.5s)
        pillOpacity.value = withDelay(2500, withTiming(1, { duration: 500 }));
        // Brand appears (3.0s)
        brandOpacity.value = withDelay(3000, withTiming(1, { duration: 800 }));
        // Subtitle appears (3.5s)
        subOpacity.value = withDelay(3500, withTiming(1, { duration: 800 }));
    }, []);

    const pillStyle = useAnimatedStyle(() => ({
        opacity: pillOpacity.value,
        transform: [{ translateY: (1 - pillOpacity.value) * 10 }],
    }));

    const brandStyle = useAnimatedStyle(() => ({
        opacity: brandOpacity.value,
        transform: [{ scale: 0.95 + brandOpacity.value * 0.05 }],
    }));

    const subStyle = useAnimatedStyle(() => ({
        opacity: subOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Background Majestic Building Montage */}
            <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
                    <Rect width="400" height="800" fill="#070809" />
                    
                    {/* Skyscrapers rising sequence */}
                    <Skyscraper x="100" y="200" width="200" height="600" color="#0d1018" delay={100} duration={2000} />
                    <Skyscraper x="130" y="160" width="140" height="640" color="#0f1216" delay={400} duration={1800} />
                    <Skyscraper x="160" y="120" width="80" height="680" color="#111520" delay={700} duration={1600} />
                    <Skyscraper x="180" y="80" width="40" height="720" color="#131820" delay={1000} duration={1400} />

                    {/* Architectural Detail Grids */}
                    {[140, 160, 180, 200, 220, 240, 260].map(x => (
                        <Rect key={x} x={x} y="0" width="1" height="800" fill="#0a0c10" opacity={0.3} />
                    ))}
                    {[100, 200, 300, 400, 500, 600, 700].map(y => (
                        <Rect key={y} x="0" y={y} width="400" height="1" fill="#0a0c10" opacity={0.3} />
                    ))}

                    <Ellipse cx="200" cy="780" rx="150" ry="40" fill={COLORS.accent.primary} opacity={0.06} />
                    
                    {/* Tech particles */}
                    <Circle cx="50" cy="150" r="1.2" fill={COLORS.accent.primary} opacity={0.3} />
                    <Circle cx="350" cy="280" r="1" fill={COLORS.accent.primary} opacity={0.2} />
                    <Circle cx="120" cy="500" r="0.8" fill="#e8d0a0" opacity={0.15} />
                </Svg>
            </View>

            {/* Dark Overlay for content clarity */}
            <View style={styles.overlay} />

            <SafeAreaView style={styles.content}>
                <View style={styles.centeredGroup}>
                    <Animated.View style={[styles.statusPill, pillStyle]}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>SYSTEM ONLINE</Text>
                    </Animated.View>

                    <Animated.Text style={[styles.brandName, brandStyle]}>
                        GATE0
                    </Animated.Text>

                    <Animated.View style={subStyle}>
                        <Text style={styles.brandSub}>Intelligent residential access</Text>
                    </Animated.View>
                </View>

                <View style={styles.rolesContainer}>
                    {ROLE_DATA.map((role, index) => (
                        <RoleCard 
                            key={role.id}
                            label={role.label}
                            description={role.description}
                            icon={role.icon}
                            index={index}
                            onPress={() => navigation.navigate('Login', { role: role.id })}
                        />
                    ))}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(7, 8, 9, 0.45)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    centeredGroup: {
        alignItems: 'center',
        marginBottom: 60,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(200, 150, 60, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(200, 150, 60, 0.25)',
        borderRadius: 100,
        paddingVertical: 5,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent.primary,
        marginRight: 10,
    },
    statusText: {
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.accent.primary,
        fontWeight: '700',
    },
    brandName: {
        fontSize: 72,
        color: COLORS.text.brand,
        letterSpacing: 18,
        textAlign: 'center',
        marginBottom: 16,
        ...Platform.select({
            web: { 
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: '300'
            },
            ios: { fontFamily: 'CormorantGaramond-Light', fontWeight: '300' },
            android: { fontFamily: 'serif', fontWeight: 'normal' }
        })
    },
    brandSub: {
        fontSize: 12,
        letterSpacing: 6,
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        textAlign: 'center',
        ...Platform.select({
            web: { fontFamily: 'Outfit, sans-serif' },
        })
    },
    rolesContainer: {
        width: '100%',
        marginTop: 20,
    },
    roleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        width: '100%',
    },
    roleBtnIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(200, 150, 60, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(200, 150, 60, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    roleTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 3,
        textAlign: 'center',
    },
    roleDesc: {
        fontSize: 11,
        color: COLORS.text.secondary,
        textAlign: 'center',
    }
});
