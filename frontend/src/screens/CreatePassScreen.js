import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, Check, User, Phone, Share2, CheckCircle2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSpring } from 'react-native-reanimated';

import { API_BASE } from '../config/api';
import { getToken } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';
import { ButtonColorful } from '../components/ui/button-colorful';
import { NeonButton } from '../components/ui/neon-button';
import { Modal } from 'react-native';

const SERVICES = ['Zomato', 'Swiggy', 'Zepto', 'Amazon', 'Flipkart', 'Visitor', 'Other'];

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
                    <CheckCircle2 color={COLORS.status.success} size={48} style={{ marginBottom: 16 }} />
                    <Text style={{ color: COLORS.text.primary, fontSize: 34, fontWeight: '800', fontFamily: 'Montserrat', marginBottom: 32 }}>Access Granted</Text>

                    <View style={{ backgroundColor: COLORS.background.card, borderRadius: 24, padding: 24, alignItems: 'center', borderColor: COLORS.border.subtle, borderWidth: 1, width: '100%', marginBottom: 32 }}>
                        <View style={{ backgroundColor: COLORS.background.primary, padding: 8, borderRadius: 16, marginBottom: 24, position: 'relative' }}>
                            <View style={{ position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: COLORS.accent.primary, borderTopLeftRadius: 16 }} />
                            <View style={{ position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: COLORS.accent.primary, borderTopRightRadius: 16 }} />
                            <View style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: COLORS.accent.primary, borderBottomLeftRadius: 16 }} />
                            <View style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: COLORS.accent.primary, borderBottomRightRadius: 16 }} />

                            <QRCode
                                value={createdPass.qr_content ? (typeof createdPass.qr_content === 'string' ? createdPass.qr_content : JSON.stringify(createdPass.qr_content)) : (createdPass.pass_code || "PASS")}
                                size={220}
                                color="#ffffff"
                                backgroundColor={COLORS.background.primary}
                            />
                        </View>

                        <Text style={{ fontSize: 13, fontFamily: 'Courier', color: COLORS.text.muted, letterSpacing: 2 }}>{createdPass.pass_code}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <NeonButton title="Share" icon={Share2} onPress={handleShare} width="45%" height={56} style={{ marginRight: 16 }} />
                        <ButtonColorful title="Done" onPress={() => navigation.goBack()} width="50%" height={56} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
                                <ArrowLeft color={COLORS.accent.primary} size={24} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>New Pass</Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(203,166,247,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                            <Text style={{ color: COLORS.accent.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>RESIDENT</Text>
                        </View>
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4, fontFamily: 'Montserrat' }}>Service Name</Text>
                        <TouchableOpacity
                            onPress={() => setSelectVisible(true)}
                            style={{ backgroundColor: COLORS.background.input, borderRadius: 14, height: 56, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border.subtle }}
                        >
                            <Text style={{ color: serviceName ? COLORS.text.primary : COLORS.text.muted, fontSize: 16, fontFamily: 'Montserrat' }}>
                                {serviceName || 'Select Service'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4, fontFamily: 'Montserrat' }}>Visitor Name</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.input, borderRadius: 14, height: 56, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                            <User size={18} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 16, color: COLORS.text.primary, height: '100%', fontFamily: 'Montserrat' }}
                                placeholderTextColor={COLORS.text.muted}
                                placeholder="Visitor Name"
                                value={visitorName}
                                onChangeText={setVisitorName}
                            />
                        </View>
                    </View>

                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginLeft: 4, fontFamily: 'Montserrat' }}>Visitor Mobile</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.input, borderRadius: 14, height: 56, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                            <Phone size={18} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                            <TextInput
                                style={{ flex: 1, fontSize: 16, color: COLORS.text.primary, height: '100%', fontFamily: 'Montserrat' }}
                                placeholderTextColor={COLORS.text.muted}
                                placeholder="10-digit mobile"
                                keyboardType="numeric"
                                maxLength={10}
                                value={visitorMobile}
                                onChangeText={setVisitorMobile}
                            />
                        </View>
                    </View>

                    <View style={{ backgroundColor: COLORS.background.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border.subtle, padding: 20, marginBottom: 32 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 16, fontFamily: 'Montserrat' }}>Pass Preview</Text>

                        <View style={{ marginBottom: 12 }}>
                            <ShimmerText value={serviceName} style={{ fontSize: 17, fontWeight: '600', color: COLORS.text.primary, fontFamily: 'Montserrat' }} placeholderWidth={100} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <ShimmerText value={visitorName} style={{ fontSize: 15, fontWeight: '400', color: COLORS.text.secondary, fontFamily: 'Montserrat' }} placeholderWidth={120} />
                            <Text style={{ color: COLORS.text.muted, marginHorizontal: 8 }}>·</Text>
                            <ShimmerText value={visitorMobile} style={{ fontSize: 15, fontWeight: '400', color: COLORS.text.secondary, fontFamily: 'Courier' }} placeholderWidth={90} />
                        </View>

                        <View style={{ height: 1, backgroundColor: COLORS.border.subtle, marginBottom: 16 }} />
                        <Text style={{ fontSize: 13, fontFamily: 'Courier', color: COLORS.text.muted, textAlign: 'center' }}>PASS_------</Text>
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
                <TouchableOpacity
                    onPress={() => setSelectVisible(false)}
                    activeOpacity={1}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ backgroundColor: COLORS.background.card, borderRadius: 24, padding: 24, width: '100%', maxWidth: 450, borderWidth: 1, borderColor: COLORS.border.subtle, shadowColor: COLORS.accent.primary, shadowOpacity: 0.2, shadowRadius: 20 }}
                    >
                        <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 3, color: COLORS.text.muted, marginBottom: 24, fontFamily: 'Montserrat', textAlign: 'center' }}>System Selection / Service Authority</Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {SERVICES.map((srv) => (
                                <TouchableOpacity
                                    key={srv}
                                    onPress={() => {
                                        setServiceName(srv);
                                        setSelectVisible(false);
                                    }}
                                    style={{
                                        width: '48%',
                                        height: 56,
                                        backgroundColor: serviceName === srv ? 'rgba(203,166,247,0.15)' : COLORS.background.surface,
                                        borderRadius: 14,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: serviceName === srv ? COLORS.accent.primary : COLORS.border.subtle,
                                        marginBottom: 16,
                                        flexDirection: 'row'
                                    }}
                                >
                                    <Text style={{ color: serviceName === srv ? COLORS.text.primary : COLORS.text.secondary, fontSize: 15, fontWeight: serviceName === srv ? '800' : '500', fontFamily: 'Montserrat' }}>{srv}</Text>
                                    {serviceName === srv && <Check size={18} color={COLORS.accent.primary} style={{ marginLeft: 8 }} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => setSelectVisible(false)}
                            style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 }}
                        >
                            <Text style={{ color: COLORS.text.muted, fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>Cancel</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
