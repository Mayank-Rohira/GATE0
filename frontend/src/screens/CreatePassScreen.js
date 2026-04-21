import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Check, User, Phone, Share2, CheckCircle2, Car, ShoppingBag, Utensils, Package, Wrench, Users } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';

import { encryptPassData } from '../utils/crypto';

import { API_BASE } from '../config/api';
import { getToken } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';
import { ButtonColorful } from '../components/ui/button-colorful';
import { NeonButton } from '../components/ui/neon-button';
import { Modal } from 'react-native';

const SERVICES = [
    { label: 'Cabs', icon: Car },
    { label: 'Food', icon: Utensils },
    { label: 'Groceries', icon: ShoppingBag },
    { label: 'Swiggy', icon: Package },
    { label: 'Zomato', icon: Package },
    { label: 'Zepto', icon: ShoppingBag },
    { label: 'Amazon', icon: Package },
    { label: 'Flipkart', icon: Package },
    { label: 'Visitor', icon: Users },
    { label: 'Service Unit', icon: Wrench },
    { label: 'Other', icon: CheckCircle2 }
];

function ShimmerText({ value, style, placeholderWidth }) {
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        if (!value) {
            opacity.value = withRepeat(withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
        } else {
            opacity.value = 1;
        }
    }, [value]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        backgroundColor: value ? 'transparent' : COLORS.border.subtle,
        width: value ? 'auto' : placeholderWidth,
        height: value ? 'auto' : 16,
        borderRadius: value ? 0 : 4,
        overflow: 'hidden',
    }));

    return (
        <Animated.View style={[animatedStyle, { justifyContent: 'center' }]}>
            <Text style={[style, { opacity: value ? 1 : 0 }]}>{value || '---'}</Text>
        </Animated.View>
    );
}

export default function CreatePassScreen({ navigation }) {
    const [serviceName, setServiceName] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [visitorMobile, setVisitorMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdPass, setCreatedPass] = useState(null);
    const [selectVisible, setSelectVisible] = useState(false);

    const handleCreate = async () => {
        if (!serviceName || !visitorName || !visitorMobile) return;
        setLoading(true);

        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/passes/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ service_name: serviceName, visitor_name: visitorName, visitor_mobile: visitorMobile }),
            });
            const data = await res.json();

            if (res.ok) {
                setTimeout(() => {
                    setCreatedPass(data);
                    setLoading(false);
                }, 1500);
            } else {
                setLoading(false);
            }
        } catch (err) { setLoading(false); }
    };

    const handleShare = async () => {
        if (!createdPass) return;
        try {
            await Share.share({
                message: `Your GATE0 visitor pass code is: ${createdPass.pass_code}\nValid for today only.`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (createdPass) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.status.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Check size={32} color={COLORS.status.success} />
                    </View>
                    <Text style={{ color: COLORS.text.primary, fontSize: 34, fontWeight: '800', marginBottom: 8, letterSpacing: -1 }}>PASS GENERATED</Text>
                    <Text style={{ color: COLORS.text.secondary, fontSize: 15, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 }}>Your visitor pass is ready to share. They can use this code for entry today.</Text>

                    <View style={{ 
                        backgroundColor: COLORS.background.card, 
                        borderRadius: 32, 
                        padding: 24, 
                        alignItems: 'center', 
                        width: '100%', 
                        marginBottom: 40,
                        ...Platform.select({
                            ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 40 },
                            android: { elevation: 4 },
                            web: { boxShadow: `0 20px 40px ${COLORS.accent.primary}15` }
                        })
                    }}>
                        <View style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 24, marginBottom: 24 }}>
                            <QRCode
                                value={encryptPassData({
                                    id: createdPass.pass_code,
                                    vn: createdPass.pass.visitor_name,
                                    vm: createdPass.pass.visitor_mobile,
                                    sn: createdPass.pass.service_name,
                                    rn: createdPass.pass.resident_name || 'Resident',
                                    hn: createdPass.pass.house_number,
                                    soc: createdPass.pass.society_name,
                                    status: 'pending'
                                })}
                                size={260}
                                color="#000000"
                                backgroundColor="#ffffff"
                                ecl="M"
                                quietZone={20}
                            />
                        </View>

                        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.muted, letterSpacing: 4, textTransform: 'uppercase' }}>{createdPass.pass_code}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={{ flex: 1, height: 64, borderRadius: 16, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Text style={{ color: COLORS.text.primary, fontWeight: '800', fontSize: 15 }}>CLOSE</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1.5 }}>
                            <ButtonColorful title="SHARE PASS" onPress={handleShare} height={64} />
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                                    <ArrowLeft color={COLORS.text.primary} size={28} />
                                </TouchableOpacity>
                                <Text style={{ fontSize: 34, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -1.5 }}>NEW PASS</Text>
                            </View>
                            <View style={{ backgroundColor: COLORS.status.successBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' }}>
                                <Text style={{ color: COLORS.status.success, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Security Verified</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4 }}>Service Category</Text>
                        <TouchableOpacity
                            onPress={() => setSelectVisible(true)}
                            style={{ backgroundColor: COLORS.background.surface, borderRadius: 16, height: 60, paddingHorizontal: 20, justifyContent: 'center' }}
                        >
                            <Text style={{ color: serviceName ? COLORS.text.primary : COLORS.text.muted, fontSize: 16, fontWeight: '600' }}>
                                {serviceName || 'Select Service'}
                            </Text>
                        </TouchableOpacity>
                    </View>
 
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4 }}>Visitor Name</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, borderRadius: 16, height: 60, paddingHorizontal: 20 }}>
                            <User size={20} color={COLORS.accent.primary} style={{ marginRight: 16 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 16, color: COLORS.text.primary, fontWeight: '600' }}
                                placeholderTextColor={COLORS.text.muted}
                                placeholder="Visitor Name"
                                value={visitorName}
                                onChangeText={setVisitorName}
                            />
                        </View>
                    </View>
 
                    <View style={{ marginBottom: 40 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4 }}>Contact Details</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, borderRadius: 16, height: 60, paddingHorizontal: 20 }}>
                            <Phone size={20} color={COLORS.accent.primary} style={{ marginRight: 16 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 16, color: COLORS.text.primary, fontWeight: '600' }}
                                placeholderTextColor={COLORS.text.muted}
                                placeholder="10-digit mobile"
                                keyboardType="numeric"
                                maxLength={10}
                                value={visitorMobile}
                                onChangeText={setVisitorMobile}
                            />
                        </View>
                    </View>

                    <View style={{ backgroundColor: COLORS.background.surface, borderRadius: 24, padding: 24, marginBottom: 40, ...Platform.select({ ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 }, android: { elevation: 2 } }) }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 20 }}>Live Preview</Text>
 
                        <View style={{ marginBottom: 8 }}>
                            <ShimmerText value={serviceName} style={{ fontSize: 20, fontWeight: '800', color: COLORS.text.primary }} placeholderWidth={140} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ShimmerText value={visitorName} style={{ fontSize: 15, fontWeight: '600', color: COLORS.text.secondary }} placeholderWidth={120} />
                            <Text style={{ color: COLORS.text.muted, marginHorizontal: 8 }}>·</Text>
                            <ShimmerText value={visitorMobile} style={{ fontSize: 15, fontWeight: '600', color: COLORS.text.secondary, letterSpacing: 1 }} placeholderWidth={90} />
                        </View>
                    </View>


                    <ButtonColorful title="Generate Pass" onPress={handleCreate} loading={loading} width="100%" height={56} />

                </ScrollView>
            </KeyboardAvoidingView>
            <Modal
                visible={selectVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(5, 5, 10, 0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: COLORS.background.primary, borderRadius: 32, padding: 24, width: '100%', maxWidth: 450 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: COLORS.text.muted, marginBottom: 24, textAlign: 'center' }}>Select Service</Text>
 
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                            {SERVICES.map((srv) => {
                                const IconComp = srv.icon;
                                const isSelected = serviceName === srv.label;
                                return (
                                    <TouchableOpacity
                                        key={srv.label}
                                        onPress={() => {
                                            setServiceName(srv.label);
                                            setSelectVisible(false);
                                        }}
                                        style={{
                                            width: '48%',
                                            height: 64,
                                            backgroundColor: isSelected ? COLORS.accent.primary : COLORS.background.surface,
                                            borderRadius: 16,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 16,
                                            flexDirection: 'row',
                                            borderWidth: 1,
                                            borderColor: isSelected ? COLORS.accent.primary : COLORS.border.subtle
                                        }}
                                    >
                                        <IconComp size={18} color={isSelected ? COLORS.background.primary : COLORS.text.muted} style={{ marginRight: 8 }} />
                                        <Text style={{ color: isSelected ? COLORS.background.primary : COLORS.text.secondary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{srv.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
 
                        <TouchableOpacity
                            onPress={() => setSelectVisible(false)}
                            style={{ marginTop: 8, height: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background.surface, borderRadius: 16 }}
                        >
                            <Text style={{ color: COLORS.text.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
