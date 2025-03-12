
import React, { useState } from 'react';
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

const QuizzesList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app, this would come from the backend
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
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyQuizCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // In a real app, we would show a toast here
    alert(`Quiz code ${code} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Quizzes</h1>
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
    </div>
  );
};

export default QuizzesList;
