import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { ShieldAlert, Zap, Keyboard } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import BottomSheet, { BottomSheetTextInput, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import { COLORS } from '../constants/colors';
import { ButtonColorful } from '../components/ui/button-colorful';
import { decryptPassData } from '../utils/crypto';

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
    const [torch, setTorch] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [scanError, setScanError] = useState(null);
    const isFocused = useIsFocused();
    
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['40%'], []);
    const flashOpacity = useSharedValue(0);

    useEffect(() => {
        if (isFocused) { 
            setScanned(false);
            setIsVerifying(false);
            setScanError(null);
            flashOpacity.value = 0;
        }
    }, [isFocused]);

    const handleBarcodeScanned = useCallback(({ data }) => {
        if (scanned || isVerifying) return;
        setScanned(true);
        setIsVerifying(true);

        // Flash screen logic
        flashOpacity.value = withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(0, { duration: 200 })
        );

        // Synthetic verification delay for "high-stakes" feel
        setTimeout(() => {
            try {
                // Try to decrypt the data first
                const decryptedData = decryptPassData(data);
                const parsedData = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;
                
                if (parsedData?.pass_code) {
                    const passCode = String(parsedData.pass_code).trim().toUpperCase();
                    const passToNavigate = { ...parsedData, id: passCode, pass_code: passCode };
                    console.log('[SCANNER] Navigating with pass_code:', passToNavigate.pass_code);
                    setIsVerifying(false);
                    navigation.navigate('ScanResult', { passData: passToNavigate });
                    return;
                }
            } catch (e) {
                // FALLBACK logic (stay in try/catch or go to fallback)
            }

            // If we reach here, it's an invalid scan
            setScanError('INVALID FORMAT detected');
            flashOpacity.value = withSequence(
                withTiming(1, { duration: 100 }),
                withTiming(0, { duration: 400 })
            );
            
            setTimeout(() => {
                setScanError(null);
                setIsVerifying(false);
                setScanned(false);
            }, 1000); // 1s cooldown for recovery
        }, 1200); // 1.2s synthetic delay
    }, [scanned, isVerifying, navigation]);

    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        bottomSheetRef.current?.close();
        
        let code = manualCode.trim();
        if (!code.toUpperCase().startsWith('PASS_')) {
            code = `PASS_${code}`;
        }
        
        navigation.navigate('ScanResult', { passData: { id: code.toUpperCase(), pass_code: code.toUpperCase() } });
        setManualCode('');
    };

    const renderBackdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ), []);

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
        backgroundColor: scanError ? COLORS.status.error : COLORS.status.success,
    }));

    if (!permission) return (
        <View style={{ flex: 1, backgroundColor: COLORS.background.primary }} />
    );

    if (!permission.granted) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <ShieldAlert size={48} color={COLORS.text.muted} style={{ marginBottom: 24 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8, fontFamily: 'Montserrat' }}>Camera Access Required</Text>
                <Text style={{ color: COLORS.text.secondary, textAlign: 'center', marginBottom: 32, fontFamily: 'Montserrat' }}>
                    GATE0 Security needs permission to use your camera for scanning digital passes.
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
                                <Text style={{ fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: -1.5 }}>GATE0</Text>
                                <View style={{ backgroundColor: COLORS.background.cardHigh, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border.tactile }}>
                                    <Text selectable={true} style={{ fontSize: 11, fontWeight: '800', color: COLORS.accent.primary, textTransform: 'uppercase', letterSpacing: 2 }}>SCANNER UNIT</Text>
                                </View>
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
                                <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: COLORS.accent.primary, marginBottom: 8 }}>{isVerifying ? 'NETWORK_SYNC_ACTIVE' : 'SYSTEM_READY'}</Text>
                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isVerifying ? COLORS.accent.primary : COLORS.status.success }} />
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ffffff', opacity: 0.2 }} />
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ffffff', opacity: 0.2 }} />
                                </View>
                            </View>
                        </View>

                        {/* Bottom Floating Bar */}
                        <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
                            <View style={styles.bottomBar}>
                                <TouchableOpacity 
                                    onPress={() => setTorch(!torch)}
                                    style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: torch ? COLORS.accent.primary : 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Zap size={24} color={torch ? '#ffffff' : 'rgba(255,255,255,0.6)'} />
                                </TouchableOpacity>
                                
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <View style={{ 
                                        backgroundColor: scanError ? COLORS.status.error : (scanned ? COLORS.accent.primary : 'rgba(255,255,255,0.1)'), 
                                        paddingHorizontal: 20, 
                                        paddingVertical: 10, 
                                        borderRadius: 24,
                                    }}>
                                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>
                                            {scanError ? scanError : (isVerifying ? 'RETRIEVING DATA...' : scanned ? 'VERIFYING...' : 'SYSTEM READY')}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    onPress={() => bottomSheetRef.current?.expand()}
                                    style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Keyboard size={24} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
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
                <View style={{ padding: 32, flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: COLORS.text.muted, marginBottom: 24, textAlign: 'center' }}>Manual Pass Verification</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, borderRadius: 8, height: 64, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: 32 }}>
                        <Keyboard size={20} color={COLORS.text.muted} style={{ marginRight: 16 }} />
                        <BottomSheetTextInput
                            style={{ flex: 1, fontSize: 18, color: COLORS.text.primary, height: '100%', fontWeight: '700', letterSpacing: 2.5 }}
                            placeholderTextColor={COLORS.text.muted}
                            placeholder="PASS_CODE"
                            value={manualCode}
                            onChangeText={setManualCode}
                            autoCapitalize="characters"
                        />
                    </View>

                    <ButtonColorful title="VERIFY PASS" onPress={handleManualSubmit} width="100%" height={64} style={{ borderRadius: 8 }} />
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
        backgroundColor: 'rgba(4, 4, 10, 0.75)',
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
        paddingHorizontal: 24,
        paddingVertical: 20,
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
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    scanFrame: { width: 260, height: 260, backgroundColor: 'transparent', position: 'relative' },
    corner: { 
        position: 'absolute', 
        width: 48, 
        height: 48, 
        borderColor: COLORS.accent.primary, 
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 24 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 24 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 24 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 24 },
});
