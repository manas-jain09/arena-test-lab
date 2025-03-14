
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  FileText, 
  Download, 
  ArrowUpDown,
  Eye
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

const ResultsList = () => {
  const [searchParams] = useSearchParams();
  const initialQuizId = searchParams.get('quizId');
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(initialQuizId);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch quizzes
  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
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
    }
  });

  // Fetch results
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['student_results', selectedQuiz],
    queryFn: async () => {
      let query = supabase
        .from('student_results')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (selectedQuiz) {
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
        cheatingStatus: result.cheating_status as 'flagged' | 'no-issues',
        marksScored: result.marks_scored,
        totalMarks: result.total_marks,
        submittedAt: result.submitted_at
      }));
    }
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

  // Generate PDF report
  const handleExportPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      toast({
        title: 'Generating PDF',
        description: 'Please wait while we generate your report...',
      });

      // Call the Supabase function to generate PDF
      const { data, error } = await supabase.rpc('generate_quiz_results_pdf', {
        quiz_id: selectedQuiz
      });

      if (error) {
        throw error;
      }

      // Simulate PDF download (in real implementation, this would be a real PDF)
      setTimeout(() => {
        toast({
          title: 'PDF Generated',
          description: 'Your report has been generated successfully.',
        });
        
        // In a real implementation, we would redirect to the download URL
        // For now, we'll just show a success message
        setIsGeneratingPdf(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report. Please try again.',
        variant: 'destructive'
      });
      setIsGeneratingPdf(false);
    }
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

  const divisions = Array.from(new Set(results.map(result => result.division)));

  const getQuizTitle = (quizId: string): string => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.title : 'Unknown Quiz';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Results</h1>
        <Button 
          onClick={handleExportPdf}
          className="bg-arena-red hover:bg-arena-darkRed"
          disabled={isGeneratingPdf || !selectedQuiz}
        >
          <Download className="h-4 w-4 mr-2" /> 
          {isGeneratingPdf ? 'Generating...' : 'Export to PDF'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-500">Loading results...</p>
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
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
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
                    <TableHead>Quiz</TableHead>
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
                        <TableCell>{getQuizTitle(result.quizId)}</TableCell>
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
                      <TableCell colSpan={9} className="text-center py-6 text-gray-500">
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
  );
};

export default ResultsList;
