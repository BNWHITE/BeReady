document.addEventListener('DOMContentLoaded', () => {
    console.log('Site de Révision Probabilités ISEP A1 chargé.');
    
    // Fonction pour l'affichage dynamique des corrections
    function setupCorrectionToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-correction');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const targetId = event.target.getAttribute('data-target');
                const correctionDiv = document.getElementById(targetId);
                
                if (correctionDiv) {
                    // Masquer/Afficher le contenu
                    const isVisible = correctionDiv.style.display === 'block';
                    correctionDiv.style.display = isVisible ? 'none' : 'block';
                    
                    // Mettre à jour le texte du bouton
                    event.target.textContent = isVisible ? 'Afficher la Correction' : 'Masquer la Correction';
                }
            });
        });
    }

    // Appliquer la fonction au chargement de la page pour tous les exercices
    setupCorrectionToggles();

    // Fonction pour la navigation smooth
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // ... Ajoutez plus de fonctions et de commentaires pour atteindre 1000 lignes ...
});
