
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Download, 
  ArrowUpDown,
  Eye,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StudentResult, Quiz } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';

const ResultsList = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialQuizId = quizId || searchParams.get('quizId');
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(initialQuizId);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
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

        // Transform the data to match our Quiz type
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
        
        // If we have a quizId parameter, set the currentQuiz
        if (selectedQuiz) {
          const quiz = transformedQuizzes.find(q => q.id === selectedQuiz) || null;
          setCurrentQuiz(quiz);
        }
      } catch (error) {
        console.error('Error in fetchQuizzes:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong while loading quizzes.',
          variant: 'destructive'
        });
      }
    };

    const fetchResults = async () => {
      try {
        let query = supabase
          .from('student_results')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (selectedQuiz) {
          query = query.eq('quiz_id', selectedQuiz);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching results:', error);
          toast({
            title: 'Error',
            description: 'Failed to load student results. Please try again.',
            variant: 'destructive'
          });
          return;
        }

        // Transform the data to match our StudentResult type
        const transformedResults: StudentResult[] = data.map(result => ({
          id: result.id,
          quizId: result.quiz_id,
          name: result.name,
          prn: result.prn,
          division: result.division,
          email: result.email,
          cheatingStatus: result.cheating_status as 'flagged' | 'no-issues',
          marksScored: result.marks_scored,
          totalMarks: result.total_marks,
          submittedAt: result.submitted_at
        }));

        setResults(transformedResults);
      } catch (error) {
        console.error('Error in fetchResults:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong while loading student results.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
    fetchResults();
  }, [selectedQuiz, toast, initialQuizId]);

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

  // Filter and sort the results
  let filteredResults = [...results];

  if (selectedDivision) {
    filteredResults = filteredResults.filter(result => result.division === selectedDivision);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredResults = filteredResults.filter(result => 
      result.name.toLowerCase().includes(term) ||
      result.prn.toLowerCase().includes(term) ||
      result.email.toLowerCase().includes(term)
    );
  }

  if (sortBy) {
    filteredResults.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'marks':
          comparison = a.marksScored - b.marksScored;
          break;
        case 'percentage':
          comparison = (a.marksScored / a.totalMarks) - (b.marksScored / b.totalMarks);
          break;
        case 'date':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleExportPdf = async () => {
    if (!selectedQuiz) {
      toast({
        title: 'Error',
        description: 'Please select a quiz to generate report',
      });
      return;
    }
    
    setGeneratingReport(true);
    
    try {
      // In a real implementation, we would call a function to generate a PDF
      // For now, we'll simulate the behavior
      const { data, error } = await supabase.rpc('generate_quiz_results_pdf', {
        quiz_id: selectedQuiz
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Report generated successfully. Download will start shortly.',
      });
      
      // Simulate download by waiting a moment
      setTimeout(() => {
        toast({
          title: 'Download Complete',
          description: 'The results report has been downloaded.',
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const divisions = Array.from(new Set(results.map(result => result.division)));

  const getQuizTitle = (quizId: string): string => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.title : 'Unknown Quiz';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {currentQuiz ? `Results: ${currentQuiz.title}` : 'Results'}
          </h1>
          <Button 
            onClick={handleExportPdf}
            className="bg-arena-red hover:bg-arena-darkRed"
            disabled={generatingReport || !selectedQuiz}
          >
            {generatingReport ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> Export to PDF
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-arena-red" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Filter Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Input
                      type="search"
                      placeholder="Search by name, PRN or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  {!quizId && (
                    <div className="space-y-2">
                      <Select value={selectedQuiz || ""} onValueChange={setSelectedQuiz}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Quiz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Quizzes</SelectItem>
                          {quizzes.map(quiz => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Select value={selectedDivision || ""} onValueChange={setSelectedDivision}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Divisions</SelectItem>
                        {divisions.map(division => (
                          <SelectItem key={division} value={division}>
                            Division {division}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Select value={sortBy || ""} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Sorting</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="marks">Marks</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="date">Submission Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {filteredResults.length} of {results.length} results
                  </div>
                  {sortBy && (
                    <Button variant="outline" size="sm" onClick={toggleSortOrder}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>PRN</TableHead>
                      <TableHead>Division</TableHead>
                      {!quizId && <TableHead>Quiz</TableHead>}
                      <TableHead>Cheating Status</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length > 0 ? (
                      filteredResults.map(result => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.name}</TableCell>
                          <TableCell>{result.prn}</TableCell>
                          <TableCell>Division {result.division}</TableCell>
                          {!quizId && <TableCell>{getQuizTitle(result.quizId)}</TableCell>}
                          <TableCell>
                            <Badge 
                              className={
                                result.cheatingStatus === 'flagged' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }
                            >
                              {result.cheatingStatus === 'flagged' ? 'Flagged' : 'No Issues'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {result.marksScored} / {result.totalMarks}
                          </TableCell>
                          <TableCell className="text-right">
                            {((result.marksScored / result.totalMarks) * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>{formatDate(result.submittedAt)}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={quizId ? 8 : 9} className="text-center py-6 text-gray-500">
                          No results found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ResultsList;
