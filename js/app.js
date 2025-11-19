// Gestion de l'authentification
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🔧 Initialisation AuthManager avec Supabase...');
        
        // Vérifier la connexion Supabase
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Erreur connexion Supabase:', error);
        } else {
            console.log('✅ Connexion Supabase réussie!');
        }

        // Vérifier si l'utilisateur est déjà connecté
        const savedUser = localStorage.getItem('focusUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
            await this.loadUserProgress();
            await this.updateStats(); // Mettre à jour les stats
        }
        
        await this.updateStats(); // Stats même sans utilisateur connecté
    }

    async login(username, email) {
        const submitBtn = document.getElementById('loginSubmitBtn');
        const btnText = document.getElementById('loginBtnText');
        const spinner = document.getElementById('loginSpinner');
        
        // Afficher le spinner
        btnText.textContent = 'Connexion...';
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            console.log('🔐 Tentative de connexion:', { username, email });

            // Vérifier si l'utilisateur existe
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('email', email)
                .single();

            let user;
            
            if (existingUser) {
                // Utilisateur existant - mise à jour last_login
                console.log('👤 Utilisateur existant trouvé');
                user = existingUser;
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', user.id);
                    
                if (updateError) throw updateError;
            } else {
                // Nouvel utilisateur - création
                console.log('🆕 Création nouvel utilisateur');
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{ 
                        username, 
                        email,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('❌ Erreur création utilisateur:', insertError);
                    throw insertError;
                }
                user = newUser;
                console.log('✅ Nouvel utilisateur créé:', user);
            }

            this.currentUser = user;
            localStorage.setItem('focusUser', JSON.stringify(user));
            this.updateUI();
            await this.loadUserProgress();
            await this.updateStats();
            
            return { success: true, user };
            
        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            
            // Gestion d'erreurs spécifiques
            let errorMessage = 'Erreur de connexion';
            if (error.code === '23505') { // Violation de contrainte unique
                errorMessage = 'Ce pseudo ou email est déjà utilisé';
            } else if (error.message.includes('JWT')) {
                errorMessage = 'Erreur de configuration Supabase';
            }
            
            return { success: false, error: errorMessage };
        } finally {
            // Réinitialiser le bouton
            btnText.textContent = 'Se connecter / S\'inscrire';
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('focusUser');
        this.updateUI();
        userProgress = {};
        this.updateProgressUI();
        this.updateStats();
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const userGreeting = document.getElementById('userGreeting');
        const progressIndicator = document.getElementById('progressIndicator');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
            userGreeting.textContent = `Bonjour, ${this.currentUser.username}`;
            if (progressIndicator) progressIndicator.style.display = 'block';
        } else {
            loginBtn.style.display = 'block';
            userInfo.style.display = 'none';
            if (progressIndicator) progressIndicator.style.display = 'none';
        }
    }

    async loadUserProgress() {
        if (!this.currentUser) return;

        try {
            console.log('📊 Chargement progression pour:', this.currentUser.id);
            const { data, error } = await supabase
                .from('td_progress')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            userProgress = {};
            data.forEach(progress => {
                userProgress[progress.td_number] = progress;
            });

            console.log('✅ Progression chargée:', userProgress);
            this.updateProgressUI();
            this.updateTDCards();
            
        } catch (error) {
            console.error('❌ Erreur chargement progression:', error);
        }
    }

    updateProgressUI() {
        if (!this.currentUser) return;

        const completedTDs = Object.values(userProgress).filter(p => p.is_completed).length;
        const totalTDs = 5;
        const progressPercent = (completedTDs / totalTDs) * 100;

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progressPercent}%`;
            progressText.textContent = `Votre progression: ${completedTDs}/${totalTDs} TDs complétés`;
        }
    }

    updateTDCards() {
        const tdCards = document.querySelectorAll('.td-card:not(.locked-card)');
        
        tdCards.forEach(card => {
            const tdNumber = this.extractTDNumber(card);
            if (!tdNumber) return;
            
            const progress = userProgress[tdNumber];
            
            if (progress && progress.is_completed) {
                card.classList.add('completed');
                let footer = card.querySelector('.card-footer');
                if (!footer) {
                    footer = document.createElement('div');
                    footer.className = 'card-footer';
                    card.appendChild(footer);
                }
                footer.innerHTML = `<span class="completion-badge"><i class="fas fa-check"></i> Complété</span>`;
            }
        });
    }

    extractTDNumber(card) {
        const title = card.querySelector('h3');
        if (!title) return null;
        
        const match = title.textContent.match(/TD(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    async updateStats() {
        try {
            // Compter le nombre total d'utilisateurs
            const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (!error && count !== null) {
                const totalUsersElement = document.getElementById('totalUsers');
                if (totalUsersElement) {
                    totalUsersElement.textContent = count;
                }
            }
        } catch (error) {
            console.error('❌ Erreur mise à jour stats:', error);
        }
    }
}

// Gestion de la progression
class ProgressManager {
    static async markTDCompleted(tdNumber, score = null, timeSpent = null) {
        if (!authManager.currentUser) {
            showNotification('🔐 Veuillez vous connecter pour enregistrer votre progression.', 'info');
            return false;
        }

        try {
            const progressData = {
                user_id: authManager.currentUser.id,
                td_number: tdNumber,
                is_completed: true,
                completed_at: new Date().toISOString(),
                score: score,
                time_spent: timeSpent,
                last_accessed: new Date().toISOString()
            };

            console.log('💾 Sauvegarde progression:', progressData);

            const { data, error } = await supabase
                .from('td_progress')
                .upsert(progressData, { onConflict: 'user_id,td_number' })
                .select()
                .single();

            if (error) throw error;

            userProgress[tdNumber] = data;
            authManager.updateProgressUI();
            authManager.updateTDCards();
            
            showNotification('✅ Progression sauvegardée !', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde progression:', error);
            showNotification('❌ Erreur sauvegarde progression', 'error');
            return false;
        }
    }

    static async updateLastAccessed(tdNumber) {
        if (!authManager.currentUser) return;

        try {
            await supabase
                .from('td_progress')
                .upsert({
                    user_id: authManager.currentUser.id,
                    td_number: tdNumber,
                    last_accessed: new Date().toISOString()
                }, { onConflict: 'user_id,td_number' });
                
        } catch (error) {
            console.error('❌ Erreur mise à jour accès:', error);
        }
    }
}

// Gestion newsletter
class NewsletterManager {
    static async subscribe(email, userId = null) {
        try {
            // Vérifier si déjà inscrit
            const { data: existing, error: checkError } = await supabase
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

            console.log('📧 Inscription newsletter:', subscriptionData);

            const { data, error } = await supabase
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

// Initialisation
const authManager = new AuthManager();

// Événements DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de Focus ISEP...');

    // Modal de connexion
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');

    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    logoutBtn.addEventListener('click', () => {
        authManager.logout();
        showNotification('👋 Déconnexion réussie', 'info');
    });
    
    closeModal.addEventListener('click', () => loginModal.style.display = 'none');

    // Fermer modal en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Connexion
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();

        if (username.length < 3) {
            showNotification('❌ Le pseudo doit faire au moins 3 caractères', 'error');
            return;
        }

        const result = await authManager.login(username, email);
        
        if (result.success) {
            loginModal.style.display = 'none';
            loginForm.reset();
            showNotification(`🎉 Bienvenue ${username} !`, 'success');
        } else {
            showNotification('❌ ' + result.error, 'error');
        }
    });

    // Newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value.trim();
            
            const result = await NewsletterManager.subscribe(email, authManager.currentUser?.id);
            
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
            const tdNumber = authManager.extractTDNumber(card);
            if (!tdNumber) return;
            
            if (!authManager.currentUser) {
                showNotification('🔐 Connectez-vous pour accéder aux TDs', 'info');
                loginModal.style.display = 'block';
                return;
            }

            // Mettre à jour le dernier accès
            await ProgressManager.updateLastAccessed(tdNumber);
            
            // Rediriger vers la page du TD
            const href = card.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
            }
        });
    });

    console.log('✅ Focus ISEP initialisé avec succès!');
});

// Fonction utilitaire pour les notifications
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Styles de base
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
        info: { bg: '#2196F3', text: '#fff' },
        warning: { bg: '#ff9800', text: '#fff' }
    };

    const color = colors[type] || colors.info;
    notification.style.background = color.bg;
    notification.style.color = color.text;

    document.body.appendChild(notification);

    // Bouton de fermeture
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    // Fermeture automatique
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Animation CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        padding: 15px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 15px;
    }
    
    .notification-message {
        flex: 1;
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-left: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
