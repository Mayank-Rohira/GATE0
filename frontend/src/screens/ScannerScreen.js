import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { ShieldAlert, Zap, Keyboard } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, runOnJS } from 'react-native-reanimated';
import BottomSheet, { BottomSheetTextInput, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import { COLORS } from '../constants/colors';
import { NeonButton } from '../components/ui/neon-button';
import { ButtonColorful } from '../components/ui/button-colorful';
import { getUser } from '../hooks/useAuth';

function ScanLineAnimated({ scanned }) {
    const translateY = useSharedValue(0);

    useEffect(() => {
        if (!scanned) {
            translateY.value = withRepeat(
                withTiming(260, { duration: 1800, easing: Easing.linear }),
                -1,
                false
            );
        }
    }, [scanned]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: scanned ? 0 : 1,
    }));

    return (
        <Animated.View style={[
            {
                width: 260,
                height: 2,
                backgroundColor: COLORS.accent.primary,
                position: 'absolute',
                top: 0,
                ...Platform.select({
                    web: { boxShadow: `0 0 10px ${COLORS.accent.primary}` },
                    default: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 }
                })
            },
            animatedStyle
        ]} />
    );
}

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [userInitials, setUserInitials] = useState('GR');
    const isFocused = useIsFocused();
    
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['40%'], []);
    const flashOpacity = useSharedValue(0);

    useEffect(() => {
        if (isFocused) { 
            setScanned(false); 
            flashOpacity.value = 0;
            getUser().then(u => {
                if(u?.name) {
                    const parts = u.name.split(' ');
                    setUserInitials(parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : u.name.substring(0, 2).toUpperCase());
                }
            });
        }
    }, [isFocused]);

    const handleBarcodeScanned = useCallback(({ data }) => {
        if (scanned) return;
        setScanned(true);

        
        // Flash screen logic
        flashOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 200 })
        );

        setTimeout(() => {
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                if (parsedData && parsedData.id && String(parsedData.id).startsWith('PASS_')) {
                    navigation.navigate('ScanResult', { passData: parsedData });
                    return;
                }
            } catch (e) {
                if (typeof data === 'string' && data.startsWith('PASS_')) {
                    navigation.navigate('ScanResult', { passData: { id: data } });
                    return;
                }
            }
            
            // Invalid
            setScanned(false);
        }, 300);
    }, [scanned, navigation]);

    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        bottomSheetRef.current?.close();
        
        let code = manualCode.trim();
        if (!code.startsWith('PASS_')) {
            code = `PASS_${code}`;
        }
        
        navigation.navigate('ScanResult', { passData: { id: code } });
        setManualCode('');
    };

    const renderBackdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ), []);

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
        backgroundColor: COLORS.status.success,
    }));

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <ShieldAlert size={48} color={COLORS.text.muted} style={{ marginBottom: 24 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8, fontFamily: 'Montserrat' }}>Camera Access Required</Text>
                <Text style={{ color: COLORS.text.secondary, textAlign: 'center', marginBottom: 32, fontFamily: 'Montserrat' }}>
                    GateZero Security needs permission to use your camera for scanning digital passes.
                </Text>
                <ButtonColorful title="Allow Camera Access" onPress={requestPermission} width="100%" />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {isFocused ? (
                <CameraView
                    style={styles.camera}
                    facing="back"
                    enableTorch={torch}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                >
                    <View style={styles.overlay}>
                        
                        {/* Top Floating Bar */}
                        <SafeAreaView edges={['top']} style={styles.topBarContainer}>
                            <View style={styles.topBar}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat', flex: 1 }}>GATE0</Text>
                                <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2.5, color: COLORS.text.muted, fontFamily: 'Montserrat', flex: 1, textAlign: 'center' }}>Scanner</Text>
                                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }} />
                            </View>
                        </SafeAreaView>

                        {/* Scanner Area */}
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={styles.scanFrame}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                                
                                {/* Flash Overlay */}
                                <Animated.View style={[StyleSheet.absoluteFill, flashStyle]} />

                                <ScanLineAnimated scanned={scanned} />
                            </View>

                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: COLORS.text.primary, fontFamily: 'Montserrat', marginBottom: 8 }}>Scan GATE0 Pass</Text>
                                <Text style={{ fontSize: 12, color: COLORS.text.muted, fontFamily: 'Montserrat' }}>Point camera at the QR code on the pass</Text>
                            </View>
                        </View>

                        {/* Bottom Floating Bar */}
                        <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
                            <View style={styles.bottomBar}>
                                <TouchableOpacity 
                                    onPress={() => setTorch(!torch)}
                                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: torch ? COLORS.accent.primaryDeep : COLORS.background.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: torch ? COLORS.accent.primary : COLORS.border.subtle, flex: 1, maxWidth: 44 }}
                                >
                                    <Zap size={20} color={torch ? COLORS.text.primary : COLORS.text.muted} />
                                </TouchableOpacity>
                                
                                <View style={{ flex: 2, alignItems: 'center' }}>
                                    <View style={{ 
                                        backgroundColor: scanned ? '#0a2030' : COLORS.border.subtle, 
                                        paddingHorizontal: 16, 
                                        paddingVertical: 6, 
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: scanned ? COLORS.accent.secondary : 'transparent'
                                    }}>
                                        <Text style={{ color: scanned ? COLORS.accent.secondary : COLORS.text.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'Montserrat' }}>
                                            ● {scanned ? 'SCANNING' : 'READY'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <NeonButton title="Enter Code" onPress={() => bottomSheetRef.current?.expand()} width={90} height={36} textStyle={{ fontSize: 11 }} />
                                </View>
                            </View>
                        </SafeAreaView>

                    </View>
                </CameraView>
            ) : null}

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: COLORS.background.card }}
                handleIndicatorStyle={{ backgroundColor: COLORS.border.subtle }}
                keyboardBehavior="fillParent"
            >
                <View style={{ padding: 24, flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.text.muted, marginBottom: 20 }}>Manual Entry</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.input, borderRadius: 14, height: 56, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: 24 }}>
                        <Keyboard size={18} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                        <BottomSheetTextInput
                            style={{ flex: 1, fontSize: 16, fontFamily: 'Courier', color: COLORS.text.primary, height: '100%' }}
                            placeholderTextColor={COLORS.text.muted}
                            placeholder="PASS_------"
                            value={manualCode}
                            onChangeText={setManualCode}
                            autoCapitalize="characters"
                        />
                    </View>

                    <ButtonColorful title="Verify Code" onPress={handleManualSubmit} width="100%" height={56} />
                </View>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background.primary },
    camera: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    topBarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Platform.OS === 'web' ? 'rgba(13,13,20,0.88)' : COLORS.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.subtle,
        ...Platform.select({
            web: { backdropFilter: 'blur(20px)' },
            default: { opacity: 0.95 }
        })
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 0 : 16,
        backgroundColor: Platform.OS === 'web' ? 'rgba(13,13,20,0.88)' : COLORS.background.primary,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.subtle,
        ...Platform.select({
            web: { backdropFilter: 'blur(20px)' },
            default: { opacity: 0.95 }
        })
    },
    scanFrame: { width: 260, height: 260, backgroundColor: 'transparent', position: 'relative' },
    corner: { 
        position: 'absolute', 
        width: 32, 
        height: 32, 
        borderColor: COLORS.accent.primary, 
        borderWidth: 0,
        ...Platform.select({
            web: { boxShadow: `0 0 10px rgba(203,166,247,0.7)` },
            default: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10, elevation: 5 }
        })
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
});
