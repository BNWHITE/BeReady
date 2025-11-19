// Système de sécurité avancé
class SecurityManager {
    constructor() {
        this.failedAttempts = new Map();
        this.suspiciousActivities = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.monitorActivity();
    }

    // Rate limiting pour prévenir les attaques par force brute
    checkRateLimit(identifier, action) {
        const now = Date.now();
        const key = `${identifier}_${action}`;
        
        if (!this.failedAttempts.has(key)) {
            this.failedAttempts.set(key, []);
        }
        
        const attempts = this.failedAttempts.get(key);
        const recentAttempts = attempts.filter(time => now - time < CONFIG.SECURITY.RATE_LIMIT.TIME_WINDOW);
        
        if (recentAttempts.length >= CONFIG.SECURITY.RATE_LIMIT.LOGIN_ATTEMPTS) {
            this.logSuspiciousActivity(identifier, `Rate limit exceeded for ${action}`);
            return false;
        }
        
        recentAttempts.push(now);
        this.failedAttempts.set(key, recentAttempts);
        return true;
    }

    // Journalisation des activités suspectes
    logSuspiciousActivity(identifier, activity) {
        const timestamp = new Date().toISOString();
        console.warn(`🚨 Suspicious activity detected: ${activity} from ${identifier} at ${timestamp}`);
        
        // En production, envoyer ces logs à un service de monitoring
        if (CONFIG.APP.ENV === 'production') {
            this.sendToMonitoring({ identifier, activity, timestamp });
        }
    }

    // Validation des inputs côté client
    validateInput(input, type) {
        if (!input || typeof input !== 'string') {
            throw new AppError('Invalid input type', 'INVALID_INPUT');
        }

        const sanitized = Validator.sanitize(input.trim());
        
        switch (type) {
            case 'username':
                if (!Validator.username(sanitized)) {
                    throw new AppError('Invalid username format', 'INVALID_USERNAME');
                }
                break;
            case 'email':
                if (!Validator.email(sanitized)) {
                    throw new AppError('Invalid email format', 'INVALID_EMAIL');
                }
                break;
            case 'td_number':
                const tdNum = parseInt(sanitized);
                if (isNaN(tdNum) || tdNum < 1 || tdNum > 10) {
                    throw new AppError('Invalid TD number', 'INVALID_TD_NUMBER');
                }
                break;
            default:
                if (sanitized.length > 1000) {
                    throw new AppError('Input too long', 'INPUT_TOO_LONG');
                }
        }

        return sanitized;
    }

    // Protection XSS pour l'affichage dynamique
    safeInnerHTML(element, content) {
        if (!element || !content) return;
        
        if (typeof content === 'string') {
            element.textContent = content;
        } else {
            element.innerHTML = '';
            element.appendChild(content);
        }
    }

    // Vérification de l'intégrité des données
    verifyDataIntegrity(data, expectedSchema) {
        if (typeof data !== 'object' || data === null) {
            throw new AppError('Invalid data structure', 'INVALID_DATA');
        }

        for (const [key, type] of Object.entries(expectedSchema)) {
            if (!(key in data)) {
                throw new AppError(`Missing required field: ${key}`, 'MISSING_FIELD');
            }

            if (typeof data[key] !== type) {
                throw new AppError(`Invalid type for field: ${key}`, 'INVALID_TYPE');
            }
        }

        return true;
    }

    // Monitoring d'activité
    monitorActivity() {
        // Détection de navigation suspecte
        let lastMouseMove = Date.now();
        document.addEventListener('mousemove', () => {
            lastMouseMove = Date.now();
        });

        setInterval(() => {
            const inactiveTime = Date.now() - lastMouseMove;
            if (inactiveTime > 5 * 60 * 1000) { // 5 minutes d'inactivité
                this.logSuspiciousActivity('user', 'Extended inactivity detected');
            }
        }, 60000);
    }

    // Setup des écouteurs d'événements de sécurité
    setupEventListeners() {
        // Protection contre la copie non autorisée
        document.addEventListener('copy', (e) => {
            if (!e.target.closest('.allow-copy')) {
                e.preventDefault();
                showNotification('⚠️ La copie de contenu est restreinte', 'info');
            }
        });

        // Protection contre le clic droit
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.allow-context-menu')) {
                e.preventDefault();
                showNotification('⚠️ Menu contextuel désactivé', 'info');
            }
        });

        // Détection d'inspection d'éléments
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                this.logSuspiciousActivity('user', 'DevTools inspection detected');
            }
        });
    }

    // Envoi des logs de sécurité (à implémenter en production)
    sendToMonitoring(logData) {
        // Intégration avec un service comme Sentry, LogRocket, etc.
        console.log('📡 Sending security log:', logData);
    }
}

// Initialisation du gestionnaire de sécurité
const securityManager = new SecurityManager();

// Export pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, securityManager };
}
