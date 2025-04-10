
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from "@/components/ProtectedRoute";

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

// Coding Question Pages
import CodingQuestionsList from "./pages/admin/CodingQuestionsList";
import CodingQuestionForm from "./components/CodingQuestionForm";
import CodingQuestionView from "./pages/admin/CodingQuestionView";

const queryClient = new QueryClient();

const App = () => (
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
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quizzes" 
              element={
                <ProtectedRoute>
                  <QuizzesList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quizzes/new" 
              element={
                <ProtectedRoute>
                  <QuizForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quizzes/:id" 
              element={
                <ProtectedRoute>
                  <QuizView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quizzes/:id/edit" 
              element={
                <ProtectedRoute>
                  <QuizForm editMode />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/quizzes/:quizId/coding-question/new" 
              element={
                <ProtectedRoute>
                  <CodingQuestionForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results" 
              element={
                <ProtectedRoute>
                  <ResultsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />

            {/* Coding Question Routes - kept but will be hidden from main navigation */}
            <Route 
              path="/admin/coding-questions" 
              element={
                <ProtectedRoute>
                  <CodingQuestionsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/coding-questions/new" 
              element={
                <ProtectedRoute>
                  <CodingQuestionForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/coding-questions/:id" 
              element={
                <ProtectedRoute>
                  <CodingQuestionView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/coding-questions/:id/edit" 
              element={
                <ProtectedRoute>
                  <CodingQuestionForm editMode />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
