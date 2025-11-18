/*
    ISEP A1 - Révisions Probabilités
    Fichier JavaScript pour l'interactivité (V2.0)
*/

document.addEventListener('DOMContentLoaded', () => {
    
    // ------------------------------------------
    // 1. Gestion du basculement des sections (Onglets)
    // ------------------------------------------
    window.showSection = function(sectionId, clickedButton) {
        const sections = document.querySelectorAll('.content-section');
        const tabs = document.querySelectorAll('.nav-tab');
        const targetSection = document.getElementById(sectionId);
        
        // 1. Désactiver toutes les sections et préparer l'animation de sortie
        sections.forEach(section => {
            if (section.classList.contains('active')) {
                // Animation de sortie (optionnel: fadeIn gère l'entrée, nous faisons un fadeOut)
                section.style.opacity = '0';
                setTimeout(() => {
                    section.classList.remove('active');
                    section.style.opacity = '1';
                }, 100); // Court délai pour l'effet de fade
            }
        });
        
        // 2. Mettre à jour les onglets actifs
        tabs.forEach(tab => tab.classList.remove('active'));
        clickedButton.classList.add('active');

        // 3. Afficher la nouvelle section
        setTimeout(() => {
            targetSection.classList.add('active');
            // Réinitialiser les animations de Scroll-Reveal pour la nouvelle section
            resetScrollReveal();
            // Déclencher le Scroll-Reveal sur la nouvelle section si elle est déjà visible
            checkScrollReveal(); 
        }, 100);
        
        // 4. Défilement vers le haut de la page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Gérer le clic sur les cartes TOC pour changer d'onglet
    const tocItems = document.querySelectorAll('.toc-item');
    tocItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section-target');
            const targetButton = document.querySelector(`.nav-tab[data-section="${targetSection}"]`);
            if (targetButton) {
                showSection(targetSection, targetButton);
            }
        });
    });

    // ------------------------------------------
    // 2. Gestion de l'affichage/masquage des corrections
    // ------------------------------------------
    window.toggleCorrection = function(id) {
        const correctionBox = document.getElementById(id);
        const button = event.target;
        
        // Le CSS gère l'animation via max-height et opacity
        correctionBox.classList.toggle('visible');
        
        if (correctionBox.classList.contains('visible')) {
            button.textContent = 'Masquer la correction';
            button.style.background = 'var(--text-light)';
        } else {
            button.textContent = 'Afficher la correction';
            button.style.background = 'var(--primary-purple)';
        }
    }

    // ------------------------------------------
    // 3. Scroll Reveal (Animations au défilement)
    // ------------------------------------------
    const revealElements = document.querySelectorAll('.scroll-reveal');

    // Fonction pour vérifier si un élément est visible
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.9 && // 90% de la hauteur de la vue
            rect.bottom >= 0
        );
    }

    // Fonction pour activer les animations
    function checkScrollReveal() {
        let delay = 0;
        revealElements.forEach(el => {
            if (isElementInViewport(el) && !el.classList.contains('active')) {
                // Ajouter un léger délai pour un effet "staggered" (en cascade)
                setTimeout(() => {
                    el.classList.add('active');
                }, delay);
                delay += 100; // 100ms de délai entre chaque élément
            }
        });
    }
    
    // Fonction pour réinitialiser les éléments (utile lors du changement d'onglet)
    function resetScrollReveal() {
        revealElements.forEach(el => {
            el.classList.remove('active');
        });
    }

    // Déclencher les animations au chargement et au scroll
    checkScrollReveal();
    window.addEventListener('scroll', checkScrollReveal);
    
    // ------------------------------------------
    // 4. Animation du Header (Sticky/Scroll)
    // ------------------------------------------
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            // Effet de transparence après 100px de scroll
            header.style.backgroundColor = 'rgba(99, 102, 241, 0.95)';
            header.style.backdropFilter = 'blur(5px)';
            header.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        } else {
            // Revenir au style de base
            header.style.backgroundColor = '';
            header.style.backdropFilter = 'none';
            header.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }
    });

    // ... Ajoutez plus de fonctions ou de jeux d'interaction ici pour enrichir ...
    console.log("Les animations et l'interactivité avancée sont prêtes !");
});
