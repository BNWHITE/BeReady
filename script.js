document.addEventListener('DOMContentLoaded', () => {
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

    // CORRECTION : Ne bloquer que les ancres de navigation (header)
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
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
