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

    // La navigation par ancres reste la même
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Initialisation
    addSolutionTogglers();
});
