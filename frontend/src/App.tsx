import { Navigate, Route, Routes } from "react-router-dom";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Items from "./pages/Items";
import "./App.css";

function App() {
  return (
    <Layout>
      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <Routes>
          <Route path="/" element={<Navigate to="/items" replace />} />
          <Route path="/items" element={<Items />} />
          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </AuthenticatedTemplate>
    </Layout>
  );
}

export default App;
