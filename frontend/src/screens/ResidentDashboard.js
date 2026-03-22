import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform, Animated as RNAnimated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../config/api';
import { getToken, getUser } from '../hooks/useAuth';
import usePolling from '../hooks/usePolling';
import PassCard from '../components/PassCard';
import { Bell, Plus } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { NeonButton } from '../components/ui/neon-button';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatCard({ label, count, color, isActive, onPress }) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { stiffness: 300, damping: 15 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 300, damping: 15 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                {
                    width: 110,
                    backgroundColor: COLORS.background.card,
                    borderWidth: 1,
                    borderColor: isActive ? color : COLORS.border.subtle,
                    borderBottomWidth: 1,
                    borderBottomColor: isActive ? color : `${color}4D`, // 30% opacity
                    borderRadius: 14,
                    padding: 14,
                    marginRight: 12,
                },
                animatedStyle
            ]}
        >
            <Text style={{ fontSize: 28, fontWeight: '800', fontFamily: 'Montserrat', color, marginBottom: 4 }}>{count}</Text>
            <Text style={{ fontSize: 13, textTransform: 'uppercase', color: COLORS.text.muted, fontFamily: 'Montserrat', letterSpacing: 2 }}>{label}</Text>
        </AnimatedPressable>
    );
}

export default function ResidentDashboard({ navigation }) {
    const [passes, setPasses] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUserData] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState('All'); // 'All', 'Active', 'Approved'

    const notificationsSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['30%'], []);

    const initUser = async () => {
        const u = await getUser();
        setUserData(u);
    };

    useEffect(() => { initUser(); }, []);

    const fetchPasses = useCallback(async () => {
        try {
            const token = await getToken();
            const u = await getUser();
            if (!token || !u) return;

            const res = await fetch(`${API_BASE}/passes/resident/${u.mobile}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.passes) setPasses(data.passes);
        } catch (err) {
            // silent fail on poll
        }
    }, []);

    usePolling(fetchPasses);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPasses();
        setRefreshing(false);
    };

    // Filter logic based on prompt
    const filteredPasses = passes.filter(p => {
        if (filterPeriod === 'Active') return p.status === 'pending';
        if (filterPeriod === 'Approved') return p.status === 'approved';
        return true; // All
    });

    const sorted = [...filteredPasses].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
    });

    const activeCount = passes.filter(p => p.status === 'pending').length;
    const approvedCount = passes.filter(p => p.status === 'approved').length;
    const thisWeekCount = passes.length;

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    // FAB Animation
    const fabScale = useRef(new RNAnimated.Value(1)).current;

    const handleFabPressIn = () => {
        RNAnimated.sequence([
            RNAnimated.timing(fabScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
            RNAnimated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const handleBellPress = () => {
        notificationsSheetRef.current?.expand();
    };

    const renderBackdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ), []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            
            {/* Header Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
                <View>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>GATE0</Text>
                    <Text style={{ fontSize: 13, color: COLORS.text.muted, marginTop: 2, fontFamily: 'Montserrat' }}>{user ? `${user.house_number}` : 'House'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleBellPress} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Bell size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent.primaryDeep, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: COLORS.text.primary, fontSize: 15, fontWeight: '700', fontFamily: 'Montserrat' }}>{getInitials(user?.name)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Row */}
            <View style={{ marginBottom: 24 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}>
                    <StatCard label="Active" count={activeCount} color={COLORS.accent.primary} isActive={filterPeriod === 'Active'} onPress={() => setFilterPeriod('Active')} />
                    <StatCard label="Approved" count={approvedCount} color={COLORS.status.success} isActive={filterPeriod === 'Approved'} onPress={() => setFilterPeriod('Approved')} />
                    <StatCard label="This Week" count={thisWeekCount} color={COLORS.accent.secondary} isActive={filterPeriod === 'All'} onPress={() => setFilterPeriod('All')} />
                </ScrollView>
            </View>

            {/* Section Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: COLORS.text.muted, fontFamily: 'Montserrat' }}>
                    {filterPeriod === 'All' ? 'All Passes' : `${filterPeriod} Passes`}
                </Text>
                <NeonButton title="+ New Pass" height={32} width={100} outlineColor={COLORS.accent.primary} onPress={() => navigation.navigate('CreatePass')} textStyle={{ fontSize: 12 }} />
            </View>

            {/* Pass List */}
            {sorted.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text.primary, fontFamily: 'Montserrat', marginBottom: 8 }}>No Passes Found</Text>
                    <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>Try changing your filter or create a new pass.</Text>
                </View>
            ) : (
                <FlatList
                    data={sorted}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <PassCard pass={item} variant="resident" onPress={() => {}} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                />
            )}

            {/* Floating Action Button */}
            <RNAnimated.View style={{
                position: 'absolute',
                bottom: Platform.OS === 'ios' ? 40 : 24,
                right: 24,
                transform: [{ scale: fabScale }]
            }}>
                <Pressable
                    onPressIn={handleFabPressIn}
                    onPress={() => setTimeout(() => navigation.navigate('CreatePass'), 150)}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: COLORS.accent.primaryDeep,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...Platform.select({
                            web: { boxShadow: `0 0 20px rgba(136,57,239,0.5)` },
                            default: { elevation: 8, shadowColor: COLORS.accent.primaryDeep, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
                        })
                    }}
                >
                    <Plus size={24} color={COLORS.text.primary} />
                </Pressable>
            </RNAnimated.View>

            <BottomSheet
                ref={notificationsSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: COLORS.background.card }}
                handleIndicatorStyle={{ backgroundColor: COLORS.border.subtle }}
            >
                <View style={{ padding: 24, flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
                    <Bell size={40} color={COLORS.border.subtle} style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>No new notifications</Text>
                </View>
            </BottomSheet>

        </SafeAreaView>
    );
}
