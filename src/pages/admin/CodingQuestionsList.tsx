
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CodingQuestion, DifficultyLevel } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Terminal } from 'lucide-react';

const CodingQuestionsList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('coding_questions')
        .select(`
          id,
          title,
          description,
          example,
          constraints,
          function_name,
          return_type,
          difficulty,
          quiz_id,
          created_at,
          updated_at,
          created_by
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Now fetch parameters and test cases for each question
      const questionsWithDetails = await Promise.all(data.map(async (question) => {
        const { data: parametersData, error: parametersError } = await supabase
          .from('function_parameters')
          .select('*')
          .eq('coding_question_id', question.id)
          .order('display_order', { ascending: true });
        
        if (parametersError) throw parametersError;
        
        const { data: testCasesData, error: testCasesError } = await supabase
          .from('test_cases')
          .select('*')
          .eq('coding_question_id', question.id)
          .order('display_order', { ascending: true });
        
        if (testCasesError) throw testCasesError;
        
        return {
          id: question.id,
          title: question.title,
          description: question.description,
          example: question.example,
          constraints: question.constraints,
          functionName: question.function_name,
          returnType: question.return_type,
          difficulty: question.difficulty as DifficultyLevel,
          quizId: question.quiz_id,
          createdAt: question.created_at,
          updatedAt: question.updated_at,
          createdBy: question.created_by,
          parameters: parametersData.map(param => ({
            id: param.id,
            parameterName: param.parameter_name,
            parameterType: param.parameter_type,
            displayOrder: param.display_order
          })),
          testCases: testCasesData.map(testCase => ({
            id: testCase.id,
            input: testCase.input,
            output: testCase.output,
            isHidden: testCase.is_hidden,
            points: testCase.points,
            displayOrder: testCase.display_order
          }))
        };
      }));
      
      setQuestions(questionsWithDetails);
    } catch (error) {
      console.error('Error fetching coding questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coding questions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('coding_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      
      setQuestions(questions.filter(q => q.id !== questionId));
      
      toast({
        title: 'Success',
        description: 'Coding question deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting coding question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coding question. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredQuestions = searchQuery
    ? questions.filter(question => 
        question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.functionName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : questions;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Coding Questions</h1>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed"
          onClick={() => navigate('/admin/coding-questions/new')}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Question
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search questions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Test Cases</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {searchQuery
                        ? 'No questions match your search criteria'
                        : 'No coding questions found. Create your first question!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {question.title}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {question.functionName}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800' 
                            : question.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{question.parameters.length}</TableCell>
                      <TableCell>{question.testCases.length}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/coding-questions/${question.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/coding-questions/${question.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(question.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodingQuestionsList;
