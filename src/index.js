const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "../public");

app.use(express.static(publicDirectory));

io.on("connection", (socket) => {
  console.log("New connection");

  // socket.emit("message", generateMessage("Welcome !"));
  // socket.broadcast.emit("message", generateMessage("A new user has joined"));

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    //io.to.emit,socket.broadcast.to.emit
    socket.emit("message", generateMessage("Welcome !"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    const filter = new Filter();

    const user = getUser(socket.id);

    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }

    io.to(user.room).emit("message", generateMessage(user.username, msg));

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (loc, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${loc.latitude},${loc.longitude}`
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log("listening on port " + port);
});
