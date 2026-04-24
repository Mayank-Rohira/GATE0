import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Pressable, FlatList, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, FileText, Download } from 'lucide-react-native';
import { API_BASE } from '../config/api';
import { getToken, getUser } from '../hooks/useAuth';
import usePolling from '../hooks/usePolling';
import { COLORS } from '../constants/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const FILTERS = ['All', 'Today', 'This Week'];

export default function LogsScreen() {
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

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

    const getStatusColor = () => COLORS.status.success;

    const getLogActionText = (log) => {
        return `Approved ${log.service_name || log.visitor_name || 'Pass'}`;
    };

    const parseTimestamp = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const isToday = (dateStr) => {
        const date = parseTimestamp(dateStr);
        return date ? date.toDateString() === new Date().toDateString() : false;
    };

    const isThisWeek = (dateStr) => {
        const d = parseTimestamp(dateStr);
        if (!d) return false;
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

    const exportToCSV = async () => {
        if (filteredLogs.length === 0) return;
        
        try {
            const headers = ['Date', 'Time', 'Visitor Name', 'Visitor Mobile', 'Service', 'Resident', 'House', 'Residency'];
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
                window.URL.revokeObjectURL(url);
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }} edges={['top']}>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
                
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <View>
                        <Text style={{ fontSize: 38, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -2 }}>LOGS</Text>
                        <View style={{ backgroundColor: COLORS.background.cardHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border.tactile }}>
                            <Text selectable={true} style={{ color: COLORS.accent.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase' }}>Recent Activity</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={exportToCSV}
                        style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.background.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border.subtle }}
                    >
                        <Download size={22} color={COLORS.accent.primary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.surface, borderRadius: 8, height: 56, paddingHorizontal: 18, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border.subtle }}>
                    <Search size={18} color={COLORS.text.muted} style={{ marginRight: 16 }} />
                        <TextInput
                            style={{ flex: 1, fontSize: 15, color: COLORS.text.primary, height: '100%', fontWeight: '700' }}
                            placeholderTextColor={COLORS.text.muted}
                            placeholder="Search visitor or house"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                </View>


                {/* Filter Tabs */}
                <View style={{ marginBottom: 32 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4 }}>
                        {FILTERS.map((filter) => {
                            const isActive = activeFilter === filter;
                            return (
                                <Pressable 
                                    key={filter}
                                    onPress={() => setActiveFilter(filter)}
                                    style={{
                                        paddingHorizontal: 18,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        marginRight: 10,
                                        backgroundColor: isActive ? COLORS.accent.primary : COLORS.background.surface,
                                    }}
                                >
                                    <Text style={{ 
                                        color: isActive ? COLORS.background.primary : COLORS.text.secondary,
                                        fontSize: 11,
                                        fontWeight: '800',
                                        letterSpacing: 1.5,
                                        textTransform: 'uppercase'
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
                        <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.background.card, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border.tactile }}>
                            <FileText size={36} color={COLORS.border.tactile} />
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, letterSpacing: -1 }}>NO LOGS FOUND</Text>
                        <Text style={{ fontSize: 13, color: COLORS.text.muted, textAlign: 'center', paddingHorizontal: 48, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 }}>
                            {searchQuery ? 'Try adjusting your search or filters.' : 'Your activity log is currently empty.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredLogs}
                        keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
                        renderItem={({ item }) => (
                            <View 
                                style={[
                                    { 
                                        backgroundColor: COLORS.background.card, 
                                        borderRadius: 2, 
                                        padding: 24, 
                                        marginBottom: 1, // High density dividers
                                        borderWidth: 1,
                                        borderColor: COLORS.border.tactile,
                                        borderLeftWidth: 4, // "Status Bar"
                                        borderLeftColor: getStatusColor(item) 
                                    }
                                ]}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.visitor_name}</Text>
                                            <Text style={{ fontSize: 10, color: COLORS.text.secondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>{getLogActionText(item)}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.accent.primary, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{item.time}</Text>
                                        <Text style={{ fontSize: 10, color: COLORS.text.muted, fontWeight: '800', textTransform: 'uppercase' }}>{item.date}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 24, paddingLeft: 0 }}>
                                    <View>
                                        <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>AUTHORIZATION</Text>
                                        <Text style={{ fontSize: 11, color: COLORS.text.secondary, fontWeight: '800', textTransform: 'uppercase' }}>{item.resident_name || 'Resident'}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.text.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>LOCATION</Text>
                                        <Text style={{ fontSize: 11, color: COLORS.text.secondary, fontWeight: '800', textTransform: 'uppercase' }}>{item.house_number}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent.primary} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}

            </View>
        </SafeAreaView>
    );
}
