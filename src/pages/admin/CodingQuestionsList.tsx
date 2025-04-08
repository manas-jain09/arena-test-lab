
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customClient } from '@/integrations/supabase/customClient';
import { CodingQuestion, FunctionParameter, TestCase } from '@/types';
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
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Eye, Plus, Search, Code, ArrowUpDown } from 'lucide-react';

const CodingQuestionsList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [parameters, setParameters] = useState<Record<string, FunctionParameter[]>>({});
  const [testCases, setTestCases] = useState<Record<string, TestCase[]>>({});

  useEffect(() => {
    const fetchCodingQuestions = async () => {
      try {
        setLoading(true);
        
        // Fetch all coding questions
        const { data: questionsData, error: questionsError } = await customClient
          .from('coding_questions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (questionsError) {
          throw questionsError;
        }

        // Prepare question objects
        const parsedQuestions: CodingQuestion[] = questionsData.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          example: q.example,
          constraints: q.constraints,
          functionName: q.function_name,
          returnType: q.return_type,
          difficulty: q.difficulty,
          quizId: q.quiz_id,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
          createdBy: q.created_by,
          parameters: [],
          testCases: []
        }));

        // If we have questions, fetch their parameters and test cases
        if (parsedQuestions.length > 0) {
          const questionIds = parsedQuestions.map(q => q.id);
          
          // Fetch all parameters for all questions
          const { data: parametersData, error: parametersError } = await customClient
            .from('function_parameters')
            .select('*')
            .in('coding_question_id', questionIds)
            .order('display_order', { ascending: true });
          
          if (parametersError) {
            throw parametersError;
          }
          
          // Fetch all test cases for all questions
          const { data: testCasesData, error: testCasesError } = await customClient
            .from('test_cases')
            .select('*')
            .in('coding_question_id', questionIds)
            .order('display_order', { ascending: true });
          
          if (testCasesError) {
            throw testCasesError;
          }
          
          // Group parameters by question
          const paramsByQuestion: Record<string, FunctionParameter[]> = {};
          parametersData.forEach(param => {
            const questionId = param.coding_question_id;
            if (!paramsByQuestion[questionId]) {
              paramsByQuestion[questionId] = [];
            }
            paramsByQuestion[questionId].push({
              id: param.id,
              parameterName: param.parameter_name,
              parameterType: param.parameter_type,
              displayOrder: param.display_order
            });
          });
          
          // Group test cases by question
          const testCasesByQuestion: Record<string, TestCase[]> = {};
          testCasesData.forEach(testCase => {
            const questionId = testCase.coding_question_id;
            if (!testCasesByQuestion[questionId]) {
              testCasesByQuestion[questionId] = [];
            }
            testCasesByQuestion[questionId].push({
              id: testCase.id,
              input: testCase.input,
              output: testCase.output,
              isHidden: testCase.is_hidden,
              points: testCase.points,
              displayOrder: testCase.display_order
            });
          });
          
          // Update the state
          setParameters(paramsByQuestion);
          setTestCases(testCasesByQuestion);
          
          // Assign parameters and test cases to questions
          parsedQuestions.forEach(question => {
            question.parameters = paramsByQuestion[question.id] || [];
            question.testCases = testCasesByQuestion[question.id] || [];
          });
        }
        
        setQuestions(parsedQuestions);
      } catch (error) {
        console.error('Error fetching coding questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCodingQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coding question? This action cannot be undone.')) {
      return;
    }
    
    try {
      // First delete all related records
      await customClient.from('test_cases').delete().eq('coding_question_id', id);
      await customClient.from('function_parameters').delete().eq('coding_question_id', id);
      await customClient.from('driver_code').delete().eq('coding_question_id', id);
      
      // Then delete the question itself
      const { error } = await customClient.from('coding_questions').delete().eq('id', id);
      
      if (error) throw error;
      
      // Update the UI to remove the deleted question
      setQuestions(questions.filter(question => question.id !== id));
      
      // Optional: Add a toast notification here
    } catch (error) {
      console.error('Error deleting coding question:', error);
      // Optional: Add a toast notification here
    }
  };

  const filteredQuestions = questions.filter(question => {
    const searchLower = searchTerm.toLowerCase();
    return (
      question.title.toLowerCase().includes(searchLower) ||
      question.description.toLowerCase().includes(searchLower) ||
      question.functionName.toLowerCase().includes(searchLower) ||
      question.difficulty.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coding Questions</h1>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed"
          onClick={() => navigate('/admin/coding-questions/create')}
        >
          <Plus className="h-4 w-4 mr-2" /> Add New
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Coding Questions</CardTitle>
          <CardDescription>
            View, create, edit, and delete coding questions for your quizzes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search questions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 text-center">
              <p className="text-gray-500">Loading coding questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-20 text-center">
              <Code className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'No matching coding questions found' : 'No coding questions yet'}
              </p>
              {searchTerm ? (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/coding-questions/create')}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create your first coding question
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button variant="ghost" className="p-0 font-semibold flex items-center">
                        Title <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Function</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="p-0 font-semibold flex items-center">
                        Difficulty <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Test Cases</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/coding-questions/${question.id}`)}>
                      <TableCell className="font-medium">{question.title}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {question.functionName}({question.parameters.map(p => p.parameterType).join(', ')})
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          question.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800'
                            : question.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {question.testCases.length}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/coding-questions/${question.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CodingQuestionsList;
