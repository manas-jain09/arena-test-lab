
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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
  const [quizStats, setQuizStats] = useState([
    { name: 'Active', value: 0, color: '#ea384c' },
    { name: 'Upcoming', value: 0, color: '#3b82f6' },
    { name: 'Completed', value: 0, color: '#10b981' },
  ]);
  const [recentResults, setRecentResults] = useState<QuizResultItem[]>([]);
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

        // Calculate quiz status counts
        const now = new Date();
        let active = 0;
        let upcoming = 0;
        let completed = 0;

        quizzes.forEach(quiz => {
          const startDate = new Date(quiz.start_date_time);
          const endDate = new Date(quiz.end_date_time);

          if (now < startDate) {
            upcoming++;
          } else if (now > endDate) {
            completed++;
          } else {
            active++;
          }
        });

        setQuizStats([
          { name: 'Active', value: active, color: '#ea384c' },
          { name: 'Upcoming', value: upcoming, color: '#3b82f6' },
          { name: 'Completed', value: completed, color: '#10b981' },
        ]);
        
        setTotalQuizzes(quizzes.length);

        // Fetch student results
        const { data: results, error: resultsError } = await supabase
          .from('student_results')
          .select('*, quizzes(title)')
          .order('submitted_at', { ascending: false })
          .limit(10);
        
        if (resultsError) throw resultsError;

        // Group results by quiz and calculate average scores
        const quizResultsMap: Record<string, QuizResultItem> = {};
        
        if (results && results.length > 0) {
          results.forEach(result => {
            const quizTitle = result.quizzes?.title || 'Unknown Quiz';
            
            if (!quizResultsMap[quizTitle]) {
              quizResultsMap[quizTitle] = {
                name: quizTitle,
                avg: 0,
                participants: 0,
                totalScore: 0
              };
            }
            
            quizResultsMap[quizTitle].participants++;
            quizResultsMap[quizTitle].totalScore += (result.marks_scored / result.total_marks) * 100;
          });

          // Calculate averages
          const recentQuizResults = Object.values(quizResultsMap).map(item => ({
            name: item.name,
            avg: Math.round(item.totalScore / item.participants),
            participants: item.participants
          })).slice(0, 4); // Limit to 4 most recent quizzes

          setRecentResults(recentQuizResults);
        } else {
          setRecentResults([]);
        }

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

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Status</CardTitle>
            <CardDescription>Distribution of quizzes by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : quizStats.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quizStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {quizStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No quiz data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quiz Performance</CardTitle>
            <CardDescription>Average scores and participation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : recentResults.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recentResults}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg" name="Average Score (%)" fill="#ea384c" />
                    <Bar dataKey="participants" name="Participants" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
