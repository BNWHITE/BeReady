// Fonction utilitaire de base pour les notifications, si elle n'est pas définie ailleurs
// (Cette fonction est utilisée par auth-manager.js)
const showNotification = (message, type) => {
    console.log(`[Notification ${type}]: ${message}`);
    // Implémentation visuelle de la notification si elle n'est pas fournie (ici on utilise juste alert)
    if (type === 'error') {
        alert(`Erreur: ${message}`);
    } else {
        // Pour les messages de succès/info, on peut se contenter d'un console.log ou d'une notification discrète
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. FONCTIONS ET NAVIGATION ORIGINALES ---

    // Fonction pour ajouter les écouteurs pour les boutons "Voir la solution"
    const addSolutionTogglers = () => {
        document.querySelectorAll('.toggle-solution').forEach(button => {
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


    // --- 2. INITIALISATION DES MANAGERS (CORRECTION) ---

    // Initialisation du gestionnaire de Thème (bouton sombre/clair)
    if (typeof ThemeManager !== 'undefined') {
        new ThemeManager();
    }
    
    // Initialisation du gestionnaire d'Authentification
    if (typeof AuthManager !== 'undefined') {
        // Stocker l'instance globalement pour y accéder facilement
        window.authManager = new AuthManager(); 
        
        // --- 3. LOGIQUE MODALE DE CONNEXION (CORRECTION) ---
        
        const loginModal = document.getElementById('loginModal');
        const loginBtn = document.getElementById('loginBtn');
        const closeBtn = document.querySelector('.modal .close-modal');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginForm = document.getElementById('loginForm');
        
        // Ouvrir la modale au clic sur "Se connecter"
        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', () => {
                loginModal.style.display = 'block';
                // Optionnel : Réinitialiser le formulaire
                loginForm.reset(); 
            });
        }
        
        // Fermer la modale avec le bouton 'x'
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
                
                const result = await window.authManager.login(username, email);
                
                if (result.success) {
                    loginModal.style.display = 'none';
                    showNotification(`Bienvenue, ${result.user.username}!`, 'success');
                } else {
                    showNotification(result.error || 'Erreur inconnue lors de la connexion.', 'error');
                }
            });
        }
        
        // Gérer la déconnexion
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.authManager.logout();
            });
        }
    }

    // --- 4. GESTION NEWSLETTER (AJOUT) ---
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterStatus = document.getElementById('newsletterStatus');
    
    if (newsletterForm && newsletterStatus) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            
            // Logique de soumission de la newsletter (simulée ici car le script n'est pas fourni)
            console.log(`Inscription newsletter pour: ${email}`);
            
            // Masquer le formulaire et afficher un message de succès
            const formContainer = document.getElementById('newsletterFormContainer');
            if (formContainer) formContainer.style.display = 'none';
            
            newsletterStatus.style.display = 'block';
            newsletterStatus.className = 'success-message';
            securityManager.safeInnerHTML(newsletterStatus, `✅ Merci ! Votre email ${email} a été enregistré pour la newsletter.`);
        });
    }

    // Initialisation des togglers (à la fin pour s'assurer que tout est chargé)
    addSolutionTogglers();
});
