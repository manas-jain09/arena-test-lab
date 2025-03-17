
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/layouts/AdminLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import QuizzesList from "./pages/admin/QuizzesList";
import QuizForm from "./pages/admin/QuizForm";
import ResultsList from "./pages/admin/ResultsList";
import Settings from "./pages/admin/Settings";
import QuizView from "./pages/admin/QuizView";
import CodingQuestionsList from './pages/admin/CodingQuestionsList';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected admin routes */}
              <Route path="/admin" element={<ProtectedRoute requiresAdmin={true}><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/quizzes" element={<QuizzesList />} />
                <Route path="/admin/quizzes/new" element={<QuizForm />} />
                <Route path="/admin/quizzes/:id" element={<QuizView />} />
                <Route path="/admin/quizzes/:id/edit" element={<QuizForm editMode />} />
                <Route path="/admin/quizzes/:id/coding-questions" element={<CodingQuestionsList />} />
                <Route path="/admin/results" element={<ResultsList />} />
                <Route path="/admin/settings" element={<Settings />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
