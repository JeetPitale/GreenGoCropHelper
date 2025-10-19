import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Render the React application into the DOM element with id="root"
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(<App />);
