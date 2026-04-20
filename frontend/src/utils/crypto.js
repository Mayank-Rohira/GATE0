const SECRET_KEY = "GATE0_SECURE_TOKEN_2026";

/**
 * Simple XOR-based "encryption" for QR codes.
 * Not military grade, but sufficient to prevent human reading and basic camera scanners.
 * Generic scanners will see the prefix text, our app will decode the payload.
 */
export const encryptPassData = (data, useLegacy = false) => {
    try {
        // Optimization: If it's a pass object, we only need the pass_code for V2
        let payload = data;
        if (!useLegacy && typeof data === 'object' && data.pass_code) {
            payload = data.pass_code;
        }

        const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        
        let result = '';
        for (let i = 0; i < jsonString.length; i++) {
            result += String.fromCharCode(jsonString.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        const b64 = btoa(result);
        
        if (useLegacy) {
            // Return with a deceptive prefix for generic scanners (Legacy V1)
            return `GATE0 SECURITY SYSTEM: UNAUTHORIZED TERMINAL DETECTED. LOGGING UNIT COORDINATES... \n\nDECRYPTION_ID: G0_V1_${b64}`;
        }

        // High-efficiency V2 format for speed and scanability
        return `G0:V2:${b64}`;
    } catch (e) {
        return typeof data === 'string' ? data : JSON.stringify(data);
    }
};

const QR_KEY_MAP = {
    id: 'id',
    vn: 'visitor_name',
    vm: 'visitor_mobile',
    sn: 'service_name',
    rn: 'resident_name',
    hn: 'house_number',
    soc: 'society_name'
};

export const decryptPassData = (encryptedString) => {
    try {
        let payload = '';
        if (encryptedString.startsWith('G0:V2:')) {
            payload = encryptedString.replace('G0:V2:', '');
        } else if (encryptedString.includes('DECRYPTION_ID: G0_V1_')) {
            payload = encryptedString.split('DECRYPTION_ID: G0_V1_')[1];
        } else {
            return JSON.parse(encryptedString);
        }
        
        const decoded = atob(payload);
        
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        try {
            const parsed = JSON.parse(result);
            // Remap short keys if they exist
            const mapped = {};
            Object.keys(parsed).forEach(k => {
                const fullKey = QR_KEY_MAP[k] || k;
                mapped[fullKey] = parsed[k];
            });
            // Ensure both id and pass_code existing for compatibility
            if (mapped.id && !mapped.pass_code) mapped.pass_code = mapped.id;
            if (mapped.pass_code && !mapped.id) mapped.id = mapped.pass_code;
            return mapped;
        } catch (e) {
            // If not JSON, it's likely a raw pass_code from V2 optimization
            if (result.startsWith('PASS_')) {
                return { id: result, pass_code: result };
            }
            return { id: result };
        }
    } catch (e) {
        try {
            return JSON.parse(encryptedString);
        } catch (ee) {
            return { id: encryptedString };
        }
    }
};
