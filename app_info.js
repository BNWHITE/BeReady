// app_info.js - Version Prépa Exam

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
});

function initTabs() {
    window.showTab = function(tabId) {
        // 1. Cacher tout
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        // 2. Activer la cible
        document.getElementById(tabId).classList.add('active');
        
        // 3. Activer le bouton (logique simple basée sur l'ordre)
        const btns = document.querySelectorAll('.tab-btn');
        if(tabId === 'conceptuel') btns[0].classList.add('active');
        if(tabId === 'mapping') btns[1].classList.add('active');
        if(tabId === 'exercices') btns[2].classList.add('active');
    }
}

window.toggleCorrection = function(id) {
    const corr = document.getElementById(id);
    if(corr.classList.contains('hidden')) {
        corr.classList.remove('hidden');
    } else {
        corr.classList.add('hidden');
    }
}
