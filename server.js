const express = require("express");
const app = express();
const server = require("http").Server(app);
const PORT = process.env.PORT || 3001;
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const io = require("socket.io")(server);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room, port: PORT });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
  });

  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id); // Changed event name to "user-disconnected"
  });
});

server.listen(PORT, () => {
  console.log(`Server is started on port ${PORT}`);
});
