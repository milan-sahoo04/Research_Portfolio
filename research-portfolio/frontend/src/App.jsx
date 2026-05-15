import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/admin/index.jsx";
import { AdminRoute } from "./components/AdminRoute.jsx";

function App() {
  return (
    <Routes>
      {/* User pages */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/publications" element={<Publications />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/team" element={<Team />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/contact" element={<Contact />} />

      {/* Admin pages */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
