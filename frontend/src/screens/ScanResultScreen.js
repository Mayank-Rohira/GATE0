import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../config/api';
import { getToken } from '../hooks/useAuth';
import { User, Phone, MapPin, Building2, Briefcase } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { ButtonColorful } from '../components/ui/button-colorful';
import { NeonButton } from '../components/ui/neon-button';

export default function ScanResultScreen({ navigation, route }) {
    const { passData } = route.params;

    const [actionState, setActionState] = useState(null); // 'approving', 'denying', null
    const [status, setStatus] = useState(passData.status || 'pending');
    const [fullPass, setFullPass] = useState(passData.visitor_name ? passData : null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(!passData.visitor_name);

    const result = fullPass || passData;

    useEffect(() => {
        fetchPassDetails();
    }, []);

    const fetchPassDetails = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            console.log('[SCAN_RESULT] Validating pass_code:', passData.id);
            const res = await fetch(`${API_BASE}/passes/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ pass_code: passData.id }),
            });
            const data = await res.json();
            console.log('[SCAN_RESULT] API Response:', data);
            if (res.ok) {
                setFullPass(data.pass);
                setStatus(data.pass.status);
            } else {
                setError(data.error || 'Invalid pass');
            }
        } catch (err) {
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const approvePass = async () => {
        setActionState('approving');
        setError(null);

        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/passes/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ pass_code: result.id || passData.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Approval failed');
                setStatus('invalid');
                setActionState(null);
                return;
            }

            setStatus('approved');
            setTimeout(() => navigation.goBack(), 1500);
        } catch (err) {
            setError('Connection failed');
            setStatus('invalid');
            setActionState(null);
        }
    };

    const denyPass = async () => {
        setActionState('denying');
        setError(null);

        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/passes/deny`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ pass_code: result.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Deny failed');
                setStatus('invalid');
                setActionState(null);
                return;
            }

            setStatus('denied');
            setTimeout(() => navigation.goBack(), 1500);
        } catch (err) {
            setError('Connection failed');
            setStatus('invalid');
            setActionState(null);
        }
    };

    const getStatusConfig = () => {
        if (status === 'approved') return { label: 'ENTRY AUTHORIZED', color: COLORS.status.success, bg: COLORS.status.successBg };
        if (status === 'denied' || status === 'invalid' || error) return { label: error || 'ACCESS DENIED', color: COLORS.status.error, bg: COLORS.status.errorBg };
        return { label: 'WAITING FOR DATA...', color: COLORS.accent.tertiary, bg: COLORS.status.warningBg };
    };

    const statusConfig = getStatusConfig();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
            
            {/* Top Branding Header */}
            <View style={{ paddingHorizontal: 32, paddingTop: 40, paddingBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: status === 'pending' ? COLORS.accent.primary : statusConfig.color, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>SECURITY IDENTITY</Text>
                <Text style={{ fontSize: 44, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -2, lineHeight: 44 }}>{status === 'pending' ? 'WAITING...' : statusConfig.label}</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                
                <View style={{ backgroundColor: COLORS.background.surface, borderRadius: 32, padding: 24, marginBottom: 32, ...Platform.select({ ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 }, android: { elevation: 2 } }) }}>
                    
                    {/* Terminal Data Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border.tactile, paddingBottom: 16 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>UNIT_SCAN_LOG: {passData.id}</Text>
                    </View>


                    <Text style={{ fontSize: 11, textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 16, fontWeight: '800' }}>VISITOR INTEL</Text>
                    <View style={{ gap: 20, marginBottom: 40 }}>
                        <DetailRow icon={<User size={18} color={COLORS.accent.primary} />} label="Name" value={loading ? '...' : result.visitor_name || 'N/A'} />
                        <DetailRow icon={<Phone size={18} color={COLORS.accent.primary} />} label="Mobile" value={loading ? '...' : result.visitor_mobile || 'N/A'} />
                        <DetailRow icon={<Briefcase size={18} color={COLORS.accent.primary} />} label="Service" value={loading ? '...' : result.service_name || 'N/A'} />
                    </View>

                    <Text style={{ fontSize: 11, textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 16, fontWeight: '800' }}>DESTINATION</Text>
                    <View style={{ gap: 20 }}>
                        <DetailRow icon={<Building2 size={18} color={COLORS.accent.secondary} />} label="Resident" value={loading ? '...' : result.resident_name || 'N/A'} />
                        <DetailRow icon={<MapPin size={18} color={COLORS.accent.secondary} />} label="Unit" value={loading ? '...' : `${result.house_number || '?'}, ${result.society_name || '?'}`} highlight />
                    </View>

                </View>

                {status === 'pending' && !error && !loading && (
                    <View style={{ gap: 16 }}>
                        <ButtonColorful 
                            title="GRANT ACCESS" 
                            onPress={approvePass} 
                            loading={actionState === 'approving'} 
                            disabled={actionState !== null}
                            width="100%" 
                            height={64} 
                        />
                        
                        <TouchableOpacity 
                            onPress={denyPass}
                            disabled={actionState !== null}
                            style={{ 
                                width: '100%', 
                                height: 56, 
                                borderRadius: 16, 
                                backgroundColor: COLORS.status.errorBg, 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                            }}
                        >
                            <Text selectable={true} style={{ color: COLORS.status.error, fontWeight: '800', fontSize: 14, letterSpacing: 1.5 }}>DENY & FLAG</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Final Exit Action */}
                <View style={{ marginTop: 20 }}>
                    <ButtonColorful 
                        title="RETURN TO TERMINAL" 
                        onPress={() => navigation.goBack()} 
                        width="100%" 
                        height={64} 
                        style={{ borderRadius: 12 }}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({ icon, label, value, highlight = false }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
                <Text style={{ fontSize: 16, color: COLORS.text.primary, fontWeight: '700' }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}
