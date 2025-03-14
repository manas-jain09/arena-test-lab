
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock, UserSquare, FileText, Layers, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define the QuizResultItem type
interface QuizResultItem {
  name: string;
  avg: number;
  participants: number;
  totalScore: number; // Added missing property
}

const Dashboard = () => {
  const [quizData, setQuizData] = useState<QuizResultItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch quiz data from Supabase
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch student results data from Supabase
  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: ['all_student_results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_results')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (quizzes && results) {
      // Process data to get quiz performance statistics
      const quizPerformanceData = quizzes.map(quiz => {
        const quizResults = results.filter(result => result.quiz_id === quiz.id);
        const participants = quizResults.length;
        const totalScore = quizResults.reduce((sum, result) => sum + result.marks_scored, 0);
        const avgScore = participants > 0 ? totalScore / participants : 0;
        
        return {
          name: quiz.title,
          avg: parseFloat(avgScore.toFixed(2)),
          participants,
          totalScore
        };
      });
      
      setQuizData(quizPerformanceData);
    }
  }, [quizzes, results]);

  const getTotalStudents = () => {
    if (!results) return 0;
    // Count unique students by email
    const uniqueEmails = new Set(results.map(result => result.email));
    return uniqueEmails.size;
  };

  const getAverageScore = () => {
    if (!results || results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.marks_scored, 0);
    const totalPossibleScore = results.reduce((sum, result) => sum + result.total_marks, 0);
    return totalPossibleScore > 0 
      ? parseFloat(((totalScore / totalPossibleScore) * 100).toFixed(2)) 
      : 0;
  };

  const getStudentsWithFullMarks = () => {
    if (!results) return 0;
    return results.filter(result => result.marks_scored === result.total_marks).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          className="bg-arena-red hover:bg-arena-darkRed text-white"
          onClick={() => window.location.href = '/admin/quizzes/new'}
        >
          Create New Quiz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <Layers className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes?.length || 0}</div>
            <p className="text-xs text-gray-500">+{quizzes?.length || 0} from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalStudents()}</div>
            <p className="text-xs text-gray-500">Across all quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageScore()}%</div>
            <p className="text-xs text-gray-500">Across all quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Full Marks</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStudentsWithFullMarks()}</div>
            <p className="text-xs text-gray-500">Students with 100% score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Quiz Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzes || isLoadingResults ? (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-gray-500">Loading data...</p>
                </div>
              ) : quizData.length > 0 ? (
                <Chart 
                  type="bar" 
                  data={{
                    labels: quizData.slice(0, 5).map(item => item.name),
                    datasets: [
                      {
                        label: 'Average Score (%)',
                        data: quizData.slice(0, 5).map(item => item.avg),
                        backgroundColor: '#f43f5e',
                      },
                      {
                        label: 'Participants',
                        data: quizData.slice(0, 5).map(item => item.participants),
                        backgroundColor: '#3b82f6',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Quiz Performance Summary'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-gray-500">No quiz data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Quizzes Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzes || isLoadingResults ? (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-gray-500">Loading data...</p>
                </div>
              ) : quizData.length > 0 ? (
                <Chart 
                  type="bar" 
                  data={{
                    labels: quizData.map(item => item.name),
                    datasets: [
                      {
                        label: 'Average Score (%)',
                        data: quizData.map(item => item.avg),
                        backgroundColor: '#f43f5e',
                      },
                      {
                        label: 'Participants',
                        data: quizData.map(item => item.participants),
                        backgroundColor: '#3b82f6',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Quiz Performance Summary'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p className="text-gray-500">No quiz data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
