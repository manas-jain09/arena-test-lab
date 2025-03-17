import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Eye, 
  FileText,
  Trash2,
  Clock,
  Calendar
} from 'lucide-react';
import { Quiz } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const QuizzesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching quizzes:', error);
          toast({
            title: 'Error',
            description: 'Failed to load quizzes. Please try again.',
            variant: 'destructive'
          });
          return;
        }

        const transformedQuizzes: Quiz[] = data.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          code: quiz.code,
          instructions: quiz.instructions || '',
          duration: quiz.duration,
          startDateTime: quiz.start_date_time,
          endDateTime: quiz.end_date_time,
          sections: [],
          createdAt: quiz.created_at,
          updatedAt: quiz.updated_at,
          createdBy: quiz.created_by
        }));

        setQuizzes(transformedQuizzes);
      } catch (error) {
        console.error('Error in fetchQuizzes:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong while loading quizzes.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQuizzes();
    }
  }, [user, toast]);

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date();
    const startDate = new Date(quiz.startDateTime);
    const endDate = new Date(quiz.endDateTime);

    if (now < startDate) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now > endDate) {
      return { status: 'completed', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'active', color: 'bg-red-100 text-red-800' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const copyQuizCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Success',
      description: `Quiz code ${code} copied to clipboard!`
    });
  };

  const handleDeleteQuiz = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('quizzes')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: 'Success',
          description: 'Quiz deleted successfully!'
        });

        setQuizzes(quizzes.filter(quiz => quiz.id !== id));
      } catch (error) {
        console.error('Error deleting quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete quiz. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">My Quizzes</h1>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed"
          onClick={() => navigate('/admin/quizzes/new')}
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Quiz
        </Button>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          type="search"
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <Button type="submit" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-500">Loading quizzes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz) => {
              const { status, color } = getQuizStatus(quiz);
              
              return (
                <Card key={quiz.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge className={`${color} hover:${color}`}>{status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{quiz.duration} minutes</span>
                    </div>
                    
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(quiz.startDateTime)}</span>
                    </div>
                    
                    <div className="flex items-center mb-4 justify-between">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Code:</span>
                        <span className="text-arena-red font-bold">{quiz.code}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => copyQuizCode(quiz.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/results?quizId=${quiz.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-1" /> Results
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">No quizzes found. Create your first quiz!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizzesList;
