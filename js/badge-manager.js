class BadgeManager {
    static badges = {
        'proba_master': { 
            title: '🎯 Maître des Probas', 
            desc: 'Compléter tous les TDs de Probabilités',
            icon: 'fas fa-chart-line',
            requirement: { type: 'proba', count: 5 }
        },
        'archi_expert': { 
            title: '💻 Expert Architecture', 
            desc: 'Compléter tous les modules Architecture',
            icon: 'fas fa-microchip',
            requirement: { type: 'archi', count: 2 }
        },
        'first_steps': { 
            title: '🚀 Premiers Pas', 
            desc: 'Compléter votre premier TD',
            icon: 'fas fa-footsteps',
            requirement: { type: 'any', count: 1 }
        },
        'dedicated_learner': { 
            title: '📚 Apprenant Assidu', 
            desc: 'Compléter 3 TDs différents',
            icon: 'fas fa-book',
            requirement: { type: 'any', count: 3 }
        }
    };

    static checkBadges() {
        const completedByType = {
            'proba': 0,
            'archi': 0,
            'any': 0
        };

        // Compter les TDs complétés par type
        Object.values(userProgress).forEach(progress => {
            if (progress.is_completed) {
                completedByType.any++;
                if (progress.td_type === 'proba') completedByType.proba++;
                if (progress.td_type === 'archi') completedByType.archi++;
            }
        });

        // Vérifier chaque badge
        Object.entries(this.badges).forEach(([badgeId, badge]) => {
            const req = badge.requirement;
            const count = req.type === 'any' ? completedByType.any : 
                         req.type === 'proba' ? completedByType.proba : 
                         completedByType.archi;

            if (count >= req.count && !earnedBadges.has(badgeId)) {
                this.awardBadge(badgeId);
            }
        });

        this.updateBadgesDisplay();
    }

    static awardBadge(badgeId) {
        earnedBadges.add(badgeId);
        showNotification(`🎉 Badge débloqué : ${this.badges[badgeId].title}`, 'success');
        
        // Animation spéciale
        const badgeElement = document.querySelector(`[data-badge="${badgeId}"]`);
        if (badgeElement) {
            badgeElement.classList.add('earned');
            badgeElement.style.animation = 'bounce 1s ease';
        }

        // Sauvegarder les badges débloqués
        this.saveBadges();
    }

    static updateBadgesDisplay() {
        const grid = document.getElementById('badgesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        Object.entries(this.badges).forEach(([badgeId, badge]) => {
            const isEarned = earnedBadges.has(badgeId);
            const badgeHTML = `
                <div class="badge ${isEarned ? 'earned' : ''}" data-badge="${badgeId}">
                    <div class="badge-icon">
                        <i class="${badge.icon}"></i>
                    </div>
                    <div class="badge-title">${badge.title}</div>
                    <div class="badge-desc">${badge.desc}</div>
                </div>
            `;
            grid.innerHTML += badgeHTML;
        });
    }

    static loadBadges() {
        const savedBadges = localStorage.getItem('earnedBadges');
        if (savedBadges) {
            try {
                const badgesArray = JSON.parse(savedBadges);
                earnedBadges = new Set(badgesArray);
            } catch (e) {
                console.error('Error loading badges:', e);
                earnedBadges = new Set();
            }
        }
        this.updateBadgesDisplay();
    }

    static saveBadges() {
        localStorage.setItem('earnedBadges', JSON.stringify([...earnedBadges]));
    }
}

// Set pour stocker les badges débloqués
let earnedBadges = new Set();

// Charger les badges au démarrage
document.addEventListener('DOMContentLoaded', () => {
    BadgeManager.loadBadges();
});
