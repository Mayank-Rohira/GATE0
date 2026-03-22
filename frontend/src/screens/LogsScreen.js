import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, TextInput, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowRight, FileText, User, Phone, MapPin, Clock, Download } from 'lucide-react-native';
import { API_BASE } from '../config/api';
import { getToken, getUser } from '../hooks/useAuth';
import usePolling from '../hooks/usePolling';
import { COLORS } from '../constants/colors';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const FILTERS = ['All', 'Today', 'This Week'];

export default function LogsScreen() {
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedLog, setSelectedLog] = useState(null);

    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['45%'], []);

    const fetchLogs = useCallback(async () => {
        try {
            const token = await getToken();
            const user = await getUser();
            if (!token || !user || user.role !== 'guard') return;

            const res = await fetch(`${API_BASE}/logs/${user.mobile}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.logs) setLogs(data.logs);
        } catch (err) { }
    }, []);

    usePolling(fetchLogs);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    };

    const getStatusColor = (log) => {
        if (log.status === 'denied') return COLORS.status.error;
        if (log.status === 'pending') return COLORS.accent.secondary;
        return COLORS.status.success;
    };

    const getLogActionText = (log) => {
        if (log.status === 'denied') return `Denied ${log.visitor_name}`;
        return `Scanned ${log.service_name || log.visitor_name || 'Pass'}`;
    };

    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return false; // Fallback
        return d.toDateString() === new Date().toDateString();
    };

    const isThisWeek = (dateStr) => {
        if (!dateStr) return true; // Fallback to all
        const d = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(d.getTime())) return true;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return d > weekAgo;
    };

    const filteredLogs = useMemo(() => {
        let result = logs;
        if (activeFilter === 'Today') {
            result = result.filter(l => isToday(l.timestamp));
        } else if (activeFilter === 'This Week') {
            result = result.filter(l => isThisWeek(l.timestamp));
        }
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l => 
                (l.visitor_name && l.visitor_name.toLowerCase().includes(q)) || 
                (l.service_name && l.service_name.toLowerCase().includes(q)) ||
                (l.house_number && l.house_number.toLowerCase().includes(q))
            );
        }
        return result;
    }, [logs, activeFilter, searchQuery]);

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const handleLogPress = (log) => {
        setSelectedLog(log);
        bottomSheetRef.current?.expand();
    };

    const exportToCSV = async () => {
        if (filteredLogs.length === 0) return;
        
        try {
            const headers = ['Date', 'Time', 'Visitor Name', 'Visitor Mobile', 'Service', 'Resident', 'House', 'Status'];
            const rows = filteredLogs.map(log => [
                `"${log.date || ''}"`,
                `"${log.time || ''}"`,
                `"${log.visitor_name || ''}"`,
                `"${log.visitor_mobile || ''}"`,
                `"${log.service_name || ''}"`,
                `"${log.resident_name || ''}"`,
                `"${log.house_number || ''}"`,
                `"${log.society_name || ''}"`
            ].join(','));
            
            // Remove BOM (\uFEFF) as it can cause "UTF-8" errors on some mobile OS/Apps
            const csvContent = [headers.join(','), ...rows].join('\n');
            
            if (Platform.OS === 'web') {
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gate0_logs_export.csv`;
                a.click();
            } else {
                const fileName = `gate0_logs_${Date.now()}.csv`;
                const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                
                // Writing as UTF8 without BOM
                await FileSystem.writeAsStringAsync(fileUri, csvContent, { 
                    encoding: FileSystem.EncodingType.UTF8 
                });
                
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, { 
                        mimeType: 'text/comma-separated-values', 
                        dialogTitle: 'Export GATE0 Logs',
                        UTI: 'public.comma-separated-values-text' 
                    });
                } else {
                    alert('Sharing is not available on this device');
                }
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert(`Export failed: ${error.message}`);
        }
    };

    const renderBackdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ), []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
                
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ fontSize: 34, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>Security Logs</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable 
                            onPress={exportToCSV}
                            style={({pressed}) => [
                                { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent.primary, marginRight: 12 },
                                pressed && { opacity: 0.7 }
                            ]}
                        >
                            <Download size={18} color={COLORS.accent.primary} />
                        </Pressable>
                        <View style={{ backgroundColor: 'rgba(203,166,247,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                            <Text style={{ color: COLORS.accent.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>GUARD</Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.darker, borderRadius: 12, height: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: 16 }}>
                    <Search size={18} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                    <TextInput
                        style={{ flex: 1, fontSize: 15, color: COLORS.text.primary, height: '100%', fontFamily: 'Montserrat' }}
                        placeholderTextColor={COLORS.text.muted}
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Tabs */}
                <View style={{ marginBottom: 24 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {FILTERS.map((filter) => {
                            const isActive = activeFilter === filter;
                            return (
                                <Pressable 
                                    key={filter}
                                    onPress={() => setActiveFilter(filter)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        marginRight: 8,
                                        backgroundColor: isActive ? COLORS.accent.primary : 'transparent',
                                        borderWidth: 1,
                                        borderColor: isActive ? COLORS.accent.primary : COLORS.border.subtle,
                                    }}
                                >
                                    <Text style={{ 
                                        color: isActive ? COLORS.background.darker : COLORS.text.secondary,
                                        fontSize: 12,
                                        fontWeight: '700',
                                        letterSpacing: 1,
                                        textTransform: 'uppercase',
                                        fontFamily: 'Montserrat'
                                    }}>
                                        {filter}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Logs List */}
                {filteredLogs.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                            <FileText size={36} color={COLORS.border.subtle} />
                        </View>
                        <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8, fontFamily: 'Montserrat' }}>No Logs Found</Text>
                        <Text style={{ fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', paddingHorizontal: 32, fontFamily: 'Montserrat' }}>
                            {searchQuery ? 'Try adjusting your search filters.' : 'Entry records will appear here.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredLogs}
                        keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
                        renderItem={({ item }) => (
                            <Pressable 
                                onPress={() => handleLogPress(item)}
                                style={({ pressed }) => [
                                    { 
                                        backgroundColor: COLORS.background.card, 
                                        borderRadius: 16, 
                                        padding: 16, 
                                        marginBottom: 12, 
                                        borderWidth: 1, 
                                        borderColor: COLORS.border.subtle 
                                    },
                                    pressed && { opacity: 0.8 }
                                ]}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: getStatusColor(item) }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>{getInitials(item.visitor_name)}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>{item.visitor_name}</Text>
                                            <Text style={{ fontSize: 12, color: getStatusColor(item), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{getLogActionText(item)}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text.primary, fontFamily: 'Courier' }}>{item.time}</Text>
                                        <Text style={{ fontSize: 11, color: COLORS.text.muted, fontFamily: 'Courier' }}>{item.date}</Text>
                                    </View>
                                </View>

                                <View style={{ height: 1, backgroundColor: COLORS.border.subtle, marginBottom: 12 }} />

                                <View style={{ gap: 6 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Phone size={12} color={COLORS.text.muted} style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 13, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>{item.visitor_mobile}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <User size={12} color={COLORS.text.muted} style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 13, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>Auth: {item.resident_name || 'Resident'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MapPin size={12} color={COLORS.text.muted} style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 13, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>{item.house_number}, {item.society_name}</Text>
                                    </View>
                                </View>
                            </Pressable>
                        )}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>

            {/* Log Detail Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: COLORS.background.card }}
                handleIndicatorStyle={{ backgroundColor: COLORS.border.subtle }}
            >
                {selectedLog && (
                    <View style={{ padding: 24, flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: COLORS.text.muted, marginBottom: 24, fontFamily: 'Montserrat' }}>Log Details</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: COLORS.accent.primary }}>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>{getInitials(selectedLog.visitor_name)}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text.primary, fontFamily: 'Montserrat' }}>{selectedLog.visitor_name}</Text>
                                <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>{selectedLog.service_name || 'Visitor'}</Text>
                            </View>
                        </View>

                        <View style={{ backgroundColor: COLORS.background.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <Phone size={16} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                                <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>{selectedLog.visitor_mobile || 'N/A'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <User size={16} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                                <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>Auth: {selectedLog.resident_name || 'N/A'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <MapPin size={16} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                                <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>{selectedLog.house_number}, {selectedLog.society_name}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Clock size={16} color={COLORS.text.muted} style={{ marginRight: 12 }} />
                                <Text style={{ fontSize: 15, color: COLORS.text.secondary, fontFamily: 'Montserrat' }}>Time: {selectedLog.time}</Text>
                            </View>
                        </View>

                    </View>
                )}
            </BottomSheet>

        </SafeAreaView>
    );
}
