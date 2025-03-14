
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Add interfaces for our data types
interface QuizResultItem {
  name: string;
  avg: number;
  participants: number;
  totalScore: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Fetch quizzes
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('created_by', user.id);

        if (quizzesError) throw quizzesError;
        
        setTotalQuizzes(quizzes.length);

        // Count unique students
        const { count: studentsCount, error: studentsError } = await supabase
          .from('student_results')
          .select('email', { count: 'exact', head: true })
          .order('email');

        if (studentsError) throw studentsError;
        
        setTotalStudents(studentsCount || 0);
        
        // Count total submissions
        const { count, error: submissionsError } = await supabase
          .from('student_results')
          .select('*', { count: 'exact', head: true });
        
        if (submissionsError) throw submissionsError;
        
        setTotalSubmissions(count || 0);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed"
          onClick={() => navigate('/admin/quizzes/new')}
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Quiz
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Quizzes</p>
                {isLoading ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">{totalQuizzes}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-arena-red" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                {isLoading ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">{totalStudents}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Submissions</p>
                {isLoading ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">{totalSubmissions}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
