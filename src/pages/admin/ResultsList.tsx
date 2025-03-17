import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  FileText, 
  Download, 
  ArrowUpDown
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
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const ResultsList = () => {
  const [searchParams] = useSearchParams();
  const initialQuizId = searchParams.get('quizId');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(initialQuizId);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isGeneratingCsv, setIsGeneratingCsv] = useState(false);

  // Fetch quizzes created by the current user
  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Transform data to match our Quiz type
      return data.map(quiz => ({
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
    },
    enabled: !!user
  });

  // Fetch results for quizzes created by the current user
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['student_results', selectedQuiz, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get all quizzes created by the user
      const { data: userQuizzes, error: userQuizzesError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('created_by', user.id);
      
      if (userQuizzesError) throw userQuizzesError;
      
      if (userQuizzes.length === 0) return [];
      
      // Get the quiz IDs the user has created
      const userQuizIds = userQuizzes.map(quiz => quiz.id);
      
      // Build the query for results
      let query = supabase
        .from('student_results')
        .select('*')
        .in('quiz_id', userQuizIds)
        .order('submitted_at', { ascending: false });

      // Apply specific quiz filter if selected
      if (selectedQuiz && selectedQuiz !== 'all') {
        query = query.eq('quiz_id', selectedQuiz);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform data to match our StudentResult type
      return data.map(result => ({
        id: result.id,
        quizId: result.quiz_id,
        name: result.name,
        prn: result.prn,
        division: result.division,
        email: result.email,
        cheatingStatus: result.cheating_status,
        marksScored: result.marks_scored,
        totalMarks: result.total_marks,
        submittedAt: result.submitted_at
      }));
    },
    enabled: !!user
  });

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

  // Generate and download CSV report
  const handleExportCsv = async () => {
    if (!selectedQuiz || selectedQuiz === 'all') {
      toast({
        title: 'Error',
        description: 'Please select a specific quiz before exporting results.',
        variant: 'destructive'
      });
      return;
    }

    // Verify the quiz belongs to the current user
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to export results.',
        variant: 'destructive'
      });
      return;
    }

    const quizBelongsToUser = quizzes.some(quiz => quiz.id === selectedQuiz);
    if (!quizBelongsToUser) {
      toast({
        title: 'Error',
        description: 'You can only export results for quizzes you have created.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsGeneratingCsv(true);
      toast({
        title: 'Generating Report',
        description: 'Please wait while we generate your CSV report...',
      });

      // Prepare filters to send to the edge function, including current UI filters
      const filters = {
        division: selectedDivision === 'all' ? null : selectedDivision,
        searchTerm: searchTerm || null,
        sortBy: sortBy || null,
        sortOrder,
        userId: user.id // Pass the user ID to verify ownership in the edge function
      };

      console.log('Sending export request with filters:', filters);

      // Call the Supabase function to generate CSV
      const { data, error } = await supabase.functions.invoke('generate-quiz-pdf', {
        body: { 
          quizId: selectedQuiz,
          filters 
        }
      });

      if (error) {
        console.error('Error generating CSV:', error);
        throw error;
      }

      if (data && data.csvUrl) {
        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = data.csvUrl;
        link.setAttribute('download', `quiz-results-${selectedQuiz}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Report Generated',
          description: 'Your CSV report has been generated and downloaded.',
        });
      } else {
        throw new Error('No report URL returned from the server');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingCsv(false);
    }
  };

  // Filter and sort the results
  let filteredResults = [...results];

  if (selectedDivision && selectedDivision !== 'all') {
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

  const divisions = Array.from(new Set(results.map(result => result.division))).filter(Boolean);

  const getQuizTitle = (quizId: string): string => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.title : 'Unknown Quiz';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Results</h1>
        <Button 
          onClick={handleExportCsv}
          className="bg-arena-red hover:bg-arena-darkRed"
          disabled={isGeneratingCsv || !selectedQuiz || selectedQuiz === 'all'}
        >
          <Download className="h-4 w-4 mr-2" /> 
          {isGeneratingCsv ? 'Generating...' : 'Export to CSV'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-500">Loading results...</p>
        </div>
      ) : (
        <>
          {quizzes.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-gray-500">You haven't created any quizzes yet.</p>
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
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Search by name, PRN or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Select 
                        value={selectedQuiz || ""} 
                        onValueChange={setSelectedQuiz}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Quiz" />
                        </SelectTrigger>
                        <SelectContent>
                          {quizzes.length > 0 && (
                            <SelectItem value="all">All My Quizzes</SelectItem>
                          )}
                          {quizzes.map(quiz => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select 
                        value={selectedDivision || ""} 
                        onValueChange={setSelectedDivision}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.length > 0 && (
                            <SelectItem value="all">All Divisions</SelectItem>
                          )}
                          {divisions.map(division => (
                            <SelectItem key={division} value={division}>
                              Division {division}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select 
                        value={sortBy || ""} 
                        onValueChange={setSortBy}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
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
                        <TableHead>Quiz</TableHead>
                        <TableHead>Cheating Status</TableHead>
                        <TableHead className="text-right">Marks</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                        <TableHead>Submitted At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.length > 0 ? (
                        filteredResults.map(result => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>{result.prn}</TableCell>
                            <TableCell>Division {result.division}</TableCell>
                            <TableCell>{getQuizTitle(result.quizId)}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  result.cheatingStatus === 'flagged' || result.cheatingStatus === 'caught-cheating'
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }
                              >
                                {result.cheatingStatus === 'flagged' || result.cheatingStatus === 'caught-cheating' 
                                  ? 'Flagged' 
                                  : 'No Issues'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {result.marksScored} / {result.totalMarks}
                            </TableCell>
                            <TableCell className="text-right">
                              {((result.marksScored / result.totalMarks) * 100).toFixed(2)}%
                            </TableCell>
                            <TableCell>{formatDate(result.submittedAt)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-gray-500">
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
        </>
      )}
    </div>
  );
};

export default ResultsList;
