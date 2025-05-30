import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import "../styles/CreateRoom.css";

const CreateRoom = () => {
    const [roomId, setRoomId] = useState("");
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch existing documents
        const fetchDocuments = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:3001/api/documents"
                );
                setDocuments(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching documents:", error);
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const createNewDocument = () => {
        const id = uuidv4();
        navigate(`/documents/${id}`);
    };

    const joinRoom = (e) => {
        e.preventDefault();
        if (roomId.trim() !== "") {
            navigate(`/documents/${roomId}`);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h1 className="title">Mini Google Docs</h1>

                <button onClick={createNewDocument} className="create-button">
                    <span className="plus-icon">+</span> Create New Document
                </button>

                <div className="divider"></div>

                <form onSubmit={joinRoom} className="form">
                    <label className="label">
                        Or join an existing document:
                    </label>
                    <div className="input-group">
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Paste document ID"
                            className="input"
                        />
                        <button type="submit" className="join-button">
                            Join
                        </button>
                    </div>
                </form>

                {loading ? (
                    <p className="message">Loading documents...</p>
                ) : documents.length > 0 ? (
                    <>
                        <h2 className="subtitle">Recent Documents</h2>
                        <ul className="document-list">
                            {documents.map((doc) => (
                                <li key={doc.id} className="document-item">
                                    <button
                                        onClick={() =>
                                            navigate(`/documents/${doc.id}`)
                                        }
                                        className="document-button"
                                    >
                                        <span>{doc.title}</span>
                                        <span className="open-text">Open</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="message">No documents found</p>
                )}
            </div>
        </div>
    );
};

export default CreateRoom;
