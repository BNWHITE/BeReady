// Gestion de l'authentification
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Vérifier si l'utilisateur est déjà connecté (dans le localStorage)
        const savedUser = localStorage.getItem('focusUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
            await this.loadUserProgress();
        }
    }

    async login(username, email) {
        try {
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
                user = existingUser;
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ last_login: new Date() })
                    .eq('id', user.id);
            } else {
                // Nouvel utilisateur - création
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{ username, email }])
                    .select()
                    .single();
                
                if (insertError) throw insertError;
                user = newUser;
            }

            this.currentUser = user;
            localStorage.setItem('focusUser', JSON.stringify(user));
            this.updateUI();
            await this.loadUserProgress();
            
            return { success: true, user };
            
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('focusUser');
        this.updateUI();
        userProgress = {};
        this.updateProgressUI();
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
            progressIndicator.style.display = 'block';
        } else {
            loginBtn.style.display = 'block';
            userInfo.style.display = 'none';
            progressIndicator.style.display = 'none';
        }
    }

    async loadUserProgress() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await supabase
                .from('td_progress')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            userProgress = {};
            data.forEach(progress => {
                userProgress[progress.td_number] = progress;
            });

            this.updateProgressUI();
            this.updateTDCards();
            
        } catch (error) {
            console.error('Erreur chargement progression:', error);
        }
    }

    updateProgressUI() {
        if (!this.currentUser) return;

        const completedTDs = Object.values(userProgress).filter(p => p.is_completed).length;
        const totalTDs = 5; // TDs actuellement disponibles
        const progressPercent = (completedTDs / totalTDs) * 100;

        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('progressText').textContent = 
            `Votre progression: ${completedTDs}/${totalTDs} TDs complétés`;
    }

    updateTDCards() {
        const tdCards = document.querySelectorAll('.td-card:not(.locked-card)');
        
        tdCards.forEach(card => {
            const tdNumber = parseInt(card.querySelector('h3').textContent.replace('TD', ''));
            const progress = userProgress[tdNumber];
            
            if (progress) {
                if (progress.is_completed) {
                    card.classList.add('completed');
                    const footer = card.querySelector('.card-footer') || 
                                  card.appendChild(document.createElement('div'));
                    footer.className = 'card-footer';
                    footer.innerHTML = `<span class="completion-badge"><i class="fas fa-check"></i> Complété</span>`;
                }
            }
        });
    }
}

// Gestion de la progression
class ProgressManager {
    static async markTDCompleted(tdNumber, score = null, timeSpent = null) {
        if (!authManager.currentUser) {
            alert('Veuillez vous connecter pour enregistrer votre progression.');
            return false;
        }

        try {
            const progressData = {
                user_id: authManager.currentUser.id,
                td_number: tdNumber,
                is_completed: true,
                completed_at: new Date(),
                score: score,
                time_spent: timeSpent
            };

            const { data, error } = await supabase
                .from('td_progress')
                .upsert(progressData, { onConflict: 'user_id,td_number' })
                .select()
                .single();

            if (error) throw error;

            userProgress[tdNumber] = data;
            authManager.updateProgressUI();
            authManager.updateTDCards();
            
            return true;
            
        } catch (error) {
            console.error('Erreur sauvegarde progression:', error);
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
                    last_accessed: new Date()
                }, { onConflict: 'user_id,td_number' });
                
        } catch (error) {
            console.error('Erreur mise à jour accès:', error);
        }
    }
}

// Gestion newsletter
class NewsletterManager {
    static async subscribe(email, userId = null) {
        try {
            const subscriptionData = {
                email: email,
                user_id: userId,
                subscribed_at: new Date(),
                is_active: true
            };

            const { data, error } = await supabase
                .from('newsletter_subscriptions')
                .insert([subscriptionData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
            
        } catch (error) {
            console.error('Erreur inscription newsletter:', error);
            return { success: false, error: error.message };
        }
    }

    static async checkSubscription(email) {
        try {
            const { data, error } = await supabase
                .from('newsletter_subscriptions')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            return { subscribed: !!data, data };
            
        } catch (error) {
            return { subscribed: false };
        }
    }
}

// Initialisation
const authManager = new AuthManager();

// Événements DOM
document.addEventListener('DOMContentLoaded', function() {
    // Modal de connexion
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');

    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    logoutBtn.addEventListener('click', () => authManager.logout());
    closeModal.addEventListener('click', () => loginModal.style.display = 'none');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;

        const result = await authManager.login(username, email);
        
        if (result.success) {
            loginModal.style.display = 'none';
            loginForm.reset();
            showNotification('Connexion réussie !', 'success');
        } else {
            showNotification('Erreur de connexion: ' + result.error, 'error');
        }
    });

    // Newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;
        
        const result = await NewsletterManager.subscribe(email, authManager.currentUser?.id);
        
        if (result.success) {
            showNotification('Inscription à la newsletter réussie !', 'success');
            newsletterForm.reset();
        } else {
            showNotification('Erreur: ' + result.error, 'error');
        }
    });

    // Gestion des clics sur les TDs
    document.querySelectorAll('.td-card:not(.locked-card)').forEach(card => {
        card.addEventListener('click', async (e) => {
            e.preventDefault();
            const tdNumber = parseInt(card.querySelector('h3').textContent.replace('TD', ''));
            
            if (!authManager.currentUser) {
                loginModal.style.display = 'block';
                return;
            }

            // Mettre à jour le dernier accès
            await ProgressManager.updateLastAccessed(tdNumber);
            
            // Rediriger vers la page du TD
            window.location.href = card.getAttribute('href');
        });
    });
});

// Fonction utilitaire pour les notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '4px',
        color: 'white',
        zIndex: '1000',
        fontWeight: 'bold'
    });

    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else if (type === 'error') {
        notification.style.background = '#f44336';
    } else {
        notification.style.background = '#2196F3';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}
