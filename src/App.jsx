import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";

import DashboardPage from "./pages/DashboardPage";
import DocumentEditorPage from "./pages/DocumentEditorPage";
import LoginPage from "./pages/LoginPage";
import PresentationEditorPage from "./pages/PresentationEditorPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectsPage from "./pages/ProjectsPage";
import RecentPage from "./pages/RecentPage";
import RegisterPage from "./pages/RegisterPage";
import SharedFolderPage from "./pages/SharedFolderPage";
import SharedWithMePage from "./pages/SharedWithMePage";
import SpreadsheetEditorPage from "./pages/SpreadsheetEditorPage";
import StarredPage from "./pages/StarredPage";
import StoragePage from "./pages/StoragePage";
import TrashPage from "./pages/TrashPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/projects/:projectId"
          element={<ProjectDetailsPage />}
        />

        <Route
          path="/documents/:documentId"
          element={<DocumentEditorPage />}
        />
        <Route
          path="/spreadsheets/:spreadsheetId"
          element={<SpreadsheetEditorPage />}
        />
        <Route
          path="/presentations/:presentationId"
          element={<PresentationEditorPage />}
        />

        <Route path="/shared" element={<SharedWithMePage />} />
        <Route
          path="/shared/folder/:folderId"
          element={<SharedFolderPage />}
        />

        <Route path="/recent" element={<RecentPage />} />
        <Route path="/starred" element={<StarredPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/storage" element={<StoragePage />} />
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;