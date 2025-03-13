
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  FileText,
  Trash, 
  MoreHorizontal 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Quiz } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';

const QuizzesList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

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
        
        // Fetch result counts for each quiz
        if (transformedQuizzes.length > 0) {
          const quizIds = transformedQuizzes.map(quiz => quiz.id);
          const counts: Record<string, number> = {};
          
          for (const quizId of quizIds) {
            const { count, error } = await supabase
              .from('student_results')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quizId);
            
            if (!error) {
              counts[quizId] = count || 0;
            }
          }
          
          setQuizResults(counts);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quizzes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [toast]);

  const handleDelete = async (quizId: string) => {
    // This would typically involve a confirmation dialog
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      toast({
        title: 'Success',
        description: 'Quiz deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quiz',
        variant: 'destructive',
      });
    }
  };

  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date();
    const startDate = new Date(quiz.startDateTime);
    const endDate = new Date(quiz.endDateTime);

    if (now < startDate) {
      return { label: 'Upcoming', color: 'blue' };
    } else if (now > endDate) {
      return { label: 'Completed', color: 'green' };
    } else {
      return { label: 'Active', color: 'red' };
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <Button 
            className="bg-arena-red hover:bg-arena-darkRed"
            onClick={() => navigate('/admin/quizzes/new')}
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Quiz
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder="Search by title or quiz code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" className="bg-arena-red hover:bg-arena-darkRed">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Quiz Code</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading quizzes...
                    </TableCell>
                  </TableRow>
                ) : filteredQuizzes.length > 0 ? (
                  filteredQuizzes.map(quiz => {
                    const status = getQuizStatus(quiz);
                    return (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">{quiz.title}</TableCell>
                        <TableCell>{quiz.code}</TableCell>
                        <TableCell>{formatDate(quiz.startDateTime)}</TableCell>
                        <TableCell>{formatDate(quiz.endDateTime)}</TableCell>
                        <TableCell>{quiz.duration} minutes</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              status.color === 'red' 
                                ? 'bg-red-100 text-red-800' 
                                : status.color === 'blue' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                            }
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin/quizzes/${quiz.id}/results`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {quizResults[quiz.id] || 0}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}/results`)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Results ({quizResults[quiz.id] || 0})
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(quiz.id)}>
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      No quizzes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QuizzesList;
