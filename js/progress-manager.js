class ProgressManager {
    static async markTDCompleted(tdNumber, tdType) {
        if (!authManager.currentUser) {
            showNotification('🔐 Veuillez vous connecter pour enregistrer votre progression.', 'info');
            return false;
        }

        // Validation des données
        try {
            tdNumber = securityManager.validateInput(tdNumber.toString(), 'td_number');
            tdType = securityManager.validateInput(tdType, 'username'); // Réutilise la validation username pour la cohérence
        } catch (error) {
            showNotification('❌ Données invalides', 'error');
            return false;
        }

        try {
            const progressData = {
                user_id: authManager.currentUser.id,
                td_number: parseInt(tdNumber),
                td_type: tdType,
                is_completed: true,
                completed_at: new Date().toISOString(),
                last_accessed: new Date().toISOString()
            };

            // Vérification de l'intégrité des données
            securityManager.verifyDataIntegrity(progressData, {
                user_id: 'string',
                td_number: 'number',
                td_type: 'string',
                is_completed: 'boolean',
                completed_at: 'string',
                last_accessed: 'string'
            });

            console.log('💾 Sauvegarde progression sécurisée:', progressData);

            const { data, error } = await authManager.supabase
                .from('td_progress')
                .upsert(progressData, { onConflict: 'user_id,td_number,td_type' })
                .select()
                .single();

            if (error) throw error;

            const progressKey = `${tdType}_${tdNumber}`;
            userProgress[progressKey] = data;
            authManager.updateProgressUI();
            authManager.updateTDCards();
            
            showNotification('✅ Progression sauvegardée !', 'success');
            BadgeManager.checkBadges();
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde progression:', error);
            securityManager.logSuspiciousActivity(
                authManager.currentUser?.id || 'unknown', 
                `Progress save error: ${error.message}`
            );
            showNotification('❌ Erreur sauvegarde progression', 'error');
            return false;
        }
    }

    static async updateLastAccessed(tdNumber, tdType) {
        if (!authManager.currentUser) return;

        try {
            await authManager.supabase
                .from('td_progress')
                .upsert({
                    user_id: authManager.currentUser.id,
                    td_number: parseInt(tdNumber),
                    td_type: tdType,
                    last_accessed: new Date().toISOString()
                }, { onConflict: 'user_id,td_number,td_type' });
                
        } catch (error) {
            console.error('❌ Erreur mise à jour accès:', error);
        }
    }
}

// Variable globale pour la progression utilisateur
let userProgress = {};
