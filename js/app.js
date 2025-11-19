// Fichier principal - Initialisation de l'application
class FocusISEPApp {
    constructor() {
        this.themeManager = new ThemeManager();
        this.authManager = new AuthManager();
        this.securityManager = securityManager;
        this.init();
    }

    init() {
        console.log('🚀 Initialisation de Focus ISEP...');
        this.setupEventListeners();
        this.setupServiceWorker();
        this.setupErrorHandling();
    }

    setupEventListeners() {
        // Modal de connexion
        const loginModal = document.getElementById('loginModal');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const closeModal = document.querySelector('.close-modal');
        const loginForm = document.getElementById('loginForm');

        // Gestion du modal de connexion
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🎯 Bouton connexion cliqué');
                loginModal.style.display = 'block';
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.authManager.logout();
            });
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                loginModal.style.display = 'none';
            });
        }

        // Fermer modal en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });

        // Connexion
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('email').value.trim();

                const result = await this.authManager.login(username, email);
                
                if (result.success) {
                    loginModal.style.display = 'none';
                    loginForm.reset();
                    showNotification(`🎉 Bienvenue ${username} !`, 'success');
                } else {
                    showNotification('❌ ' + result.error, 'error');
                }
            });
        }

        // Newsletter
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('newsletterEmail').value.trim();
                
                const result = await NewsletterManager.subscribe(email, this.authManager.currentUser?.id);
                
                if (result.success) {
                    showNotification('✅ Inscription à la newsletter réussie !', 'success');
                    newsletterForm.reset();
                } else {
                    showNotification('❌ ' + result.error, 'error');
                }
            });
        }

        // Gestion des clics sur les TDs
        document.querySelectorAll('.td-card:not(.locked-card)').forEach(card => {
            card.addEventListener('click', async (e) => {
                e.preventDefault();
                const tdNumber = parseInt(e.currentTarget.getAttribute('data-td'));
                const tdType = e.currentTarget.getAttribute('data-type');
                console.log('🎯 Clic sur TD:', tdNumber, tdType);
                
                if (!this.authManager.isLoggedIn()) {
                    showNotification('🔐 Veuillez vous connecter pour accéder aux TDs', 'info');
                    loginModal.style.display = 'block';
                    return;
                }

                // Mettre à jour le dernier accès
                await ProgressManager.updateLastAccessed(tdNumber, tdType);
                
                // Rediriger vers la page du TD
                this.navigateToTD(tdNumber, tdType);
            });
        });

        // Gestion des boutons de complétion
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('complete-btn')) {
                const tdNumber = e.target.getAttribute('data-td');
                const tdType = e.target.getAttribute('data-type');
                this.handleTDCompletion(tdNumber, tdType, e.target);
            }
        });

        // Gestion des pages légales
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const target = e.target.getAttribute('href').substring(1);
                
                if (['about', 'faq', 'cgu', 'privacy'].includes(target)) {
                    e.preventDefault();
                    LegalPagesManager.showPage(target + 'Page');
                }
            });
        });

        // Navigation smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#home' || href === '#proba-tds' || href === '#archi-ordi' || href === '#app' || href === '#newsletter') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });

        // Gestion des erreurs de chargement d'images
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                console.warn('🖼️ Image failed to load:', e.target.src);
                e.target.style.display = 'none';
            }
        }, true);
    }

    async handleTDCompletion(tdNumber, tdType, button) {
        if (!this.authManager.currentUser) {
            showNotification('🔐 Veuillez vous connecter pour enregistrer votre progression.', 'info');
            return;
        }

        const success = await ProgressManager.markTDCompleted(tdNumber, tdType);
        if (success) {
            button.innerHTML = '<i class="fas fa-check"></i> Terminé';
            button.classList.add('completed');
        }
    }

    navigateToTD(tdNumber, tdType) {
        const tdPages = {
            'proba_1': 'td1.html',
            'proba_2': 'td2.html',
            'proba_3': 'td3.html',
            'proba_4': 'td4.html',
            'proba_5': 'td5.html',
            'archi_1': 'archi1.html',
            'archi_2': 'archi2.html'
        };
        
        const pageKey = `${tdType}_${tdNumber}`;
        const tdPage = tdPages[pageKey];
        
        if (tdPage) {
            console.log('🔗 Redirection vers:', tdPage);
            window.location.href = tdPage;
        } else {
            showNotification('❌ Page TD non trouvée', 'error');
        }
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker enregistré:', registration);
                })
                .catch(error => {
                    console.log('❌ Erreur Service Worker:', error);
                });
        }
    }

    setupErrorHandling() {
        // Gestion globale des erreurs
        window.addEventListener('error', (e) => {
            console.error('🚨 Erreur globale:', e.error);
            this.securityManager.logSuspiciousActivity('system', `Global error: ${e.message}`);
        });

        // Gestion des promesses rejetées
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Promesse rejetée:', e.reason);
            this.securityManager.logSuspiciousActivity('system', `Unhandled promise: ${e.reason}`);
            e.preventDefault();
        });
    }
}

// Fonction utilitaire pour les notifications
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Utiliser safeInnerHTML pour éviter les injections XSS
    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    securityManager.safeInnerHTML(messageSpan, message);

    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'notification-content';
    contentDiv.appendChild(messageSpan);
    contentDiv.appendChild(closeButton);

    notification.appendChild(contentDiv);

    // Appliquer les styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '0',
        borderRadius: '8px',
        zIndex: '10000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '400px',
        animation: 'slideInRight 0.3s ease'
    });

    // Couleurs selon le type
    const colors = {
        success: { bg: '#4CAF50', text: '#fff' },
        error: { bg: '#f44336', text: '#fff' },
        info: { bg: '#2196F3', text: '#fff' }
    };

    const color = colors[type] || colors.info;
    notification.style.background = color.bg;
    notification.style.color = color.text;

    document.body.appendChild(notification);

    // Bouton de fermeture
    closeButton.addEventListener('click', () => {
        notification.remove();
    });

    // Fermeture automatique
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Gestionnaire de newsletter
class NewsletterManager {
    static async subscribe(email, userId = null) {
        try {
            // Validation de l'email
            email = securityManager.validateInput(email, 'email');

            const { data: existing, error: checkError } = await authManager.supabase
                .from('newsletter_subscriptions')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (existing) {
                return { success: false, error: 'Vous êtes déjà inscrit à la newsletter' };
            }

            const subscriptionData = {
                email: email,
                user_id: userId,
                subscribed_at: new Date().toISOString(),
                is_active: true
            };

            console.log('📧 Inscription newsletter sécurisée:', subscriptionData);

            const { data, error } = await authManager.supabase
                .from('newsletter_subscriptions')
                .insert([subscriptionData])
                .select()
                .single();

            if (error) throw error;
            
            console.log('✅ Inscription newsletter réussie');
            return { success: true, data };
            
        } catch (error) {
            console.error('❌ Erreur inscription newsletter:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.focusISEPApp = new FocusISEPApp();
    console.log('✅ Focus ISEP initialisé avec succès!');
});

// Ce fichier serait déployé à la racine du projet
