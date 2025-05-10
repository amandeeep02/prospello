import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Quill from "quill";
import "quill/dist/quill.snow.css";

// Socket connection
const SOCKET_SERVER = "http://localhost:3001";
const SAVE_INTERVAL_MS = 2000;

// Quill options
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
];

export function Editor() {
    const { id: documentId } = useParams();
    const [socket, setSocket] = useState(null);
    const [quill, setQuill] = useState(null);
    const [users, setUsers] = useState({});
    const [shareNotification, setShareNotification] = useState("");

    // Setup the editor container
    const wrapperRef = useCallback((wrapper) => {
        if (wrapper === null) return;

        wrapper.innerHTML = "";
        const editor = document.createElement("div");
        wrapper.append(editor);

        const q = new Quill(editor, {
            theme: "snow",
            modules: {
                toolbar: TOOLBAR_OPTIONS,
            },
        });

        // Disable editor until document is loaded
        q.disable();
        q.setText("Loading...");
        setQuill(q);
    }, []);

    // Handle share button click
    const handleShare = () => {
        // Get the current URL
        const url = window.location.href;

        // Copy to clipboard
        navigator.clipboard
            .writeText(url)
            .then(() => {
                // Show success notification
                setShareNotification("Link copied to clipboard!");

                // Hide notification after 3 seconds
                setTimeout(() => {
                    setShareNotification("");
                }, 3000);
            })
            .catch((err) => {
                console.error("Failed to copy URL: ", err);
                setShareNotification("Failed to copy link");

                // Hide notification after 3 seconds
                setTimeout(() => {
                    setShareNotification("");
                }, 3000);
            });
    };

    // Setup Socket.io connection
    useEffect(() => {
        const s = io(SOCKET_SERVER);
        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, []);

    // Handle document loading and changes
    useEffect(() => {
        if (socket == null || quill == null) return;

        // When document loaded from server
        socket.once("load-document", (documentData) => {
            quill.setContents(documentData);
            quill.enable();
        });

        // Join the document room
        socket.emit("join-document", documentId);
    }, [socket, quill, documentId]);

    // Handle receiving changes
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta) => {
            quill.updateContents(delta);
        };

        socket.on("receive-changes", handler);

        return () => {
            socket.off("receive-changes", handler);
        };
    }, [socket, quill]);

    // Handle sending changes
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta, oldDelta, source) => {
            if (source !== "user") return;
            // Only send the delta change, not the entire document
            socket.emit("send-changes", delta);
        };

        quill.on("text-change", handler);

        return () => {
            quill.off("text-change", handler);
        };
    }, [socket, quill]);

    // Handle cursor tracking
    useEffect(() => {
        if (socket == null || quill == null) return;

        const trackCursor = (range, source) => {
            if (source === "user" && range) {
                socket.emit("cursor-position", { position: range });
            }
        };

        quill.on("selection-change", trackCursor);

        socket.on("cursor-moved", (data) => {
            const { clientId, position, username } = data;

            // Create or update user cursor
            updateCursor(clientId, position, username);

            // Update users list
            setUsers((prev) => ({
                ...prev,
                [clientId]: { username, active: true, lastSeen: Date.now() },
            }));
        });

        return () => {
            quill.off("selection-change", trackCursor);
            socket.off("cursor-moved");
        };
    }, [socket, quill]);

    // Helper function to update cursor positions
    const updateCursor = (clientId, range, username) => {
        // Remove existing cursor if any
        const existing = document.querySelector(`.cursor-${clientId}`);
        if (existing) existing.remove();

        if (!range) return;

        const userColor = stringToColor(username);

        // Create a cursor element
        const cursorElement = document.createElement("div");
        cursorElement.classList.add(`cursor-${clientId}`);
        cursorElement.classList.add("custom-cursor");
        cursorElement.style.position = "absolute";
        cursorElement.style.height = "20px";
        cursorElement.style.width = "2px";
        cursorElement.style.backgroundColor = userColor;

        // Create name flag
        const nameFlag = document.createElement("div");
        nameFlag.textContent = username;
        nameFlag.style.backgroundColor = userColor;
        nameFlag.style.color = "white";
        nameFlag.style.padding = "2px 4px";
        nameFlag.style.borderRadius = "3px";
        nameFlag.style.fontSize = "12px";
        nameFlag.style.position = "absolute";
        nameFlag.style.top = "-20px";
        nameFlag.style.whiteSpace = "nowrap";

        cursorElement.appendChild(nameFlag);

        // Get position and add to the editor
        const bounds = quill.getBounds(range.index);
        const editorElement = document.querySelector(".ql-editor");

        if (editorElement) {
            cursorElement.style.left = `${bounds.left}px`;
            cursorElement.style.top = `${bounds.top}px`;
            editorElement.appendChild(cursorElement);

            // Remove cursor after 5 seconds of inactivity
            setTimeout(() => {
                cursorElement.remove();
            }, 5000);
        }
    };

    // Helper function to generate color from string
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        let color = "#";
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;
            color += ("00" + value.toString(16)).substr(-2);
        }

        return color;
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="bg-white shadow-sm py-2 px-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold">
                        Document: {documentId.substring(0, 8)}...
                    </h1>
                    <button
                        onClick={handleShare}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-2 w-2 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                        </svg>
                        Share
                    </button>
                    {shareNotification && (
                        <div className="text-sm text-green-600 font-medium">
                            {shareNotification}
                        </div>
                    )}
                </div>
                <div className="flex space-x-2">
                    {Object.entries(users).map(([clientId, user]) => (
                        <div
                            key={clientId}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 flex items-center"
                            style={{
                                borderLeft: `3px solid ${stringToColor(
                                    user.username
                                )}`,
                            }}
                        >
                            {user.username}
                        </div>
                    ))}
                </div>
            </header>
            <div className="flex-grow overflow-hidden" ref={wrapperRef}></div>
        </div>
    );
}
