require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const OpenAI = require('openai');
const games = require('./games');  // 导入游戏数据

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const PASSWORD = process.env.APP_PASSWORD;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('authenticate', (password) => {
    if (password === PASSWORD) {
      socket.emit('authenticated', true);
    } else {
      socket.emit('authenticated', false);
    }
  });

  socket.on('get games', () => {
    const gamesList = games.map(game => ({ id: game.id, title: game.title, puzzle: game.puzzle }));
    socket.emit('games list', gamesList);
  });

  socket.on('chat message', async ({ gameId, message }) => {
    console.log(`Game ID: ${gameId}, User message: ${message}`);
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          { role: "system", content: game.systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
      });

      socket.emit('chat message', response.choices[0].message.content);
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'An error occurred while processing your request.';
      if (error.response) {
        errorMessage += ` Status: ${error.response.status}. ${error.response.data.error.message}`;
      } else if (error.message) {
        errorMessage += ` ${error.message}`;
      }
      socket.emit('error', errorMessage);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));