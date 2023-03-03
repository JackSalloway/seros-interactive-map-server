const app = require("./app");
const { Server } = require("socket.io");
const { createServer } = require("http");

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connect", (socket) => {
    console.log("We are live and epicly connected.");
    console.log(socket.id);

    socket.on("ping", () => {
        socket.emit("pong", { data: "PONG" });
    });
});

httpServer.listen(process.env.PORT || 5000, () => {
    if (process.env.PORT !== undefined) {
        console.log(`Server started on ${process.env.PORT}`);
    } else {
        console.log("Server started on port 5000.");
    }
});
