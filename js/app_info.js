// app_info.js

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAccordions();
    initQuiz();
});

// --- GESTION DES ONGLETS ---
function initTabs() {
    window.showTab = function(tabId) {
        // Cacher tous les contenus
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        // Désactiver tous les boutons
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        // Activer la cible
        document.getElementById(tabId).classList.add('active');
        // Trouver le bouton correspondant (basique)
        const btns = document.querySelectorAll('.tab-btn');
        if(tabId === 'cours') btns[0].classList.add('active');
        if(tabId === 'cheatsheet') btns[1].classList.add('active');
        if(tabId === 'quiz') btns[2].classList.add('active');
    }
}

// --- GESTION DES ACCORDEONS ---
function initAccordions() {
    const acc = document.getElementsByClassName("accordion-header");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            
            // Animation icône
            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                panel.classList.add('open');
            } else {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                panel.classList.remove('open');
            }
        });
    }
}

// --- MOTEUR DE QUIZ ---
// Questions basées sur les PDF fournis (MCD, Mapping, SQL)
const questions = [
    {
        question: "Dans un MCD, que représente une cardinalité 0..n ?",
        options: [
            "L'entité ne participe jamais à la relation",
            "L'entité participe 0 ou plusieurs fois à la relation",
            "L'entité participe exactement 'n' fois",
            "C'est une erreur de modélisation"
        ],
        correct: 1
    },
    {
        question: "Lors du mapping (passage au relationnel), une relation 1..n (One-to-Many) devient :",
        options: [
            "Une nouvelle table de jointure",
            "Une fusion des deux tables",
            "Une clé étrangère dans la table côté 'n' (plusieurs)",
            "Une clé étrangère dans la table côté '1'"
        ],
        correct: 2
    },
    {
        question: "Quelle commande SQL permet de supprimer une table ET ses données ?",
        options: [
            "DELETE TABLE",
            "DROP TABLE",
            "TRUNCATE TABLE",
            "REMOVE TABLE"
        ],
        correct: 1 // DROP supprime la structure et les données
    },
    {
        question: "Que fait la contrainte 'ON DELETE CASCADE' ?",
        options: [
            "Elle empêche la suppression",
            "Elle supprime les lignes enfants si le parent est supprimé",
            "Elle met les valeurs à NULL",
            "Elle affiche un message d'erreur"
        ],
        correct: 1
    },
    {
        question: "Quel est le type de données pour stocker une chaîne de caractères variable ?",
        options: [
            "INT",
            "CHAR",
            "VARCHAR",
            "BOOLEAN"
        ],
        correct: 2
    }
];

let currentQuestionIndex = 0;
let score = 0;

function initQuiz() {
    loadQuestion();
}

function loadQuestion() {
    const quizBox = document.getElementById('quiz-box');
    const q = questions[currentQuestionIndex];
    
    let html = `
        <div class="question-text">${currentQuestionIndex + 1}. ${q.question}</div>
        <div class="options-grid">
            ${q.options.map((opt, index) => `
                <button class="option-btn" onclick="checkAnswer(${index}, this)">${opt}</button>
            `).join('')}
        </div>
    `;
    
    quizBox.innerHTML = html;
}

window.checkAnswer = function(selectedIndex, btnElement) {
    const correctIndex = questions[currentQuestionIndex].correct;
    const buttons = document.querySelectorAll('.option-btn');
    
    // Désactiver tous les boutons
    buttons.forEach(btn => btn.disabled = true);
    
    if (selectedIndex === correctIndex) {
        btnElement.classList.add('correct');
        score++;
        document.getElementById('score').innerText = score;
    } else {
        btnElement.classList.add('wrong');
        // Montrer la bonne réponse
        buttons[correctIndex].classList.add('correct');
    }
    
    // Passer à la question suivante après 1.5s
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            showResult();
        }
    }, 1500);
}

function showResult() {
    document.getElementById('quiz-box').innerHTML = '';
    document.getElementById('quiz-result').classList.remove('hidden');
    document.querySelector('.quiz-header').style.display = 'none';
    
    let msg = "";
    if (score === 5) msg = "🥇 Expert BDD ! Tu vas tout déchirer !";
    else if (score >= 3) msg = "🥈 Pas mal ! Revois juste tes jointures.";
    else msg = "🥉 Encore un peu d'entraînement sur les fiches !";
    
    document.getElementById('result-message').innerHTML = `<h3>Score Final : ${score}/5</h3><p>${msg}</p>`;
}

window.resetQuiz = function() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('score').innerText = '0';
    document.getElementById('quiz-result').classList.add('hidden');
    document.querySelector('.quiz-header').style.display = 'flex';
    loadQuestion();
}
