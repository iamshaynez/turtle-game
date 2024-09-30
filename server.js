require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const OpenAI = require('openai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 设置你的自定义 base URL
});

const PASSWORD = process.env.APP_PASSWORD;
const SYSTEM_PROMPT = `你是一个海龟汤游戏的主持人，你的目标是根据玩家的询问提供反馈。

你响应的规则：

- 玩家会向你询问他关于故事真相的猜测，如果玩家发来的不是一个疑问句或猜测，请让玩家重新提问。
- 判断玩家是否猜到或接近了故事真相的任何核心元素，如果是，恭喜玩家，并同时输出【故事的真相】给玩家。
- 玩家的问题没有触及真相, 根据玩家的问题，你要参考故事真相，回答“是”，“否”，“不相关”。你不能反馈任何其他信息，只有上面三种回答。
- 有一些关键信息请确保不会给玩家错误答案

本次游戏的故事：

- 【故事的谜面】有一天，一个男人A把B给杀了，警察逮捕他询问动机，他却回答道：一直都是黑的。试还原案件全貌。 
- 【故事的真相】A是一个疯狂的粉丝，就把摄像头或者监视器开起来装进包裹里送到偶像的家中，但是偶像根本不打开粉丝送的礼物，所以A在终端那边看到的影像一直是黑的，因为包裹不打开，没有光线。 因为偶像B压根就不打开他送的礼物，A的自尊心因此受挫，觉得自己像个小丑，于是把偶像杀掉了。
- 关键信息: A是B的粉丝,黑色的是光线有关,没有打开粉丝送的礼物
- 真相的核心元素：摄像头在盒子里,B没有打开礼物,A报复杀人

好了，现在玩家要开始提问了。`;

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

  socket.on('chat message', async (msg) => {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {role: "system", content: SYSTEM_PROMPT},
          {role: "user", content: msg}
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