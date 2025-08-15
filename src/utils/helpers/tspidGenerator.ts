/**
 * Generates a random TSPID (Tracking Service Partner ID)
 * Format: 5 characters, lowercase letters with exactly 2 numbers
 */
export const generateTSPID = (): string => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    for (let i = 0; i < 2; i++) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return result.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validates a TSPID format
 * @param tspid - The TSPID to validate
 * @returns true if valid, false otherwise
 */
export const validateTSPID = (tspid: string): boolean => {
    if (!tspid || typeof tspid !== 'string') {
        return false;
    }
    
    const tspidRegex = /^[a-z0-9]{5}$/;
    if (!tspidRegex.test(tspid)) {
        return false;
    }
    
    const numberCount = (tspid.match(/[0-9]/g) || []).length;
    return numberCount === 2;
}; 