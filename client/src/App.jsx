import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateRoom from "./pages/CreateRoom";
import { Editor } from "./pages/Editor";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<CreateRoom />} />
                <Route path="/documents/:id" element={<Editor />} />
            </Routes>
        </Router>
    );
}

export default App;
