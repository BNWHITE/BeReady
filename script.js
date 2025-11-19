// Fonction utilitaire de base pour les notifications (si non définie ailleurs)
const showNotification = (message, type) => {
    console.log(`[Notification ${type}]: ${message}`);
    // Implémentation visuelle simple (utilisée pour l'erreur de connexion ou le blocage d'accès)
    if (type === 'error') {
        alert(`Erreur: ${message}`);
    } else if (type === 'info' && message.includes('connecter')) {
        // Alerte douce pour l'accès refusé
        alert(message);
    }
    // Note: Le message de bienvenue est géré directement par alert() dans AuthManager
};

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. FONCTIONS ET NAVIGATION ORIGINALES ---

    // Fonction pour ajouter les écouteurs pour les boutons "Voir la solution"
    const addSolutionTogglers = () => {
        document.querySelectorAll('.toggle-solution').forEach(button => {
            // S'assurer qu'on n'ajoute pas l'écouteur deux fois
            if (button.hasAttribute('data-listener-added')) return;
            
            button.onclick = function() {
                const solution = this.nextElementSibling;
                if (solution && solution.classList.contains('solution')) {
                    const isActive = solution.classList.toggle('active'); 
                    this.textContent = isActive ? 'Masquer la solution' : 'Voir la solution';
                }
            };
            button.setAttribute('data-listener-added', 'true');
        });
    };

    // Gestion du défilement fluide pour les ancres de navigation (header)
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });


    // --- 2. INITIALISATION DES MANAGERS (CORRECTION DU THÈME ET AUTH) ---

    // Initialisation du gestionnaire de Thème (bouton sombre/clair)
    if (typeof ThemeManager !== 'undefined') {
        new ThemeManager();
    }
    
    // Initialisation du gestionnaire d'Authentification
    let authManager;
    if (typeof AuthManager !== 'undefined') {
        window.authManager = new AuthManager(); 
        authManager = window.authManager;
        
        // --- 3. LOGIQUE MODALE DE CONNEXION ---
        
        const loginModal = document.getElementById('loginModal');
        const loginBtn = document.getElementById('loginBtn');
        const closeBtn = document.querySelector('.modal .close-modal');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginForm = document.getElementById('loginForm');
        
        // Ouvrir la modale au clic sur "Se connecter"
        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', () => {
                loginModal.style.display = 'block';
                loginForm.reset(); 
            });
        }
        
        // Fermer la modale
        if (closeBtn && loginModal) {
            closeBtn.addEventListener('click', () => {
                loginModal.style.display = 'none';
            });
        }
        
        // Fermer la modale en cliquant à l'extérieur
        window.addEventListener('click', (event) => {
            if (event.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
        
        // Gérer la soumission du formulaire de connexion / inscription
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const email = document.getElementById('email').value;
                
                const result = await authManager.login(username, email);
                
                if (result.success) {
                    loginModal.style.display = 'none';
                } else {
                    showNotification(result.error || 'Erreur inconnue lors de la connexion.', 'error');
                }
            });
        }
        
        // Gérer la déconnexion
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.logout();
            });
        }
        
        // --- 4. LOGIQUE D'ACCÈS CONDITIONNEL (BLOQUE LES RESSOURCES SI DÉCONNECTÉ) ---
        
        // Cibler les cartes TD (.td-card) et les boutons d'accès APP (a.cta-button dans .app-card)
        document.querySelectorAll('.td-card, .app-card a.cta-button').forEach(element => {
            
            // On récupère l'URL soit depuis data-resource-url (TDs), soit depuis href (liens APP)
            const resourceUrl = element.getAttribute('data-resource-url') || element.getAttribute('href');

            // On ne bloque pas les ancres locales (#maths, #faq, etc.)
            if (!resourceUrl || resourceUrl.startsWith('#')) {
                return; 
            }

            element.addEventListener('click', function(e) {
                
                if (!authManager.isLoggedIn()) {
                    e.preventDefault(); // Bloque la navigation
                    
                    // Affiche la modale de connexion
                    if (loginModal) {
                        loginModal.style.display = 'block';
                    }
                    
                    showNotification('🔒 Veuillez vous connecter pour accéder à cette ressource.', 'info');
                } else if (resourceUrl && element.classList.contains('td-card')) {
                    // Si l'utilisateur est connecté et que c'est une carte TD (dont le href a été retiré), on navigue manuellement
                    e.preventDefault(); 
                    window.location.href = resourceUrl;
                }
                // Si l'utilisateur est connecté et que c'est un lien APP (<a> avec href), la navigation se fait par défaut.
            });
        });
    }


    // --- 5. GESTION NEWSLETTER (existante) ---
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterStatus = document.getElementById('newsletterStatus');
    
    // S'assurer que securityManager est disponible (il est dans le script.js d'index.html)
    if (newsletterForm && newsletterStatus && typeof securityManager !== 'undefined') {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            
            console.log(`Inscription newsletter pour: ${email}`);
            
            const formContainer = document.getElementById('newsletterFormContainer');
            if (formContainer) formContainer.style.display = 'none';
            
            newsletterStatus.style.display = 'block';
            newsletterStatus.className = 'success-message';
            securityManager.safeInnerHTML(newsletterStatus, `✅ Merci ! Votre email ${email} a été enregistré pour la newsletter.`);
        });
    }

    // Initialisation
    addSolutionTogglers();
});
