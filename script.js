document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour ajouter les écouteurs pour les boutons "Voir la solution"
    const addSolutionTogglers = () => {
        document.querySelectorAll('.toggle-solution').forEach(button => {
            // S'assurer qu'on n'ajoute pas l'écouteur deux fois
            if (button.hasAttribute('data-listener-added')) return;
            
            button.onclick = function() {
                const solution = this.nextElementSibling;
                if (solution && solution.classList.contains('solution')) {
                    const isActive = solution.classList.toggle('active'); // Utiliser toggle
                    this.textContent = isActive ? 'Masquer la solution' : 'Voir la solution';
                }
            };
            button.setAttribute('data-listener-added', 'true');
        });
    };

    // CORRECTION : Ne bloquer que les ancres internes, pas les liens vers d'autres pages
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Vérifier que ce n'est pas un lien vers une page externe
        if (anchor.getAttribute('href').length > 1) { // Pas seulement "#"
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }
    });

    // Initialisation
    addSolutionTogglers();
});
