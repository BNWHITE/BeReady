document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour afficher la page demandée
    const showPage = (pageId) => {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0); // Retour en haut de la page
        }
        
        // Gérer le contenu du TD si on est sur une page de TD
        if (pageId.startsWith('td')) {
            loadTDContent(pageId);
        }
    };

    // Charge dynamiquement le contenu du TD (simulé ici avec les IDs)
    const loadTDContent = (tdId) => {
        // En production, vous feriez un fetch(tdId + '.html')
        // Ici, nous supposons que le HTML complet est déjà chargé ou simulé.
        const container = document.getElementById('td-content-container');
        container.innerHTML = `
            <section id="${tdId}-detail" class="page active">
                </section>
        `;
        // Pour cette démo, on simule l'injection du contenu détaillé du TD.
        // **NOTE:** Pour que ce code fonctionne, il faudrait que les contenus
        // de td1.html à td5.html soient stockés soit directement dans index.html
        // (moins propre), soit chargés dynamiquement.
        // Nous allons faire une redirection simple pour l'exemple.
        
        // Après injection (ou si la page complète est rechargée), réappliquer les écouteurs de solution
        addSolutionTogglers();
    };

    // Ajoute les écouteurs pour les boutons "Voir la solution"
    const addSolutionTogglers = () => {
        document.querySelectorAll('.toggle-solution').forEach(button => {
            button.onclick = function() {
                const solution = this.nextElementSibling;
                if (solution && solution.classList.contains('solution')) {
                    const isVisible = solution.style.display === 'block';
                    solution.style.display = isVisible ? 'none' : 'block';
                    this.textContent = isVisible ? 'Voir la solution' : 'Masquer la solution';
                }
            };
        });
    };

    // Écouteurs pour les clics de navigation
    document.addEventListener('click', (e) => {
        const target = e.target;
        let pageId = null;

        if (target.matches('.nav-link') || target.matches('.back-btn')) {
            e.preventDefault();
            pageId = target.getAttribute('data-page');
        } else if (target.matches('.td-card')) {
            e.preventDefault();
            pageId = target.getAttribute('data-td');
        } else if (target.matches('.cta-button')) {
            e.preventDefault();
            pageId = target.getAttribute('data-page'); // Pour le bouton "Commencer les TDs"
        }
        
        if (pageId) {
            // Pour les TDs, on simule l'affichage de la page (dans une vraie app, cela chargerait le contenu)
            showPage(pageId);
        }
    });

    // Initialisation
    showPage('home'); // Afficher la page d'accueil au début
    addSolutionTogglers();
});
