import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import Login from "./components/Login";
import "./App.css";
import Register from "./components/Register";
import Home from "./components/Home";
import Msg from "./components/Msg";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/Home" element={<Home />} />
          <Route path="/" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/Msg/:uid/:username" element={<Msg />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
