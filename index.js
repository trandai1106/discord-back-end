require('dotenv').config();
const express = require('express');
const http = require("http");
const mongoose = require('mongoose');
const cors = require("cors");
const bodyParser = require('body-parser');
const multer = require('multer');

const roomRouter = require('./routers/room');
const authRouter = require('./routers/auth');
const directMessageRouter = require('./routers/directMessage');
const userRouter = require('./routers/user');
const path = require('path');
const socket = require('./utils/socket.js');

const upload = multer();
const app = express();

//#region CORS
const corsOptions = {
  methods: ["GET", "PUT", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
};
app.use(cors(corsOptions));
//#endregion

//#region Parse request data
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));
//#endregion

//#region Database connection
mongoose.set('strictQuery', true);
mongoose.connect(process.env.DB_URI, null).then(() => { console.log("Mongodb is connected"); });
//#endregion

const server = http.createServer(app);

//#region SocketIO
socket.init(server);
//#endregion

app.use('/auth', authRouter);
app.use('/chat/direct-message', directMessageRouter);
app.use('/users', userRouter);
app.use('/room', roomRouter);

// chat feature
const { ExpressPeerServer } = require('peer')
const peer = ExpressPeerServer(server, {
  debug: true
});
app.use('/peerjs', peer);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/call', (req, res) => {
  res.send("Enter any room id to test");
});
app.get('/call/:room', (req, res) => {
  res.render('index', { RoomId: req.params.room });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});