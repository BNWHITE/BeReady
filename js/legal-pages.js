class LegalPagesManager {
    static showPage(pageId) {
        // Cacher la page principale
        document.getElementById('home').style.display = 'none';
        
        // Afficher la page légale demandée
        const page = document.getElementById(pageId);
        if (page) {
            page.style.display = 'block';
            document.getElementById('legalPages').style.display = 'block';
            
            // Scroll vers le haut
            window.scrollTo(0, 0);
        }
    }
    
    static hideAll() {
        document.getElementById('legalPages').style.display = 'none';
        document.getElementById('home').style.display = 'block';
        
        // Cacher toutes les pages légales
        document.querySelectorAll('#legalPages > div').forEach(page => {
            page.style.display = 'none';
        });
    }
}
