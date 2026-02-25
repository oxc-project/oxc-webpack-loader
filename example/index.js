import { createRoot } from "react-dom/client";

function App() {
  return <h1>JSX is working!</h1>;
}

createRoot(document.getElementById("root")).render(<App />);
