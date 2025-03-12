
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  FileText, 
  Download, 
  Filter,
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

const ResultsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data - in a real app, this would come from the backend
  const [quizzes] = useState<Quiz[]>([
    {
      id: '1',
      title: 'Data Structures Mid-term',
      code: 'arena-7384',
      instructions: 'Answer all questions. Each question carries equal marks.',
      duration: 60,
      startDateTime: '2023-06-15T09:00:00',
      endDateTime: '2023-06-15T18:00:00',
      sections: [],
      createdAt: '2023-06-01T10:30:00',
      updatedAt: '2023-06-02T14:20:00',
      createdBy: '1'
    },
    {
      id: '2',
      title: 'Advanced Algorithms Final',
      code: 'arena-2914',
      instructions: 'Complete all sections within the time limit.',
      duration: 120,
      startDateTime: '2023-06-20T10:00:00',
      endDateTime: '2023-06-20T17:00:00',
      sections: [],
      createdAt: '2023-06-05T08:15:00',
      updatedAt: '2023-06-05T16:45:00',
      createdBy: '1'
    },
    {
      id: '3',
      title: 'Database Systems Quiz',
      code: 'arena-4562',
      instructions: 'Focus on SQL and normalization concepts.',
      duration: 45,
      startDateTime: '2023-06-10T14:00:00',
      endDateTime: '2023-06-10T17:00:00',
      sections: [],
      createdAt: '2023-06-03T09:20:00',
      updatedAt: '2023-06-03T11:30:00',
      createdBy: '1'
    }
  ]);

  const [results] = useState<StudentResult[]>([
    {
      id: '1',
      quizId: '1',
      name: 'John Doe',
      prn: 'PRN12345',
      division: 'A',
      email: 'john.doe@example.com',
      cheatingStatus: 'no-issues',
      marksScored: 85,
      totalMarks: 100,
      submittedAt: '2023-06-15T10:30:00'
    },
    {
      id: '2',
      quizId: '1',
      name: 'Jane Smith',
      prn: 'PRN23456',
      division: 'B',
      email: 'jane.smith@example.com',
      cheatingStatus: 'flagged',
      marksScored: 72,
      totalMarks: 100,
      submittedAt: '2023-06-15T11:15:00'
    },
    {
      id: '3',
      quizId: '2',
      name: 'Alice Johnson',
      prn: 'PRN34567',
      division: 'A',
      email: 'alice.johnson@example.com',
      cheatingStatus: 'no-issues',
      marksScored: 90,
      totalMarks: 100,
      submittedAt: '2023-06-20T11:30:00'
    },
    {
      id: '4',
      quizId: '3',
      name: 'Bob Williams',
      prn: 'PRN45678',
      division: 'C',
      email: 'bob.williams@example.com',
      cheatingStatus: 'flagged',
      marksScored: 65,
      totalMarks: 100,
      submittedAt: '2023-06-10T15:45:00'
    },
    {
      id: '5',
      quizId: '1',
      name: 'Charlie Brown',
      prn: 'PRN56789',
      division: 'B',
      email: 'charlie.brown@example.com',
      cheatingStatus: 'no-issues',
      marksScored: 78,
      totalMarks: 100,
      submittedAt: '2023-06-15T10:45:00'
    }
  ]);

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

  if (selectedQuiz) {
    filteredResults = filteredResults.filter(result => result.quizId === selectedQuiz);
  }

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

  const handleExportPdf = () => {
    // In a real app, this would generate and download a PDF
    alert('PDF export functionality would be implemented in a real app');
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
        >
          <Download className="h-4 w-4 mr-2" /> Export to PDF
        </Button>
      </div>

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
    </div>
  );
};

export default ResultsList;
