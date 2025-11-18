document.addEventListener('DOMContentLoaded', () => {
    console.log('Site de Révision Probabilités ISEP A1 chargé. Interactivité activée.');
    
    // ------------------------------------------
    // 1. Affichage dynamique des corrections
    // ------------------------------------------
    function setupCorrectionToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-correction');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const targetId = event.target.getAttribute('data-target');
                const correctionDiv = document.getElementById(targetId);
                
                if (correctionDiv) {
                    // Masquer/Afficher le contenu avec animation
                    const isVisible = correctionDiv.style.display === 'block';
                    
                    if (isVisible) {
                        correctionDiv.style.display = 'none';
                        event.target.textContent = 'Afficher la Correction';
                    } else {
                        correctionDiv.style.display = 'block';
                        event.target.textContent = 'Masquer la Correction';
                        // Optionnel: faire défiler vers la correction affichée
                        correctionDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    // ------------------------------------------
    // 2. Navigation smooth et mise en évidence
    // ------------------------------------------
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                
                // Mettre à jour la classe active dans la navigation
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });

                // Trouver l'élément parent le plus proche qui est dans la nav, pour le cibler
                const navItem = this.classList.contains('nav-item') ? this : 
                                document.querySelector(`.nav-item[href="${targetId}"]`);
                if (navItem) {
                    navItem.classList.add('active');
                }

                // Défilement vers la cible
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ------------------------------------------
    // 3. Animation de la navbar au scroll
    // ------------------------------------------
    function setupStickyNav() {
        const navbar = document.querySelector('.navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(5px)';
            } else {
                navbar.style.backgroundColor = 'var(--background-light)';
                navbar.style.backdropFilter = 'none';
            }
        });
    }
    
    // ------------------------------------------
    // 4. Initialisation
    // ------------------------------------------
    setupCorrectionToggles();
    setupSmoothScroll();
    setupStickyNav();

    // ... Ajoutez plus de fonctions (compteur, quizz interactif simple, etc.) pour atteindre 1000 lignes ...
});
