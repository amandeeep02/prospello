import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

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
        <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-20 px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-center mb-6">
                    Mini Google Docs
                </h1>

                <button
                    onClick={createNewDocument}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-6 flex items-center justify-center"
                >
                    <span className="mr-2">+</span> Create New Document
                </button>

                <div className="border-t border-gray-300 my-6"></div>

                <form onSubmit={joinRoom} className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Or join an existing document:
                    </label>
                    <div className="flex">
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Paste document ID"
                            className="flex-grow border rounded-l py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                        />
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-r"
                        >
                            Join
                        </button>
                    </div>
                </form>

                {loading ? (
                    <p className="text-center text-gray-600">
                        Loading documents...
                    </p>
                ) : documents.length > 0 ? (
                    <>
                        <h2 className="font-semibold text-lg mb-3">
                            Recent Documents
                        </h2>
                        <ul className="divide-y divide-gray-200">
                            {documents.map((doc) => (
                                <li key={doc.id} className="py-2">
                                    <button
                                        onClick={() =>
                                            navigate(`/documents/${doc.id}`)
                                        }
                                        className="w-full text-left hover:bg-gray-50 p-2 rounded flex justify-between items-center"
                                    >
                                        <span>{doc.title}</span>
                                        <span className="text-blue-500 text-sm">
                                            Open
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="text-center text-gray-600">
                        No documents found
                    </p>
                )}
            </div>
        </div>
    );
};

export default CreateRoom;
