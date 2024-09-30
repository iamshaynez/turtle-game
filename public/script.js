// script.js
const socket = io();

const passwordContainer = document.getElementById('password-container');
const gameSelection = document.getElementById('game-selection');
const chatContainer = document.getElementById('chat-container');
const passwordInput = document.getElementById('password-input');
const submitPassword = document.getElementById('submit-password');
const gameList = document.getElementById('game-list');
const puzzleText = document.getElementById('puzzle-text');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessage = document.getElementById('send-message');

let currentGameId = null;

submitPassword.addEventListener('click', () => {
    const password = passwordInput.value;
    socket.emit('authenticate', password);
});

socket.on('authenticated', (isAuthenticated) => {
    if (isAuthenticated) {
        passwordContainer.style.display = 'none';
        gameSelection.style.display = 'block';
        socket.emit('get games');
    } else {
        alert('Incorrect password. Please try again.');
    }
});

socket.on('games list', (games) => {
    gameList.innerHTML = '';
    games.forEach(game => {
        const li = document.createElement('li');
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'game-title';
        titleDiv.textContent = game.title;
        
        const puzzleDiv = document.createElement('div');
        puzzleDiv.className = 'game-puzzle';
        puzzleDiv.textContent = game.puzzle;
        
        li.appendChild(titleDiv);
        li.appendChild(puzzleDiv);
        
        li.addEventListener('click', () => selectGame(game.id, game.puzzle));
        gameList.appendChild(li);
    });
});

function selectGame(gameId, puzzleContent) {
    currentGameId = gameId;
    gameSelection.style.display = 'none';
    chatContainer.style.display = 'flex';
    puzzleText.textContent = puzzleContent;
}

sendMessage.addEventListener('click', () => {
    const message = chatInput.value;
    if (message && currentGameId) {
        appendMessage('user', message);
        socket.emit('chat message', { gameId: currentGameId, message: message });
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage.click();
    }
});

socket.on('chat message', (msg) => {
    appendMessage('assistant', msg);
});

socket.on('error', (errorMsg) => {
    appendMessage('system', `Error: ${errorMsg}`, true);
});

function appendMessage(sender, message, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = message;
    if (isError) {
        messageElement.style.color = 'red';
    }
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}