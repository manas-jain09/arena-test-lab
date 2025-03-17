import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Clock, Calendar, Edit, Copy, FileText, Eye, Download, Users, Trash, ArrowLeft, Code } from 'lucide-react';
import { Quiz, Section, Question } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const QuizView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (quizError) throw quizError;
        
        if (!quizData) {
          toast({
            title: 'Error',
            description: 'Quiz not found.',
            variant: 'destructive'
          });
          navigate('/admin/quizzes');
          return;
        }

        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select('*')
          .eq('quiz_id', id)
          .order('display_order', { ascending: true });
        
        if (sectionsError) throw sectionsError;

        const quizSections: Section[] = [];

        for (const section of sectionsData) {
          const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('section_id', section.id)
            .order('display_order', { ascending: true });
          
          if (questionsError) throw questionsError;

          const sectionQuestions: Question[] = [];

          for (const question of questionsData) {
            const { data: optionsData, error: optionsError } = await supabase
              .from('options')
              .select('*')
              .eq('question_id', question.id)
              .order('display_order', { ascending: true });
            
            if (optionsError) throw optionsError;

            sectionQuestions.push({
              id: question.id,
              text: question.text,
              imageUrl: question.image_url,
              options: optionsData.map(option => ({
                id: option.id,
                text: option.text,
                isCorrect: option.is_correct
              })),
              marksForCorrect: question.marks_for_correct,
              marksForWrong: question.marks_for_wrong,
              marksForUnattempted: question.marks_for_unattempted
            });
          }

          quizSections.push({
            id: section.id,
            title: section.title,
            instructions: section.instructions || '',
            questions: sectionQuestions
          });
        }

        const fullQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          code: quizData.code,
          instructions: quizData.instructions || '',
          duration: quizData.duration,
          startDateTime: quizData.start_date_time,
          endDateTime: quizData.end_date_time,
          sections: quizSections,
          createdAt: quizData.created_at,
          updatedAt: quizData.updated_at,
          createdBy: quizData.created_by
        };

        setQuiz(fullQuiz);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, navigate, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuizStatus = () => {
    if (!quiz) return { status: 'unknown', color: 'bg-gray-100 text-gray-800' };
    
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

  const copyQuizCode = () => {
    if (!quiz) return;
    
    navigator.clipboard.writeText(quiz.code);
    toast({
      title: 'Success',
      description: `Quiz code ${quiz.code} copied to clipboard!`
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arena-red mx-auto mb-4"></div>
          <p>Loading quiz details...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="p-6 max-w-md">
          <CardTitle className="mb-4 text-center">Quiz Not Found</CardTitle>
          <CardDescription className="text-center mb-6">
            The quiz you're looking for doesn't exist or has been deleted.
          </CardDescription>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/admin/quizzes')}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Quizzes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { status, color } = getQuizStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate('/admin/quizzes')}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/quizzes/${id}/coding-questions`)}
            >
              <Code className="h-4 w-4 mr-2" /> Coding Questions
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/quizzes/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Quiz
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate(`/admin/results?quizId=${id}`)}>
            <FileText className="mr-2 h-4 w-4" /> View Results
          </Button>
          <Button variant="outline" onClick={copyQuizCode}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Code:</span>
                  <span className="text-arena-red font-bold">{quiz.code}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={copyQuizCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Badge className={`${color} hover:${color}`}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              <span>Duration: {quiz.duration} minutes</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Start: {formatDate(quiz.startDateTime)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>End: {formatDate(quiz.endDateTime)}</span>
            </div>
          </div>

          {quiz.instructions && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Instructions</h3>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {quiz.instructions}
              </div>
            </div>
          )}

          <h3 className="text-lg font-medium mb-4">Sections</h3>
          {quiz.sections.length > 0 ? (
            <div className="space-y-6">
              {quiz.sections.map((section, sectionIndex) => (
                <Card key={section.id} className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-md">
                      Section {sectionIndex + 1}: {section.title}
                    </CardTitle>
                    {section.instructions && (
                      <CardDescription className="whitespace-pre-wrap">
                        {section.instructions}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {section.questions.length > 0 ? (
                      <div className="space-y-6">
                        {section.questions.map((question, questionIndex) => (
                          <div key={question.id} className="bg-white p-4 rounded-md shadow-sm">
                            <div className="font-medium mb-2">
                              Q{questionIndex + 1}: {question.text}
                            </div>
                            {question.imageUrl && (
                              <div className="mb-3">
                                <img 
                                  src={question.imageUrl} 
                                  alt={`Question ${questionIndex + 1}`} 
                                  className="max-h-40 object-contain"
                                />
                              </div>
                            )}
                            <div className="space-y-2 pl-4">
                              {question.options.map((option, optionIndex) => (
                                <div key={option.id} className="flex items-center">
                                  <div className={`mr-2 ${option.isCorrect ? 'text-green-600 font-medium' : ''}`}>
                                    {['A', 'B', 'C', 'D', 'E'][optionIndex]}: {option.text}
                                    {option.isCorrect && ' ✓'}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              Marks: +{question.marksForCorrect} for correct, {question.marksForWrong} for wrong, {question.marksForUnattempted} for unattempted
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No questions in this section
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No sections added to this quiz yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizView;
