import React, { useEffect } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFonts, AbrilFatface_400Regular } from '@expo-google-fonts/abril-fatface';
import { Home, Truck, Shield } from 'lucide-react-native';

import { COLORS } from '../constants/colors';
import { WavyBackground } from '../components/ui/wavy-background';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ROLE_ICONS = {
    resident: Home,
    visitor: Truck,
    guard: Shield
};

function RoleCard({ label, role, onPress }) {
    const scale = useSharedValue(1);
    const borderAlpha = useSharedValue(0);
    const Icon = ROLE_ICONS[role];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: borderAlpha.value === 1 ? '#cba6f7' : '#313244',
        backgroundColor: borderAlpha.value === 1 ? 'rgba(203,166,247,0.08)' : 'rgba(17,17,27,0.82)',
        ...(Platform.OS === 'web' ? {
            boxShadow: borderAlpha.value === 1 ? '0 0 16px rgba(203,166,247,0.25)' : 'none',
        } : {
            shadowColor: '#cba6f7',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: borderAlpha.value === 1 ? 0.25 : 0,
            shadowRadius: 16,
        })
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { stiffness: 280, damping: 18 });
        borderAlpha.value = 1;
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 280, damping: 18 });
        borderAlpha.value = 0;
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.card, animatedStyle]}
        >
            <View style={styles.iconContainer}>
                <Icon size={32} color={COLORS.accent.primary} />
            </View>
            <Text style={styles.cardText}>{label}</Text>
        </AnimatedPressable>
    );
}

export default function RoleSelectScreen({ navigation }) {
    console.log('[RoleSelect] Initializing...');
    const [fontsLoaded, fontError] = useFonts({
        AbrilFatface_400Regular,
    });

    useEffect(() => {
        if (fontsLoaded) console.log('[RoleSelect] Fonts loaded successfully');
        if (fontError) console.error('[RoleSelect] Font loading error:', fontError);
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0d0d14', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#cdd6f4', fontSize: 16 }}>Loading Fonts...</Text>
                {fontError && <Text style={{ color: '#f38ba8', marginTop: 10 }}>{fontError.message}</Text>}
            </View>
        );
    }

    return (
        <WavyBackground
            colors={["#8839ef", "#cba6f7", "#313244", "#1e1e2e", "#6c6f85"]}
            backgroundFill="#0d0d14"
            blur={16}
            speed="slow"
            waveOpacity={0.3}
            waveWidth={65}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* GATE0 wordmark - top */}
                    <Text style={styles.wordmark}>GATE0</Text>

                    {/* 60px spacer */}
                    <View style={{ height: 60 }} />

                    {/* Three role cards stacked vertically as squares */}
                    <View style={styles.cardStack}>
                        <RoleCard label="Resident" role="resident" onPress={() => navigation.navigate('Login', { role: 'resident' })} />
                        <RoleCard label="Visitor" role="visitor" onPress={() => navigation.navigate('Login', { role: 'visitor' })} />
                        <RoleCard label="Guard" role="guard" onPress={() => navigation.navigate('Login', { role: 'guard' })} />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>v1.0 · GATE0 Access System</Text>
                    </View>
                </View>
            </SafeAreaView>
        </WavyBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    wordmark: {
        fontFamily: 'AbrilFatface_400Regular',
        fontSize: 72,
        color: '#cdd6f4',
        paddingTop: 80,
        letterSpacing: 6,
        textAlign: 'center',
        ...Platform.select({
            web: {
                textShadow: '0 0 40px rgba(203,166,247,0.7)',
            },
            default: {
                textShadowColor: 'rgba(203,166,247,0.7)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 40,
            },
        }),
    },
    cardStack: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    card: {
        width: 140, // Square shape
        height: 140, // Square shape
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(24px)',
            },
        }),
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(203,166,247,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(203,166,247,0.15)',
    },
    cardText: {
        fontFamily: 'AbrilFatface_400Regular',
        fontSize: 18,
        color: '#cdd6f4',
        textAlign: 'center',
    },
    footer: {
        marginTop: 40,
        marginBottom: 20,
    },
    footerText: {
        fontFamily: 'Courier',
        fontSize: 11,
        color: '#313244',
        textAlign: 'center',
    },
});
