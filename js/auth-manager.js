class AuthManager {
    constructor() {
        this.currentUser = null;
        this.supabase = window.supabase.createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
        this.init();
    }

    async init() {
        console.log('🔧 Initialisation AuthManager avec Supabase...');
        
        // Vérifier si l'utilisateur est déjà connecté
        const savedUser = localStorage.getItem('focusUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
                await this.loadUserProgress();
                await this.updateStats();
            } catch (e) {
                console.error('Erreur parsing saved user:', e);
                localStorage.removeItem('focusUser');
            }
        }
        
        await this.updateStats();
    }

    async login(username, email) {
        // Validation des inputs
        try {
            username = securityManager.validateInput(username, 'username');
            email = securityManager.validateInput(email, 'email');
        } catch (error) {
            return { success: false, error: error.message };
        }

        // Rate limiting
        if (!securityManager.checkRateLimit(email, 'login')) {
            return { success: false, error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.' };
        }

        const submitBtn = document.getElementById('loginSubmitBtn');
        const btnText = document.getElementById('loginBtnText');
        const spinner = document.getElementById('loginSpinner');
        
        // Afficher le spinner
        btnText.textContent = 'Connexion...';
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            console.log('🔐 Tentative de connexion sécurisée:', { username, email });

            // Vérifier d'abord si l'utilisateur existe
            const { data: existingUser, error: checkError } = await this.supabase
                .from('users')
                .select('*')
                .or(`username.eq.${username},email.eq.${email}`)
                .maybeSingle();

            let user;
            
            if (existingUser) {
                // Utilisateur existant
                console.log('👤 Utilisateur existant trouvé');
                user = existingUser;
                
                // Mettre à jour last_login
                const { error: updateError } = await this.supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', user.id);
                    
                if (updateError) {
                    console.warn('⚠️ Erreur mise à jour last_login:', updateError);
                }
            } else {
                // Nouvel utilisateur - création
                console.log('🆕 Création nouvel utilisateur');
                const { data: newUser, error: insertError } = await this.supabase
                    .from('users')
                    .insert([{ 
                        username, 
                        email,
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('❌ Erreur création utilisateur:', insertError);
                    throw insertError;
                }
                user = newUser;
                console.log('✅ Nouvel utilisateur créé:', user);
                
                // NOUVEAU : Afficher le message de bienvenue et appel à contribution
                this.displayWelcomeMessage(user.username);
            }

            this.currentUser = user;
            localStorage.setItem('focusUser', JSON.stringify(user));
            this.updateUI();
            await this.loadUserProgress();
            await this.updateStats();
            
            return { success: true, user };
            
        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            
            let errorMessage = 'Erreur de connexion';
            
            if (error.code === '23505') {
                errorMessage = 'Ce pseudo ou email est déjà utilisé';
            } else if (error.message.includes('JWT')) {
                errorMessage = 'Erreur de configuration Supabase';
            } else if (error.message.includes('relation "users" does not exist')) {
                errorMessage = 'Base de données non configurée. Contactez l\'administrateur.';
            } else {
                errorMessage = error.message || 'Erreur inconnue';
            }
            
            return { success: false, error: errorMessage };
        } finally {
            btnText.textContent = 'Se connecter / S\'inscrire';
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    // NOUVELLE MÉTHODE POUR AFFICHER LE MESSAGE DE BIENVENUE ET D'APPEL À CONTRIBUTION
    displayWelcomeMessage(username) {
        const welcomeMessage = `
            🎉 Bienvenue sur Focus ISEP, ${username} ! 🎉
            
            Votre inscription a été validée. Vous pouvez maintenant accéder à toutes les ressources.
            
            ⚠️ IMPORTANT : Respect et Alerte
            * Veuillez utiliser ces ressources pour votre apprentissage personnel uniquement.
            * Si vous trouvez une erreur, une faute de frappe, ou un contenu incorrect, veuillez nous en informer immédiatement (via l'email de contact). Votre vigilance est essentielle !
            
            🚀 REJOIGNEZ LA TEAM !
            * Nous sommes un projet étudiant collaboratif. Si vous souhaitez fournir des ressources (TDs corrigés, fiches, etc.) ou participer au développement, contactez l'administrateur pour rejoindre l'équipe de contributeurs.
        `;
        
        // Utiliser une alerte pour garantir que le message est vu (simule l'email)
        alert(welcomeMessage); 
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('focusUser');
        this.updateUI();
        // Assuming userProgress is globally defined
        if (typeof userProgress !== 'undefined') userProgress = {};
        this.updateProgressUI();
        this.updateStats();
        // Assuming showNotification is globally available
        if (typeof showNotification !== 'undefined') {
            showNotification('👋 Déconnexion réussie', 'info');
        } else {
            console.log('👋 Déconnexion réussie');
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const userGreeting = document.getElementById('userGreeting');
        const progressIndicator = document.getElementById('progressIndicator');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
             // Assuming securityManager is globally available
            if (typeof securityManager !== 'undefined') {
                 securityManager.safeInnerHTML(userGreeting, `Bonjour, ${this.currentUser.username}`);
            } else {
                 userGreeting.textContent = `Bonjour, ${this.currentUser.username}`;
            }
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
            const { data, error } = await this.supabase
                .from('td_progress')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (error) {
                if (error.message.includes('relation "td_progress" does not exist')) {
                    console.warn('⚠️ Table td_progress non trouvée');
                    return;
                }
                throw error;
            }

            // Assuming userProgress is globally defined
            userProgress = {};
            if (data) {
                data.forEach(progress => {
                    userProgress[`${progress.td_type}_${progress.td_number}`] = progress;
                });
            }

            console.log('✅ Progression chargée:', userProgress);
            this.updateProgressUI();
            this.updateTDCards();
            // Assuming BadgeManager is globally available
            if (typeof BadgeManager !== 'undefined') {
                 BadgeManager.checkBadges();
            }
            
        } catch (error) {
            console.error('❌ Erreur chargement progression:', error);
        }
    }

    updateProgressUI() {
        if (!this.currentUser) return;

        // Assuming userProgress is globally defined
        const completedTDs = Object.values(userProgress).filter(p => p.is_completed).length;
        const totalTDs = 7; // 5 proba + 2 archi
        const progressPercent = (completedTDs / totalTDs) * 100;

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progressPercent}%`;
            // Assuming securityManager is globally available
            if (typeof securityManager !== 'undefined') {
                securityManager.safeInnerHTML(progressText, `Votre progression: ${completedTDs}/${totalTDs} TDs complétés`);
            } else {
                progressText.textContent = `Votre progression: ${completedTDs}/${totalTDs} TDs complétés`;
            }
        }
    }

    updateTDCards() {
        const tdCards = document.querySelectorAll('.td-card:not(.locked-card)');
        
        // Assuming userProgress is globally defined
        tdCards.forEach(card => {
            const tdNumber = parseInt(card.getAttribute('data-td'));
            const tdType = card.getAttribute('data-type');
            const progressKey = `${tdType}_${tdNumber}`;
            const progress = userProgress[progressKey];
            
            if (progress && progress.is_completed) {
                card.classList.add('completed');
                let footer = card.querySelector('.card-footer');
                if (!footer) {
                    footer = document.createElement('div');
                    footer.className = 'card-footer';
                    card.appendChild(footer);
                }
                
                const completeBtn = footer.querySelector('.complete-btn');
                if (completeBtn) {
                    completeBtn.innerHTML = '<i class="fas fa-check"></i> Terminé';
                    completeBtn.classList.add('completed');
                }
            }
        });
    }

    async updateStats() {
        try {
            const { count, error } = await this.supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (error) {
                if (error.message.includes('relation "users" does not exist')) {
                    console.warn('⚠️ Table users non trouvée pour les stats');
                    return;
                }
                throw error;
            }

            if (!error && count !== null) {
                const totalUsersElement = document.getElementById('totalUsers');
                if (totalUsersElement) {
                     // Assuming securityManager is globally available
                    if (typeof securityManager !== 'undefined') {
                         securityManager.safeInnerHTML(totalUsersElement, count.toString());
                    } else {
                         totalUsersElement.textContent = count.toString();
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur mise à jour stats:', error);
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }
}
