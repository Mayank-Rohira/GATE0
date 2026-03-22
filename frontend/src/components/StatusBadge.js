import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const STATUS_CONFIG = {
    pending: { label: 'Awaiting Arrival', bg: COLORS.status.warningBg, text: COLORS.status.warning },
    approved: { label: 'Entry Approved', bg: COLORS.status.successBg, text: COLORS.status.success },
};

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <View style={{
            backgroundColor: config.bg,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 4,
            alignSelf: 'flex-start',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: config.text,
        }}>
            <Text style={{
                color: config.text,
                fontSize: 12,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontFamily: 'Montserrat',
            }}>
                {config.label}
            </Text>
        </View>
    );
}
