import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../config/api';
import { getToken } from '../hooks/useAuth';
import { X, User, Phone, MapPin, Building2, Briefcase } from 'lucide-react-native';
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
        if (!fullPass) {
            fetchPassDetails();
        }
    }, []);

    const fetchPassDetails = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/passes/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ pass_code: passData.id }),
            });
            const data = await res.json();
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
        if (status === 'approved') return { label: 'ENTRY APPROVED', color: COLORS.status.success, bg: COLORS.status.successBg };
        if (status === 'denied' || status === 'invalid' || error) return { label: error ? 'INVALID PASS' : 'DENIED', color: COLORS.status.error, bg: '#3a1520' };
        return { label: 'PENDING VERIFICATION', color: COLORS.status.warning, bg: COLORS.status.warningBg };
    };

    const statusConfig = getStatusConfig();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 24 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border.subtle }}>
                    <X size={24} color={COLORS.text.muted} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                
                <View style={{ backgroundColor: COLORS.background.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: 32 }}>
                    
                    {/* Status Badge */}
                    <View style={{ backgroundColor: statusConfig.bg, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 32 }}>
                        <Text style={{ color: statusConfig.color, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Montserrat' }}>
                            {loading ? 'FETCHING DETAILS...' : statusConfig.label}
                        </Text>
                    </View>

                    <Text style={{ fontSize: 13, textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 16, fontFamily: 'Montserrat', fontWeight: '700' }}>Pass Identity</Text>
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 18, color: COLORS.text.primary, fontFamily: 'Courier', fontWeight: '800' }}>{passData.id}</Text>
                    </View>

                    <Text style={{ fontSize: 13, textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 16, fontFamily: 'Montserrat', fontWeight: '700' }}>Visitor Details</Text>
                    <View style={{ gap: 16, marginBottom: 32 }}>
                        <DetailRow icon={<User size={18} color={COLORS.text.muted} />} label="Name" value={loading ? 'Loading...' : result.visitor_name || 'Unknown'} />
                        <View style={{ height: 1, backgroundColor: COLORS.border.subtle }} />
                        <DetailRow icon={<Phone size={18} color={COLORS.text.muted} />} label="Mobile" value={loading ? 'Loading...' : result.visitor_mobile || 'Unknown'} />
                        <View style={{ height: 1, backgroundColor: COLORS.border.subtle }} />
                        <DetailRow icon={<Briefcase size={18} color={COLORS.text.muted} />} label="Service" value={loading ? 'Loading...' : result.service_name || 'Unknown'} />
                    </View>

                    <Text style={{ fontSize: 13, textTransform: 'uppercase', color: COLORS.text.muted, letterSpacing: 2, marginBottom: 16, fontFamily: 'Montserrat', fontWeight: '700' }}>Destination</Text>
                    <View style={{ gap: 16 }}>
                        <DetailRow icon={<Building2 size={18} color={COLORS.text.muted} />} label="Resident" value={loading ? 'Loading...' : result.resident_name || 'Unknown'} />
                        <View style={{ height: 1, backgroundColor: COLORS.border.subtle }} />
                        <DetailRow icon={<MapPin size={18} color={COLORS.text.muted} />} label="Unit" value={loading ? 'Loading...' : `${result.house_number || '?'}, ${result.society_name || '?'}`} highlight />
                    </View>

                </View>

                {status === 'pending' && !error && !loading ? (
                    <View style={{ gap: 16 }}>
                        <ButtonColorful 
                            title="Allow Entry" 
                            onPress={approvePass} 
                            loading={actionState === 'approving'} 
                            disabled={actionState !== null}
                            width="100%" 
                            height={56} 
                        />
                        
                        <NeonButton 
                            title="Deny Entry & Flag" 
                            onPress={denyPass}
                            disabled={actionState !== null}
                            width="100%" 
                            height={56} 
                            outlineColor={COLORS.status.error}
                            textStyle={{ color: COLORS.status.error }}
                        />
                    </View>
                ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
                        <Text style={{ color: COLORS.text.muted, fontSize: 13, fontFamily: 'Montserrat', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {status === 'approved' ? 'Entry Logged Successfully' : 'Pass Rejected'}
                        </Text>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({ icon, label, value, highlight = false }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 4, fontFamily: 'Montserrat' }}>{label}</Text>
                <Text style={{ fontSize: 15, color: highlight ? COLORS.text.primary : COLORS.text.secondary, fontWeight: highlight ? '600' : '400', fontFamily: 'Montserrat' }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}
