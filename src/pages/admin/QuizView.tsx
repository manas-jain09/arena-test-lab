
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Pencil, FileBarChart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '@/components/layouts/AdminLayout';

const QuizView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultCount, setResultCount] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch quiz data
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (quizError) throw quizError;
        
        setQuiz(quizData);
        
        // Fetch sections
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select('*, questions(*)')
          .eq('quiz_id', id)
          .order('display_order', { ascending: true });
        
        if (sectionError) throw sectionError;
        
        setSections(sectionData);
        
        // Fetch result count
        const { count, error: resultError } = await supabase
          .from('student_results')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', id);
        
        if (resultError) throw resultError;
        
        setResultCount(count || 0);
        
      } catch (error) {
        console.error('Error fetching quiz details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id, toast]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-arena-red" />
        </div>
      </AdminLayout>
    );
  }

  if (!quiz) {
    return (
      <AdminLayout>
        <div className="py-10">
          <p className="text-center text-gray-500">Quiz not found</p>
        </div>
      </AdminLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/quizzes/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Quiz
            </Button>
            <Button 
              className="bg-arena-red hover:bg-arena-darkRed"
              onClick={() => navigate(`/admin/quizzes/${id}/results`)}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              View Results ({resultCount})
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>Basic information about this quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quiz Code</h3>
                <p className="text-lg font-semibold">{quiz.code}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="text-lg font-semibold">{quiz.duration} minutes</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                <p className="text-lg font-semibold">{formatDate(quiz.start_date_time)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                <p className="text-lg font-semibold">{formatDate(quiz.end_date_time)}</p>
              </div>
            </div>
            
            {quiz.instructions && (
              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Instructions</h3>
                <p className="p-3 bg-gray-50 rounded-md">{quiz.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>This quiz contains {sections.length} section(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section, index) => (
              <div key={section.id} className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">
                  Section {index + 1}: {section.title}
                </h3>
                {section.instructions && (
                  <p className="text-sm text-gray-600 mb-4">{section.instructions}</p>
                )}
                <p className="text-sm text-gray-500">
                  {section.questions.length} question(s) in this section
                </p>
              </div>
            ))}
            
            {sections.length === 0 && (
              <p className="text-gray-500 text-center py-4">No sections found in this quiz</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QuizView;
