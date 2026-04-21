const SECRET_KEY = "GATE0_SECURE_TOKEN_2026";

/**
 * Custom Base64 implementation for cross-platform compatibility (RN/Web)
 */
const Base64 = {
    atob: (input = '') => {
        let str = String(input).trim().replace(/[=]+$/, '');
        let output = '';
        if (str.length % 4 === 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        for (let bc = 0, bs, buffer, i = 0;
            buffer = str.charAt(i++);
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = chars.indexOf(buffer);
        }
        return output;
    },
    btoa: (input = '') => {
        let str = String(input);
        let output = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        for (let block, charCode, i = 0, map = chars;
            str.charAt(i | 0) || (map = '=', i % 1);
            output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }
        return output;
    }
};

/**
 * Simple XOR-based "encryption" for QR codes.
 * OLD DENSITY (V1 JSON) - Restoration to "Old Way"
 */
export const encryptPassData = (data) => {
    try {
        // Old Schema: Ensure full keys are used for JSON density
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        
        let result = '';
        for (let i = 0; i < jsonString.length; i++) {
            result += String.fromCharCode(jsonString.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        const b64 = Base64.btoa(result);
        
        // Return with the classic deceptive prefix for "Old Way"
        return `GATE0 SECURITY SYSTEM: UNAUTHORIZED TERMINAL DETECTED. LOGGING UNIT COORDINATES... \n\nDECRYPTION_ID: G0_V1_${b64}`;
    } catch (e) {
        return typeof data === 'string' ? data : JSON.stringify(data);
    }
};

export const decryptPassData = (encryptedString) => {
    try {
        let payload = '';
        if (encryptedString.includes('DECRYPTION_ID: G0_V1_')) {
            payload = encryptedString.split('DECRYPTION_ID: G0_V1_')[1];
        } else if (encryptedString.startsWith('G0:V3:') || encryptedString.startsWith('G0:V2:')) {
            // Support legacy optimized formats if scanned
            payload = encryptedString.split(':').pop();
        } else {
            console.log('[CRYPTO] Raw JSON detected, parsing...');
            return JSON.parse(encryptedString);
        }
        
        console.log('[CRYPTO] Encrypted payload extracted:', payload.substring(0, 20) + '...');
        const decoded = Base64.atob(payload);
        
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        console.log('[CRYPTO] Decrypted result:', result.substring(0, 50) + '...');
        
        try {
            const parsed = JSON.parse(result);
            
            // Auto-normalize "short" keys to "full" keys if present (for backward compatibility)
            const QR_KEY_MAP = {
                id: 'id',
                vn: 'visitor_name',
                vm: 'visitor_mobile',
                sn: 'service_name',
                rn: 'resident_name',
                hn: 'house_number',
                soc: 'society_name'
            };
            
            const normalized = {};
            Object.keys(parsed).forEach(k => {
                const fullKey = QR_KEY_MAP[k] || k;
                normalized[fullKey] = parsed[k];
            });
            
            // Ensure pass_code compatibility
            if (normalized.id && !normalized.pass_code) normalized.pass_code = normalized.id;
            if (normalized.pass_code && !normalized.id) normalized.id = normalized.pass_code;
            
            return normalized;
        } catch (e) {
            // V3 delimited string fallback if parsing fails
            if (result.includes('|')) {
                const parts = result.split('|');
                return {
                    id: parts[0],
                    pass_code: parts[0],
                    visitor_name: parts[1],
                    visitor_mobile: parts[2],
                    service_name: parts[3],
                    resident_name: parts[4],
                    house_number: parts[5],
                    society_name: parts[6]
                };
            }
            return { id: result, pass_code: result };
        }
    } catch (e) {
        try {
            return JSON.parse(encryptedString);
        } catch (ee) {
            return { id: encryptedString, pass_code: encryptedString };
        }
    }
};
