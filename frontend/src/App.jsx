import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UploadCenter from "./pages/UploadCenter";
import FollowUps from "./pages/FollowUps";
import PatientDetails from "./pages/PatientDetails";
import PatientList from "./pages/PatientList";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:patientId" element={<PatientDetails />} />
          <Route path="/upload" element={<UploadCenter />} />
          <Route path="/followups" element={<FollowUps />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
