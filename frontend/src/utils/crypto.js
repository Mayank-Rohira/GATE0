const QR_PREFIX = 'G0:PASS:';

function normalizePassCode(value) {
    const normalized = String(value || '').replace(/[^a-zA-Z0-9_]/g, '').trim().toUpperCase();
    if (!normalized) {
        throw new Error('Missing pass code');
    }

    const passCode = normalized.startsWith('PASS_') ? normalized : `PASS_${normalized}`;
    return { id: passCode, pass_code: passCode };
}

export const encryptPassData = (data) => {
    const source = typeof data === 'string' ? data : (data?.pass_code || data?.id || '');
    return `${QR_PREFIX}${normalizePassCode(source).pass_code}`;
};

export const decryptPassData = (encryptedString) => {
    const raw = String(encryptedString || '').trim();

    if (!raw) {
        throw new Error('Empty QR payload');
    }

    if (raw.startsWith(QR_PREFIX)) {
        return normalizePassCode(raw.slice(QR_PREFIX.length));
    }

    if (/^PASS_[A-Z0-9_]+$/i.test(raw)) {
        return normalizePassCode(raw);
    }

    try {
        const parsed = JSON.parse(raw);
        return normalizePassCode(parsed?.pass_code || parsed?.id);
    } catch (error) {
        throw new Error('Invalid QR payload');
    }
};
