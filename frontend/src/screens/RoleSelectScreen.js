import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Shield, User, ArrowRight } from 'lucide-react-native';

import { COLORS } from '../constants/colors';

const ROLE_DATA = [
    { id: 'resident', label: 'Resident', icon: Home, description: 'Manage access for your household' },
    { id: 'visitor', label: 'Visitor', icon: User, description: 'Enter with a security pass code' },
    { id: 'guard', label: 'Security', icon: Shield, description: 'Monitor sectors and scan tokens' },
];

function RoleCard({ label, description, icon: Icon, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={{
                width: '100%',
                backgroundColor: COLORS.background.surface,
                borderRadius: 24,
                padding: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                ...Platform.select({
                    ios: { shadowColor: COLORS.accent.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 },
                    android: { elevation: 2 },
                    web: { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }
                })
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.background.primary, alignItems: 'center', justifyContent: 'center', marginRight: 20 }}>
                    <Icon size={28} color={COLORS.accent.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text selectable={true} style={{ fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 }}>{label}</Text>
                    <Text selectable={true} style={{ fontSize: 13, color: COLORS.text.secondary, fontWeight: '600' }}>{description}</Text>
                </View>
            </View>
            <ArrowRight size={20} color={COLORS.accent.primary} />
        </TouchableOpacity>
    );
}

export default function RoleSelectScreen({ navigation }) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
                <View style={{ marginBottom: 64, ...Platform.select({ web: { userSelect: 'text' } }) }}>
                    <Text selectable={true} style={{ fontSize: 44, fontWeight: '900', color: COLORS.text.primary, letterSpacing: -2 }}>GATE<Text selectable={true} style={{ color: COLORS.accent.primary }}>0</Text></Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.status.success, marginRight: 8 }} />
                        <Text selectable={true} style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>System Online</Text>
                    </View>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 32, marginLeft: 4 }}>Select Access Protocol</Text>

                <View>
                    {ROLE_DATA.map((role) => (
                        <RoleCard 
                            key={role.id}
                            label={role.label}
                            description={role.description}
                            icon={role.icon}
                            onPress={() => navigation.navigate('Login', { role: role.id })}
                        />
                    ))}
                </View>

                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text.muted, letterSpacing: 4, fontWeight: '700' }}>v2.0 · KINETIC INTERFACE</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
