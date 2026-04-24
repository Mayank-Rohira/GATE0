import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Platform, 
    StyleSheet, 
    Dimensions, 
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    Home, 
    Shield, 
    User, 
    ChevronRight 
} from 'lucide-react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    Easing,
    interpolate,
    interpolateColor,
    Extrapolation
} from 'react-native-reanimated';

import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const APP_WIDTH = Math.min(SCREEN_WIDTH, 420);

const ROLE_DATA = [
    { id: 'resident', label: 'Resident', icon: Home, description: 'Manage your household access' },
    { id: 'visitor', label: 'Visitor', icon: User, description: 'Enter with a pass code' },
    { id: 'guard', label: 'Security', icon: Shield, description: 'Monitor and scan tokens' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// --- Background Components ---

function BackgroundRender({ progress }) {
    return (
        <View style={styles.backgroundWrapper}>
            <Animated.View 
                style={[
                    styles.backgroundContainer,
                    useAnimatedStyle(() => ({
                        opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
                        transform: [{ scale: interpolate(progress.value, [0, 0.4], [1.05, 1], Extrapolation.CLAMP) }]
                    }))
                ]}
            >
                <Image 
                    source={require('../../assets/branding/manhattan_new.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
            </Animated.View>

            {/* High-Speed Scanline (Holographic Effect) */}
            <Animated.View 
                style={[
                    styles.scanline,
                    useAnimatedStyle(() => ({
                        top: interpolate(progress.value, [0.4, 0.9], [-100, SCREEN_HEIGHT + 100], Extrapolation.CLAMP),
                        opacity: interpolate(progress.value, [0.4, 0.5, 0.8, 0.9], [0, 0.4, 0.4, 0], Extrapolation.CLAMP)
                    }))
                ]}
            />
            
            <View style={styles.overlay} />
        </View>
    );
}

// --- Interaction Components ---

function RoleCard({ label, description, icon: Icon, onPress, index, progress }) {
    // 0.82 - 1.0: Role select appearing
    const cardStart = 0.82 + (index * 0.04); 

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [cardStart, cardStart + 0.1], [0, 1], Extrapolation.CLAMP);
        const translateY = interpolate(progress.value, [cardStart, cardStart + 0.1], [20, 0], Extrapolation.CLAMP);
        
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    return (
        <AnimatedTouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.roleCard, animatedStyle]}
        >
            <View style={styles.roleIconBox}>
                <Icon size={18} color={COLORS.accent.primary} strokeWidth={1.5} />
            </View>
            <View style={styles.roleTextGroup}>
                <Text style={styles.roleLabel}>{label}</Text>
                <Text style={styles.roleDesc}>{description}</Text>
            </View>
            <ChevronRight size={16} color={COLORS.text.muted} />
        </AnimatedTouchableOpacity>
    );
}

export default function RoleSelectScreen({ navigation }) {
    const masterProgress = useSharedValue(0);

    useEffect(() => {
        StatusBar.setBarStyle('light-content');

        // Linear 5 second animation (0 to 1)
        masterProgress.value = withTiming(1, { 
            duration: 5000, 
            easing: Easing.bezier(0.4, 0, 0.2, 1) 
        });
    }, []);


    const brandStyle = useAnimatedStyle(() => ({
        opacity: interpolate(masterProgress.value, [0.35, 0.5], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: interpolate(masterProgress.value, [0.35, 0.5], [10, 0], Extrapolation.CLAMP) }],
        letterSpacing: interpolate(masterProgress.value, [0.35, 0.6], [10, 18], Extrapolation.CLAMP),
    }));

    const subGlowStyle = useAnimatedStyle(() => {
        // Appears after GATE0 (0.35-0.5)
        const opacity = interpolate(masterProgress.value, [0.55, 0.65], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    const subTextStyle = useAnimatedStyle(() => {
        // Appears after the Glow (0.55-0.65)
        const opacity = interpolate(masterProgress.value, [0.65, 0.8], [0, 1], Extrapolation.CLAMP);
        const color = interpolateColor(masterProgress.value, [0.65, 0.8], ['rgba(245, 197, 66, 0.2)', 'rgba(245, 197, 66, 1)']);
        
        return {
            opacity,
            color
        };
    });

    return (
        <View style={styles.container}>
            <BackgroundRender progress={masterProgress} />
            
            <View style={styles.mainWrapper}>
                <SafeAreaView style={styles.heroSection}>
                    <View style={styles.heroInner}>
                        <Animated.Text style={[styles.wordmark, brandStyle]}>
                            GATE0
                        </Animated.Text>

                        <View style={styles.subtitleContainer}>
                            <Animated.View style={[styles.subtitleGlow, subGlowStyle]} />
                            <Animated.Text style={[styles.subtitle, subTextStyle]}>
                                Intelligent residential access
                            </Animated.Text>
                        </View>

                        <View style={styles.rolesGrid}>
                            {ROLE_DATA.map((role, i) => (
                                <RoleCard 
                                    key={role.id}
                                    index={i}
                                    progress={masterProgress}
                                    {...role}
                                    onPress={() => navigation.navigate('Login', { role: role.id })}
                                />
                            ))}
                        </View>
                    </View>
                </SafeAreaView>

                <View style={styles.footer}>
                    <Text style={styles.footerBrand}>GATE0</Text>
                    <View style={styles.footerLine} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },
    mainWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    backgroundWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: '#000',
    },
    backgroundContainer: {
        width: APP_WIDTH,
        height: SCREEN_HEIGHT,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    backgroundImage: {
        width: APP_WIDTH,
        height: SCREEN_HEIGHT * 1.2,
        position: 'absolute',
        top: 0,
        ...Platform.select({
            web: {
                filter: 'contrast(1.2) brightness(0.7) saturate(0.8)',
            }
        })
    },
    scanline: {
        position: 'absolute',
        width: '100%',
        maxWidth: 420,
        height: 2,
        backgroundColor: '#fff',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        zIndex: 5,
    },
    overlay: {
        position: 'absolute',
        width: '100%',
        maxWidth: 420,
        height: '100%',
        backgroundColor: 'rgba(7, 8, 9, 0.3)',
    },
    heroSection: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 40,
    },
    heroInner: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    wordmark: {
        fontSize: SCREEN_WIDTH > 400 ? 76 : 64,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 10 },
        textShadowRadius: 20,
        ...Platform.select({
            web: { fontFamily: 'Cormorant Garamond, serif', fontWeight: '300' },
            ios: { fontFamily: 'CormorantGaramond-Light', fontWeight: '300' },
        })
    },
    subtitleContainer: {
        marginBottom: 32,
    },
    subtitle: {
        fontSize: SCREEN_WIDTH > 400 ? 12 : 11,
        letterSpacing: 8,
        textTransform: 'uppercase',
        textAlign: 'center',
        fontWeight: '900',
        textShadowColor: 'rgba(200, 150, 60, 0.6)', 
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
        ...Platform.select({
            web: { fontFamily: 'Outfit, sans-serif' },
        })
    },
    subtitleGlow: {
        position: 'absolute',
        top: -20,
        left: -40,
        right: -40,
        bottom: -20,
        backgroundColor: 'rgba(200, 150, 60, 0.15)',
        borderRadius: 40,
        filter: Platform.OS === 'web' ? 'blur(30px)' : undefined,
        zIndex: -1,
    },
    rolesGrid: {
        width: '100%',
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0b0d', // Solid opaque black
        borderWidth: 1,
        borderColor: 'rgba(200, 150, 60, 0.15)',
        padding: 20,
        marginBottom: 16,
        width: '100%',
        borderRadius: 4,
    },
    roleIconBox: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        backgroundColor: 'rgba(200, 150, 60, 0.05)',
        borderRadius: 8,
    },
    roleTextGroup: {
        flex: 1,
    },
    roleLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 2,
        ...Platform.select({
            web: { fontFamily: 'Outfit' },
        })
    },
    roleDesc: {
        fontSize: 12,
        color: COLORS.text.secondary,
        ...Platform.select({
            web: { fontFamily: 'Outfit' },
        })
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 40,
    },
    footerBrand: {
        fontSize: 10,
        letterSpacing: 8,
        color: COLORS.text.primary,
        opacity: 0.9,
        fontWeight: '300',
        marginBottom: 12,
        ...Platform.select({
            web: { fontFamily: 'Outfit' },
        })
    },
    footerLine: {
        width: 40,
        height: 1,
        backgroundColor: 'rgba(200, 150, 60, 0.4)',
    },
});
