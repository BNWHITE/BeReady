// Configuration de l'application
const CONFIG = {
    SUPABASE: {
        URL: 'https://eznzfgcwbqcckkvhsdhi.supabase.co',
        ANON_KEY: 'sb_publishable_6WhkWn3e1Gdy8DTnkLmjMA_O10roVtv'
    },
    SECURITY: {
        MAX_USERNAME_LENGTH: 50,
        MAX_EMAIL_LENGTH: 255,
        USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        RATE_LIMIT: {
            LOGIN_ATTEMPTS: 5,
            TIME_WINDOW: 15 * 60 * 1000 // 15 minutes
        }
    },
    APP: {
        VERSION: '1.0.0',
        ENV: 'production'
    }
};

// Validation des données utilisateur
const Validator = {
    username: (username) => {
        if (!username || username.length < 3 || username.length > CONFIG.SECURITY.MAX_USERNAME_LENGTH) {
            return false;
        }
        return CONFIG.SECURITY.USERNAME_PATTERN.test(username);
    },
    
    email: (email) => {
        if (!email || email.length > CONFIG.SECURITY.MAX_EMAIL_LENGTH) {
            return false;
        }
        return CONFIG.SECURITY.EMAIL_PATTERN.test(email);
    },
    
    sanitize: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
};

// Gestion des erreurs
class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'AppError';
        this.code = code;
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, Validator, AppError };
}
