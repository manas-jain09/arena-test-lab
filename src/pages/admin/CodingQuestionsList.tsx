
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ChevronLeft, Plus, Code, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CodingQuestionForm from '@/components/CodingQuestionForm';

const CodingQuestionsList = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quizId]);
  
  const fetchQuizAndQuestions = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz details
      if (!quizId) return;
      
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .single();
      
      if (quizError) throw quizError;
      
      setQuizTitle(quiz.title);
      
      // Fetch coding questions
      const { data, error } = await supabase
        .from('coding_questions')
        .select(`
          id, 
          title, 
          description, 
          difficulty, 
          function_name,
          return_type,
          created_at
        `)
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Error fetching quiz and questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz data: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('coding_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Coding question deleted successfully'
      });
      
      // Refresh the list
      await fetchQuizAndQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link 
            to={`/admin/quizzes/${quizId}`} 
            className="text-arena-red hover:text-arena-darkRed inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Quiz
          </Link>
          <h1 className="text-2xl font-bold mt-2">Coding Questions</h1>
          <p className="text-muted-foreground">
            {quizTitle ? `Quiz: ${quizTitle}` : 'Loading quiz...'}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)} 
          className="bg-arena-red hover:bg-arena-darkRed"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Coding Question
        </Button>
      </div>
      
      <Separator />
      
      {showForm ? (
        <CodingQuestionForm 
          quizId={quizId || ''} 
          onSave={() => {
            setShowForm(false);
            fetchQuizAndQuestions();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : loading ? (
        <div className="text-center py-8">Loading questions...</div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Code className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No coding questions yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Add coding questions to test programming skills
              </p>
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-arena-red hover:bg-arena-darkRed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Coding Question
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map(question => (
            <Card key={question.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg pr-4">{question.title}</CardTitle>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Coding Question</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this coding question? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </Badge>
                
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium">Function:</span> {question.function_name}</p>
                  <p><span className="font-medium">Return Type:</span> {question.return_type}</p>
                  <p className="line-clamp-2">{question.description}</p>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-arena-red border-arena-red hover:bg-arena-red/10"
                    onClick={() => {
                      toast({
                        title: 'Not implemented',
                        description: 'Viewing and editing is not yet implemented',
                      });
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodingQuestionsList;
