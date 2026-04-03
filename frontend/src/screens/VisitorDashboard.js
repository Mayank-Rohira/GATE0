import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SectionList, RefreshControl, Platform, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { API_BASE } from '../config/api';
import { getToken, getUser } from '../hooks/useAuth';
import { encryptPassData } from '../utils/crypto';
import { UserCircle, Inbox, X, Share2, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import usePolling from '../hooks/usePolling';
import PassCard from '../components/PassCard';
import { COLORS } from '../constants/colors';

function LiveIndicator() {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 1200 }),
                withTiming(1, { duration: 1200 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        backgroundColor: COLORS.accent.primary,
    }));

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
            <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, marginRight: 8 }, animatedStyle]} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>Live Pass Feed</Text>
        </View>
    );
}

export default function VisitorDashboard({ navigation }) {
    const [passes, setPasses] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUserData] = useState(null);
    const [selectedPass, setSelectedPass] = useState(null);

    useEffect(() => {
        getUser().then(setUserData);
    }, []);

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const fetchPasses = useCallback(async () => {
        try {
            const token = await getToken();
            const u = await getUser();
            if (!token || !u) return;

            const res = await fetch(`${API_BASE}/passes/visitor/${u.mobile}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data && Array.isArray(data.passes)) {
                setPasses(data.passes);
                // Update selected pass if it exists in the new list to show latest status
                if (selectedPass) {
                    const updated = data.passes.find(p => p.id === selectedPass.id);
                    if (updated) setSelectedPass(updated);
                    // Note: If pass is deleted (e.g. Denied), we keep the modal open with stale data 
                    // until the user closes it manually to avoid sudden disappearance.
                }
            }
        } catch (err) { }
    }, [selectedPass]);

    usePolling(fetchPasses);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPasses();
        setRefreshing(false);
    };

    const pending = passes.filter((p) => p.status === 'pending');
    const approved = passes.filter((p) => p.status === 'approved');

    // User Requested: "active passes can appear on top", approved pushed to bottom.
    const sections = [];
    if (pending.length > 0) sections.push({ title: 'Active Passes', data: pending });
    if (approved.length > 0) sections.push({ title: 'Past Activity', data: approved });

    const getQRContent = (pass) => {
        if (!pass || !user) return "";
        const payload = {
            id: pass.pass_code,
            visitor_name: pass.visitor_name,
            visitor_mobile: pass.visitor_mobile,
            service_name: pass.service_name,
            resident_name: pass.resident_name || 'Resident',
            house_number: pass.house_number,
            society_name: pass.society_name,
        };
        return encryptPassData(payload);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
                
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ ...Platform.select({ web: { userSelect: 'text' } }) }}>
                        <Text selectable={true} style={{ fontSize: 34, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -1.5 }}>GATE0</Text>
                        <View style={{ backgroundColor: COLORS.status.successBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' }}>
                            <Text selectable={true} style={{ color: COLORS.status.success, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>VISITOR ACCESS</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 24, 
                            backgroundColor: 'rgba(200, 150, 60, 0.1)', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderWidth: 1.5,
                            borderColor: 'rgba(200, 150, 60, 0.4)',
                            ...Platform.select({
                                web: { boxShadow: '0 0 15px rgba(200, 150, 60, 0.25)' },
                                ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8 },
                                android: { elevation: 2 }
                            })
                        }}>
                            <Text style={{ color: COLORS.accent.primary, fontSize: 14, fontWeight: '800' }}>{getInitials(user?.name)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Live Indicator */}
                <View style={{ marginBottom: 24 }}>
                    <LiveIndicator />
                </View>

                {passes.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40, paddingHorizontal: 40 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <Inbox size={40} color={COLORS.text.muted} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, textAlign: 'center' }}>No Passes</Text>
                        <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22 }}>
                            No passes have been assigned to your mobile number. New passes will appear here in real-time.
                        </Text>
                    </View>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => (
                            <PassCard 
                                pass={item} 
                                variant="visitor" 
                                onPress={() => {
                                    setSelectedPass(item);
                                }} 
                            />
                        )}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: COLORS.text.muted, marginBottom: 16, marginTop: 24, marginLeft: 4 }}>
                                {title}
                            </Text>
                        )}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
                        }
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>

            {!!selectedPass && (
                <Modal
                    visible={!!selectedPass}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setSelectedPass(null)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
                        <TouchableOpacity 
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            onPress={() => setSelectedPass(null)}
                        />
                        
                        <View style={{ 
                            backgroundColor: COLORS.background.primary, 
                            borderTopLeftRadius: 36, 
                            borderTopRightRadius: 36, 
                            padding: 24, 
                            paddingBottom: Platform.OS === 'ios' ? 48 : 32,
                            minHeight: '80%',
                        }}>
                            {/* Drag Indicator */}
                            <View style={{ width: 48, height: 6, backgroundColor: COLORS.border.subtle, borderRadius: 3, alignSelf: 'center', marginBottom: 28 }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <View style={{ ...Platform.select({ web: { userSelect: 'text' } }) }}>
                                    <Text selectable={true} style={{ fontSize: 32, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -1 }}>Digital Pass</Text>
                                    <Text selectable={true} style={{ fontSize: 12, color: COLORS.text.muted, fontWeight: '700', marginTop: 4, letterSpacing: 3 }}>{selectedPass?.pass_code}</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setSelectedPass(null)}
                                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <X size={22} color={COLORS.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                                <View style={{ 
                                    backgroundColor: COLORS.background.card, 
                                    padding: 24, 
                                    borderRadius: 32, 
                                    // Ambient Action Glow
                                    ...Platform.select({
                                        ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40 },
                                        android: { elevation: 8 },
                                        web: { boxShadow: `0 20px 40px ${COLORS.accent.primary}25` }
                                    })
                                }}>
                                    <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 20 }}>
                                        <QRCode 
                                            value={getQRContent(selectedPass) || "INVALID"} 
                                            size={200} 
                                            color="#000" 
                                            backgroundColor="#fff" 
                                        />
                                    </View>
                                </View>
                                
                                <View style={{ 
                                    marginTop: 24, 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    backgroundColor: selectedPass?.status === 'approved' ? 'rgba(166,227,161,0.1)' : 'rgba(203,166,247,0.1)', 
                                    paddingHorizontal: 16, 
                                    paddingVertical: 8, 
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: selectedPass?.status === 'approved' ? 'rgba(166,227,161,0.3)' : 'rgba(203,166,247,0.3)'
                                }}>
                                    {selectedPass?.status === 'approved' ? (
                                        <CheckCircle2 size={16} color={COLORS.status.success} style={{ marginRight: 8 }} />
                                    ) : (
                                        <ShieldCheck size={16} color={COLORS.accent.primary} style={{ marginRight: 8 }} />
                                    )}
                                    <Text style={{ color: selectedPass?.status === 'approved' ? COLORS.status.success : COLORS.accent.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                        {selectedPass?.status === 'approved' ? 'ENTRY AUTHORIZED' : 'PASS ACTIVE'}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: COLORS.background.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <MapPin size={20} color={COLORS.accent.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 12, color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Montserrat' }}>Destination</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>{selectedPass?.house_number}, {selectedPass?.society_name}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <ShieldCheck size={20} color={COLORS.accent.secondary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 12, color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Montserrat' }}>Authorized By</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>{selectedPass?.resident_name || 'Resident'}</Text>
                                    </View>
                                </View>
                            </View>
                            
                            <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity 
                                    style={{ flex: 1, height: 56, backgroundColor: COLORS.background.card, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border.subtle }}
                                    onPress={() => setSelectedPass(null)}
                                >
                                    <Text style={{ color: COLORS.text.primary, fontWeight: '700', fontSize: 15, fontFamily: 'Montserrat' }}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}
