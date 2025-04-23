
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customClient } from '@/integrations/supabase/customClient';
import { CodingQuestion, FunctionParameter, TestCase, DriverCode } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Code, Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const CodingQuestionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [parameters, setParameters] = useState<FunctionParameter[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [driverCode, setDriverCode] = useState<DriverCode | null>(null);
  const [activeTab, setActiveTab] = useState('cpp');

  useEffect(() => {
    const fetchQuestionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch the coding question
        const { data: questionData, error: questionError } = await customClient
          .from('coding_questions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (questionError) throw questionError;
        
        // Fetch function parameters
        const { data: paramsData, error: paramsError } = await customClient
          .from('function_parameters')
          .select('*')
          .eq('coding_question_id', id)
          .order('display_order', { ascending: true });
        
        if (paramsError) throw paramsError;
        
        // Fetch test cases
        const { data: testCasesData, error: testCasesError } = await customClient
          .from('test_cases')
          .select('*')
          .eq('coding_question_id', id)
          .order('display_order', { ascending: true });
        
        if (testCasesError) throw testCasesError;
        
        // Fetch driver code
        const { data: driverCodeData, error: driverCodeError } = await customClient
          .from('driver_code')
          .select('*')
          .eq('coding_question_id', id)
          .single();
        
        // It's okay if there's no driver code yet
        if (driverCodeError && driverCodeError.code !== 'PGRST116') {
          console.error('Error fetching driver code:', driverCodeError);
        }
        
        // Map the data to our types
        const question: CodingQuestion = {
          id: questionData.id,
          title: questionData.title,
          description: questionData.description,
          example: questionData.example,
          constraints: questionData.constraints,
          functionName: questionData.function_name,
          returnType: questionData.return_type,
          difficulty: questionData.difficulty,
          quizId: questionData.quiz_id,
          createdAt: questionData.created_at,
          updatedAt: questionData.updated_at,
          createdBy: questionData.created_by,
          parameters: [],
          testCases: []
        };
        
        const parameters: FunctionParameter[] = paramsData.map(param => ({
          id: param.id,
          parameterName: param.parameter_name,
          parameterType: param.parameter_type,
          displayOrder: param.display_order
        }));
        
        const testCases: TestCase[] = testCasesData.map(testCase => ({
          id: testCase.id,
          input: testCase.input,
          output: testCase.output,
          isHidden: testCase.is_hidden,
          points: testCase.points,
          displayOrder: testCase.display_order
        }));
        
        const driverCode = driverCodeData ? {
          cCode: driverCodeData.c_code,
          cppCode: driverCodeData.cpp_code
        } : null;
        
        setQuestion(question);
        setParameters(parameters);
        setTestCases(testCases);
        setDriverCode(driverCode);
      } catch (error) {
        console.error('Error fetching coding question details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchQuestionDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading question details...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-gray-600">Question not found</p>
        <Button onClick={() => navigate('/admin/coding-questions')}>
          Back to Coding Questions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin/coding-questions')} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{question.title}</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/admin/coding-questions/edit/${id}`)}
          >
            Edit Question
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{question.description}</p>
                
                {question.example && (
                  <>
                    <h3 className="text-lg font-medium mt-4">Example</h3>
                    <pre className="bg-gray-50 p-4 rounded border">{question.example}</pre>
                  </>
                )}
                
                {question.constraints && (
                  <>
                    <h3 className="text-lg font-medium mt-4">Constraints</h3>
                    <p className="text-gray-700 whitespace-pre-line">{question.constraints}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Function Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono bg-gray-50 p-4 rounded border overflow-x-auto">
                <code>
                  {question.returnType} {question.functionName}(
                  {parameters.map((param, index) => (
                    <span key={param.id}>
                      {param.parameterType} {param.parameterName}
                      {index < parameters.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  )
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testCases.map((testCase, index) => {
                  // Parse the input JSON for display
                  let inputDisplay = 'Invalid input format';
                  try {
                    const inputObj = JSON.parse(testCase.input);
                    inputDisplay = JSON.stringify(inputObj, null, 2);
                  } catch (e) {
                    console.error('Error parsing test case input:', e);
                  }
                  
                  return (
                    <div key={testCase.id} className="p-4 border rounded-md relative">
                      <div className="absolute top-2 right-2">
                        {testCase.isHidden ? (
                          <span className="flex items-center">
                            <EyeOff size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-400 ml-1">Hidden from students</span>
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Eye size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-400 ml-1">Visible to students</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-2">Test Case {index + 1} ({testCase.points} point{testCase.points !== 1 ? 's' : ''})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-xs text-gray-500 mb-1">Input</h5>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{inputDisplay}</pre>
                        </div>
                        <div>
                          <h5 className="text-xs text-gray-500 mb-1">Expected Output</h5>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{testCase.output}</pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      question.difficulty === 'easy' 
                        ? 'bg-green-100 text-green-800'
                        : question.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                    </span>
                  </dd>
                </div>
                
                {question.quizId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Associated Quiz</dt>
                    <dd className="mt-1 text-sm">{question.quizId}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm">{new Date(question.createdAt).toLocaleString()}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm">{new Date(question.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          {driverCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-4 w-4 mr-2" /> 
                  Driver Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="cpp" className="flex-1">C++</TabsTrigger>
                    <TabsTrigger value="c" className="flex-1">C</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cpp" className="m-0">
                    <div className="relative overflow-hidden">
                      <Textarea
                        className="font-mono text-xs h-64 p-4 resize-none"
                        value={driverCode.cppCode}
                        readOnly
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                        onClick={() => {
                          navigator.clipboard.writeText(driverCode.cppCode);
                          // Optional: Add a toast notification here
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="c" className="m-0">
                    <div className="relative overflow-hidden">
                      <Textarea
                        className="font-mono text-xs h-64 p-4 resize-none"
                        value={driverCode.cCode}
                        readOnly
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                        onClick={() => {
                          navigator.clipboard.writeText(driverCode.cCode);
                          // Optional: Add a toast notification here
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionView;
