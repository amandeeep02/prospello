const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
    },
});

// Document map to store in-memory documents
const documents = {};

// Socket.io handlers
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join document room
    socket.on("join-document", (documentId) => {
        socket.join(documentId);
        console.log(`Client ${socket.id} joined document: ${documentId}`);

        // Create the document if it doesn't exist in memory
        if (!documents[documentId]) {
            documents[documentId] = { content: "" };
        }

        // Send current document to the newly joined user
        socket.emit("load-document", documents[documentId].content);

        // Handle text changes
        socket.on("send-changes", (delta) => {
            // Update the document in memory by applying the delta
            // instead of replacing the entire content
            documents[documentId].content = delta; // This line still stores the latest delta
            
            // Send only the delta changes to other clients
            socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        // Handle cursor position updates
        socket.on("cursor-position", (data) => {
            // Broadcast cursor position to others in the room
            socket.broadcast.to(documentId).emit("cursor-moved", {
                clientId: socket.id,
                position: data.position,
                username: data.username || "Anonymous",
            });
        });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Basic routes
app.get("/api/documents", (req, res) => {
    // Return list of documents in memory
    const documentList = Object.keys(documents).map((id) => ({
        id,
        title: `Document ${id}`,
    }));
    res.json(documentList);
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
