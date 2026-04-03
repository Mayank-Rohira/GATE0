const SECRET_KEY = "GATE0_SECURE_TOKEN_2026";

/**
 * Simple XOR-based "encryption" for QR codes.
 * Not military grade, but sufficient to prevent human reading and basic camera scanners.
 * Generic scanners will see the prefix text, our app will decode the payload.
 */
export const encryptPassData = (data) => {
    try {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        
        let result = '';
        for (let i = 0; i < jsonString.length; i++) {
            result += String.fromCharCode(jsonString.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        // Encode to Base64 to make it safe for QR text
        const b64 = btoa(result);
        
        // Return with a deceptive prefix for generic scanners
        return `GATE0 SECURITY SYSTEM: UNAUTHORIZED TERMINAL DETECTED. LOGGING UNIT COORDINATES... \n\nDECRYPTION_ID: G0_V1_${b64}`;
    } catch (e) {
        return typeof data === 'string' ? data : JSON.stringify(data);
    }
};

export const decryptPassData = (encryptedString) => {
    try {
        if (!encryptedString.includes('DECRYPTION_ID: G0_V1_')) {
            // Not our encrypted format, maybe raw JSON or legacy?
            return JSON.parse(encryptedString);
        }
        
        const payload = encryptedString.split('DECRYPTION_ID: G0_V1_')[1];
        const decoded = atob(payload);
        
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        return JSON.parse(result);
    } catch (e) {
        // Fallback to trying raw JSON
        try {
            return JSON.parse(encryptedString);
        } catch (ee) {
            return { id: encryptedString }; // Error fallback or legacy string
        }
    }
};
