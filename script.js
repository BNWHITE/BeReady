// Fonction pour naviguer entre les pages et mettre à jour l'état actif
function navigateToPage(targetPage) {
    // Masquer toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Afficher la page cible
    const pageElement = document.getElementById(targetPage);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Mettre à jour la navigation active (principale)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Chercher le lien de navigation principal correspondant
    const mainNavPage = ['home', 'proba', 'telecom'].includes(targetPage) ? targetPage : 
                        targetPage.startsWith('td') ? 'proba' : 
                        ['archi', 'bruit', 'bilan', 'portee', 'shannon', 'antennes'].includes(targetPage) ? 'telecom' : 
                        'home';

    const activeLink = document.querySelector(`.nav-link[data-page="${mainNavPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Mettre à jour la progression à chaque changement de page
    updateProgress();
}

// Fonction pour mettre à jour la progression
function updateProgress() {
    // Progression Probabilités
    const probaCheckboxes = document.querySelectorAll('#proba .checkbox');
    const probaChecked = document.querySelectorAll('#proba .checkbox.checked').length;
    const probaProgress = (probaChecked / (probaCheckboxes.length || 1)) * 100; // Évite la division par zéro
    
    document.getElementById('proba-progress').style.width = `${probaProgress}%`;
    document.getElementById('proba-percentage').textContent = `${Math.round(probaProgress)}%`;
    
    // Progression Télécoms
    const telecomCheckboxes = document.querySelectorAll('#telecom .checkbox');
    const telecomChecked = document.querySelectorAll('#telecom .checkbox.checked').length;
    const telecomProgress = (telecomChecked / (telecomCheckboxes.length || 1)) * 100; // Évite la division par zéro
    
    document.getElementById('telecom-progress').style.width = `${telecomProgress}%`;
    document.getElementById('telecom-percentage').textContent = `${Math.round(telecomProgress)}%`;
}

// Événement global pour la navigation (liens nav, boutons retour, cartes)
document.querySelectorAll('.nav-link, .back-btn, .subject-card, .topic-card, .btn').forEach(element => {
    element.addEventListener('click', function(e) {
        e.preventDefault();
        
        // La page cible est dans data-page ou data-td
        const targetPage = this.dataset.page || this.dataset.td;
        
        if (targetPage) {
            navigateToPage(targetPage);
        }
    });
});

// Événement pour la gestion des checkboxes de progression
document.querySelectorAll('.checkbox').forEach(checkbox => {
    checkbox.addEventListener('click', function() {
        this.classList.toggle('checked');
        updateProgress();
    });
});

// Événement pour la gestion des solutions d'exercices
document.querySelectorAll('.toggle-solution').forEach(button => {
    button.addEventListener('click', function() {
        const solution = this.nextElementSibling;
        solution.classList.toggle('active');
        this.textContent = solution.classList.contains('active') ? 'Masquer la solution' : 'Voir la solution';
    });
});

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    // Assure que seule la page 'home' est active au départ si aucune autre page n'est spécifiée
    navigateToPage('home');
});
