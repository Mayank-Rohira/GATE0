import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Platform, 
    StyleSheet, 
    Dimensions, 
    ScrollView, 
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
    useAnimatedProps,
    withTiming, 
    withDelay,
    withRepeat,
    withSequence,
    Easing,
    interpolate,
    interpolateColor,
    Extrapolation
} from 'react-native-reanimated';
import Svg, { Rect, G, Defs, LinearGradient, Stop, Ellipse, Circle } from 'react-native-svg';

import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ROLE_DATA = [
    { id: 'resident', label: 'Resident', icon: Home, description: 'Manage your household access' },
    { id: 'visitor', label: 'Visitor', icon: User, description: 'Enter with a pass code' },
    { id: 'guard', label: 'Security', icon: Shield, description: 'Monitor and scan tokens' },
];

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// --- Background Components ---

function BackgroundRender({ progress }) {
    // Holographic Reconstruction Reveal
    // We simulate 4 'slices' of the image 'compiling' on screen
    const slices = [0, 1, 2, 3];
    
    return (
        <View style={styles.backgroundWrapper}>
            <View style={styles.backgroundContainer}>
                {slices.map((i) => {
                    const startP = i * 0.15;
                    const endP = startP + 0.3;
                    
                    const sliceStyle = useAnimatedStyle(() => {
                        const opacity = interpolate(progress.value, [startP, endP], [0, 1], Extrapolation.CLAMP);
                        const translateX = interpolate(progress.value, [startP, endP], [i % 2 === 0 ? -15 : 15, 0], Extrapolation.CLAMP);
                        
                        return {
                            opacity,
                            transform: [{ translateX }]
                        };
                    });

                    return (
                        <Animated.View 
                            key={i} 
                            style={[
                                styles.sliceWrapper, 
                                { height: SCREEN_HEIGHT / 4, top: (SCREEN_HEIGHT / 4) * i },
                                sliceStyle
                            ]}
                        >
                            <Image 
                                source={require('../../assets/branding/manhattan_new.jpg')}
                                style={[
                                    styles.sliceImage,
                                    { top: -(SCREEN_HEIGHT / 4) * i }
                                ]}
                                resizeMode="cover"
                            />
                        </Animated.View>
                    );
                })}
            </View>

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
    // 0.9 - 1.0: Role select appearing (4.5s-5s)
    const cardProgress = 0.9 + (index * 0.03); // Stagger cards

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [cardProgress, cardProgress + 0.05], [0, 1], Extrapolation.CLAMP);
        const translateY = interpolate(progress.value, [cardProgress, cardProgress + 0.05], [30, 0], Extrapolation.CLAMP);
        const borderOpacity = interpolate(progress.value, [cardProgress, cardProgress + 0.05], [0, 1], Extrapolation.CLAMP);

        return {
            opacity,
            transform: [{ translateY }],
            borderColor: `rgba(37, 40, 48, ${borderOpacity})` // COLORS.border.tactile
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
        opacity: interpolate(masterProgress.value, [0.8, 0.88], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: interpolate(masterProgress.value, [0.8, 0.88], [20, 0], Extrapolation.CLAMP) }],
        letterSpacing: interpolate(masterProgress.value, [0.8, 0.95], [10, 18], Extrapolation.CLAMP),
    }));

    const subStyle = useAnimatedStyle(() => {
        const opacity = interpolate(masterProgress.value, [0.85, 0.92], [0, 1], Extrapolation.CLAMP);
        const color = interpolateColor(masterProgress.value, [0.85, 0.95], ['rgba(255,255,255,0.4)', '#c8963c']);
        
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

                        <Animated.View style={styles.subtitleContainer}>
                            <Animated.Text style={[styles.subtitle, subStyle]}>
                                Intelligent residential access
                            </Animated.Text>
                        </Animated.View>

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
        width: '100%',
        maxWidth: 420,
        height: SCREEN_HEIGHT,
        overflow: 'hidden',
    },
    sliceWrapper: {
        position: 'absolute',
        left: 0,
        width: '100%',
        overflow: 'hidden',
    },
    sliceImage: {
        width: 420,
        height: SCREEN_HEIGHT,
        position: 'absolute',
        left: 0,
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
        fontSize: 11,
        letterSpacing: 5,
        textTransform: 'uppercase',
        textAlign: 'center',
        fontWeight: '700',
        textShadowColor: '#c8963c',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        ...Platform.select({
            web: { fontFamily: 'Outfit, sans-serif' },
        })
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
