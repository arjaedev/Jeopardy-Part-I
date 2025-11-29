import placeholderQuestions from "./placeholder-questions.js";

console.log("Jeopardy Game Script Loaded");

// Game State
let gameState = {
    players: [
        { name: "Player 1", score: 0 },
        { name: "Player 2", score: 0 }
    ],
    currentPlayerIndex: 0, // 0 for Player 1, 1 for Player 2
    currentQuestion: null,
    currentCard: null,
    round: 1, // 1, 2, or 'final'
    questionsAnswered: 0,
    maxQuestions: 30, // 6 categories * 5 questions
    passCount: 0 // Tracks how many players passed the current question
};

// DOM Elements
const elements = {
    turnIndicator: document.querySelector(".turn-indicator"),
    scoreBoard: document.querySelectorAll(".player-score .score"),
    gameBoard: document.querySelector(".Game-board"),
    guessInput: document.getElementById("user-guess"),
    guessButton: document.querySelector(".btn-guess"),
    passButton: document.querySelector(".btn-pass"),
    nextRoundButton: document.querySelector(".btn-next"),
    finalCategory: document.querySelector(".final-jeopardy .category"),
    finalQuestion: document.querySelector(".final-jeopardy .question"),
    wagerForm: document.getElementById("wager-form"),
    answerForm: document.getElementById("answer-form"),
    wagerInput: document.getElementById("wager"),
    answerInput: document.getElementById("answer"),
    wagerButton: document.querySelector("#wager-form button"),
    finalSubmitButton: document.querySelector("#answer-form button"),
    modalOverlay: document.getElementById("question-modal"),
    modalQuestionText: document.getElementById("modal-question-text")
};

// Initialization
function init() {
    const path = window.location.pathname;
    
    // Load state from localStorage
    loadState();

    if (path.includes("round-1.html")) {
        gameState.round = 1;
        setupRound(1);
    } else if (path.includes("round-2.html")) {
        gameState.round = 2;
        setupRound(2);
    } else if (path.includes("final-jeopardy.html")) {
        gameState.round = 'final';
        setupFinalJeopardy();
    } else {
        // Landing page
        localStorage.removeItem('jeopardyState');
    }

    updateScoreBoard();
    updateTurnIndicator();
}

function loadState() {
    const savedState = localStorage.getItem('jeopardyState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState.players = parsedState.players;
        gameState.currentPlayerIndex = parsedState.currentPlayerIndex;
        // We don't load round specific state like currentQuestion as we reload the page
    }
}

function saveState() {
    localStorage.setItem('jeopardyState', JSON.stringify({
        players: gameState.players,
        currentPlayerIndex: gameState.currentPlayerIndex
    }));
}

function setupRound(roundNumber) {
    console.log(`Setting up Round ${roundNumber}`);
    
    // Disable controls initially
    if (elements.guessButton) elements.guessButton.disabled = true;
    if (elements.passButton) elements.passButton.disabled = true;
    if (elements.nextRoundButton) elements.nextRoundButton.disabled = true;
    if (elements.guessInput) elements.guessInput.disabled = true;

    // Setup Board
    const topics = document.querySelectorAll(".topic");
    topics.forEach(topic => {
        const categoryTitle = topic.querySelector(".category-title").textContent.trim();
        const cards = topic.querySelectorAll(".card");
        
        // Get questions for this category
        // Round 1: First 5 questions, Round 2: Next 5 questions
        const categoryQuestions = placeholderQuestions.filter(q => q.category === categoryTitle);
        const startIndex = (roundNumber - 1) * 5;
        const roundQuestions = categoryQuestions.slice(startIndex, startIndex + 5);

        cards.forEach((card, index) => {
            if (roundQuestions[index]) {
                card.dataset.question = roundQuestions[index].question;
                card.dataset.answer = roundQuestions[index].answer;
                card.dataset.points = card.textContent.replace('$', ''); // Get points from text
                
                card.addEventListener("click", handleCardClick);
            }
        });
    });

    // Event Listeners for Controls
    if (elements.guessButton) elements.guessButton.addEventListener("click", handleGuess);
    if (elements.passButton) elements.passButton.addEventListener("click", handlePass);
}

function handleCardClick(event) {
    if (gameState.currentQuestion) {
        alert("Please answer or pass the current question first!");
        return;
    }

    const card = event.target;
    
    // Check if card is already answered (empty)
    if (card.classList.contains("disabled")) return;

    gameState.currentCard = card;
    gameState.currentQuestion = {
        question: card.dataset.question,
        answer: card.dataset.answer,
        points: parseInt(card.dataset.points)
    };
    gameState.passCount = 0;

    // Display Question in Modal
    if (elements.modalQuestionText) {
        elements.modalQuestionText.textContent = gameState.currentQuestion.question;
    }
    if (elements.modalOverlay) {
        elements.modalOverlay.classList.add("active");
    }

    // Enable Controls
    elements.guessButton.disabled = false;
    elements.passButton.disabled = false;
    elements.guessInput.disabled = false;
    elements.guessInput.focus();
}

function handleGuess() {
    const userGuess = elements.guessInput.value.trim();
    if (!userGuess) return;

    const correctAnswer = gameState.currentQuestion.answer;
    const points = gameState.currentQuestion.points;

    if (userGuess.toLowerCase() === correctAnswer.toLowerCase()) {
        // Correct Answer
        alert("Correct!");
        gameState.players[gameState.currentPlayerIndex].score += points;
        endQuestion(true);
    } else {
        // Incorrect Answer
        alert("Incorrect!");
        gameState.players[gameState.currentPlayerIndex].score -= points;
        updateScoreBoard();
        
        // Switch turn
        switchTurn();
        
        // Check if all players have had a chance (assuming 2 players)
        gameState.passCount++;
        if (gameState.passCount >= 2) {
             alert(`No one got it right. The answer was: ${correctAnswer}`);
             endQuestion(false);
             // Original player gets to choose, so we might need to revert turn or just keep it as is?
             // "if no one guesses correctly the original player gets to choose a new question"
             // If we switched turn twice, we are back to original player.
        }
    }
    
    elements.guessInput.value = "";
}

function handlePass() {
    gameState.passCount++;
    switchTurn();
    
    if (gameState.passCount >= 2) {
        alert(`Both players passed. The answer was: ${gameState.currentQuestion.answer}`);
        endQuestion(false);
    }
}

function switchTurn() {
    gameState.currentPlayerIndex = gameState.currentPlayerIndex === 0 ? 1 : 0;
    updateTurnIndicator();
}

function updateTurnIndicator() {
    if (elements.turnIndicator) {
        elements.turnIndicator.textContent = `${gameState.players[gameState.currentPlayerIndex].name}'s Turn`;
    }
}

function updateScoreBoard() {
    if (elements.scoreBoard) {
        elements.scoreBoard[0].textContent = gameState.players[0].score;
        elements.scoreBoard[1].textContent = gameState.players[1].score;
    }
    saveState();
}

function endQuestion(answeredCorrectly) {
    // Hide Modal
    if (elements.modalOverlay) {
        elements.modalOverlay.classList.remove("active");
    }

    // Clear card
    gameState.currentCard.textContent = "";
    gameState.currentCard.classList.add("disabled");
    gameState.currentCard.classList.remove("active");
    gameState.currentCard.removeEventListener("click", handleCardClick);

    // Reset State
    gameState.currentQuestion = null;
    gameState.currentCard = null;
    gameState.passCount = 0;

    // Disable Controls
    elements.guessButton.disabled = true;
    elements.passButton.disabled = true;
    elements.guessInput.disabled = true;

    updateScoreBoard();
    gameState.questionsAnswered++;

    checkRoundEnd();
}

function checkRoundEnd() {
    const maxScore = Math.max(gameState.players[0].score, gameState.players[1].score);
    const threshold = gameState.round === 1 ? 15000 : 30000;
    const boardCleared = gameState.questionsAnswered >= gameState.maxQuestions;

    if (maxScore >= threshold || boardCleared) {
        alert("Round Over!");
        elements.nextRoundButton.disabled = false;
    }
}

// Final Jeopardy Logic
let finalWagers = [null, null];
let finalAnswers = [null, null];

function setupFinalJeopardy() {
    console.log("Setting up Final Jeopardy");
    
    // Get Final Jeopardy Question
    const finalQ = placeholderQuestions.find(q => q.category === "Final");
    if (finalQ) {
        elements.finalCategory.textContent = finalQ.category;
        // Hide question initially? "Then the question is revealed" after wagers.
        // But the HTML has it hardcoded. Let's hide it or replace text.
        elements.finalQuestion.textContent = "Place your wagers first!";
        gameState.currentQuestion = finalQ;
    }

    // Setup Wager Form
    elements.wagerForm.addEventListener("submit", handleWager);
    elements.answerForm.addEventListener("submit", handleFinalAnswer);
    
    // Start with Player 1
    gameState.currentPlayerIndex = 0;
    updateTurnIndicator();
    alert(`${gameState.players[0].name}, place your wager.`);
}

function handleWager(event) {
    event.preventDefault();
    const wager = parseInt(elements.wagerInput.value);
    const player = gameState.players[gameState.currentPlayerIndex];

    if (isNaN(wager) || wager < 0 || wager > player.score) {
        alert(`Invalid wager. You can wager up to ${player.score}`);
        return;
    }

    finalWagers[gameState.currentPlayerIndex] = wager;
    elements.wagerInput.value = "";

    if (gameState.currentPlayerIndex === 0) {
        gameState.currentPlayerIndex = 1;
        updateTurnIndicator();
        alert(`${gameState.players[1].name}, place your wager.`);
    } else {
        // Both wagered
        startFinalQuestion();
    }
}

function startFinalQuestion() {
    elements.wagerForm.style.display = "none";
    elements.finalQuestion.textContent = gameState.currentQuestion.question;
    elements.finalSubmitButton.disabled = false;
    
    gameState.currentPlayerIndex = 0;
    updateTurnIndicator();
    alert(`${gameState.players[0].name}, enter your answer.`);
}

function handleFinalAnswer(event) {
    event.preventDefault();
    const answer = elements.answerInput.value.trim();
    finalAnswers[gameState.currentPlayerIndex] = answer;
    elements.answerInput.value = "";

    if (gameState.currentPlayerIndex === 0) {
        gameState.currentPlayerIndex = 1;
        updateTurnIndicator();
        alert(`${gameState.players[1].name}, enter your answer.`);
    } else {
        // Both answered
        calculateFinalScores();
    }
}

function calculateFinalScores() {
    const correctAnswer = gameState.currentQuestion.answer;
    let resultMessage = `The correct answer was: ${correctAnswer}\n\n`;

    gameState.players.forEach((player, index) => {
        const wager = finalWagers[index];
        const answer = finalAnswers[index];
        
        if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
            player.score += wager;
            resultMessage += `${player.name} was Correct! (+${wager})\n`;
        } else {
            player.score -= wager;
            resultMessage += `${player.name} was Incorrect. (-${wager})\n`;
        }
    });

    updateScoreBoard();
    
    // Determine Winner
    const p1Score = gameState.players[0].score;
    const p2Score = gameState.players[1].score;
    
    if (p1Score > p2Score) {
        resultMessage += `\n${gameState.players[0].name} Wins!`;
    } else if (p2Score > p1Score) {
        resultMessage += `\n${gameState.players[1].name} Wins!`;
    } else {
        resultMessage += `\nIt's a Tie!`;
    }

    alert(resultMessage);
    // Disable everything or offer restart
    elements.finalSubmitButton.disabled = true;
    elements.answerInput.disabled = true;
}

// Start the game
init();
