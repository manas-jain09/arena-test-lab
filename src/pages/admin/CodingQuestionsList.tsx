
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Code, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CodingQuestionForm from '@/components/CodingQuestionForm';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CodingQuestionsList = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizTitle, setQuizTitle] = useState('');
  const [codingQuestions, setCodingQuestions] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchQuizDetails();
    fetchCodingQuestions();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      if (!quizId) return;

      const { data, error } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .single();

      if (error) throw error;
      
      setQuizTitle(data.title);
    } catch (error: any) {
      console.error('Error fetching quiz details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz details',
        variant: 'destructive'
      });
    }
  };

  const fetchCodingQuestions = async () => {
    try {
      setLoading(true);
      if (!quizId) return;

      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCodingQuestions(data || []);
    } catch (error: any) {
      console.error('Error fetching coding questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coding questions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('coding_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coding question deleted successfully'
      });

      fetchCodingQuestions();
    } catch (error: any) {
      console.error('Error deleting coding question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coding question',
        variant: 'destructive'
      });
    }
  };

  const handleAddQuestion = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const handleSaveQuestion = () => {
    setShowAddForm(false);
    fetchCodingQuestions();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500 hover:bg-green-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'hard':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancelAdd} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Add Coding Question</h1>
        </div>
        
        <CodingQuestionForm 
          quizId={quizId || ''} 
          onSave={handleSaveQuestion} 
          onCancel={handleCancelAdd} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/admin/quizzes/${quizId}`)} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            Coding Questions: {quizTitle}
          </h1>
        </div>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed" 
          onClick={handleAddQuestion}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Coding Question
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-500">Loading questions...</p>
        </div>
      ) : (
        <>
          {codingQuestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Code className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg text-gray-500">No coding questions found</p>
                <p className="text-gray-400 mb-6">Add your first coding question to this quiz</p>
                <Button 
                  className="bg-arena-red hover:bg-arena-darkRed" 
                  onClick={handleAddQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Coding Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {codingQuestions.map(question => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle>{question.title}</CardTitle>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Function: {question.function_name} → {question.return_type}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 line-clamp-2 text-gray-700">
                      {question.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        {question.return_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CodingQuestionsList;
