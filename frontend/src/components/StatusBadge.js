import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const STATUS_CONFIG = {
    pending: { label: 'Awaiting', bg: COLORS.status.warningBg, text: '#002e69' }, // on-tertiary-container
    approved: { label: 'Approved', bg: COLORS.status.successBg, text: COLORS.status.success },
};

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <View style={{
            backgroundColor: config.bg,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Text style={{
                color: config.text,
                fontSize: 11,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 2,
            }}>
                {config.label}
            </Text>
        </View>
    );
}
