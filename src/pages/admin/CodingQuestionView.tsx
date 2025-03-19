
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CodingQuestion, DifficultyLevel, ParameterType, ReturnType } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Terminal } from 'lucide-react';

const CodingQuestionView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cpp');

  useEffect(() => {
    if (!id) return;
    fetchQuestionDetails(id);
  }, [id]);

  const fetchQuestionDetails = async (questionId: string) => {
    try {
      setLoading(true);
      
      // Fetch question basic info
      const { data: questionData, error: questionError } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (questionError) throw questionError;
      
      // Fetch parameters
      const { data: parametersData, error: parametersError } = await supabase
        .from('function_parameters')
        .select('*')
        .eq('coding_question_id', questionId)
        .order('display_order', { ascending: true });
      
      if (parametersError) throw parametersError;
      
      // Fetch test cases
      const { data: testCasesData, error: testCasesError } = await supabase
        .from('test_cases')
        .select('*')
        .eq('coding_question_id', questionId)
        .order('display_order', { ascending: true });
      
      if (testCasesError) throw testCasesError;
      
      // Fetch driver code if available
      const { data: driverCodeData, error: driverCodeError } = await supabase
        .from('driver_code')
        .select('*')
        .eq('coding_question_id', questionId)
        .single();
      
      // It's okay if driver code is not found
      const driverCode = driverCodeError && driverCodeError.code === 'PGRST116'
        ? undefined
        : driverCodeError
          ? undefined
          : {
              cCode: driverCodeData.c_code,
              cppCode: driverCodeData.cpp_code
            };
      
      // Combine all data
      const fullQuestion: CodingQuestion = {
        id: questionData.id,
        title: questionData.title,
        description: questionData.description,
        example: questionData.example,
        constraints: questionData.constraints,
        functionName: questionData.function_name,
        returnType: questionData.return_type as ReturnType,
        difficulty: questionData.difficulty as DifficultyLevel,
        quizId: questionData.quiz_id,
        createdAt: questionData.created_at,
        updatedAt: questionData.updated_at,
        createdBy: questionData.created_by,
        parameters: parametersData.map(param => ({
          id: param.id,
          parameterName: param.parameter_name,
          parameterType: param.parameter_type as ParameterType,
          displayOrder: param.display_order
        })),
        testCases: testCasesData.map(testCase => ({
          id: testCase.id,
          input: testCase.input,
          output: testCase.output,
          isHidden: testCase.is_hidden,
          points: testCase.points,
          displayOrder: testCase.display_order
        })),
        driverCode
      };
      
      setQuestion(fullQuestion);
    } catch (error) {
      console.error('Error fetching coding question details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coding question details. Please try again.',
        variant: 'destructive'
      });
      navigate('/admin/coding-questions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <p className="text-gray-500">Loading question details...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-gray-500">Question not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/admin/coding-questions')}
        >
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
          <h1 className="text-2xl font-bold truncate max-w-[600px]">
            {question.title}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/coding-questions/${question.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit Question
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
                <p className="whitespace-pre-wrap">{question.description}</p>
              </div>
            </CardContent>
          </Card>

          {question.example && (
            <Card>
              <CardHeader>
                <CardTitle>Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{question.example}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {question.constraints && (
            <Card>
              <CardHeader>
                <CardTitle>Constraints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{question.constraints}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Function Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-gray-100 p-4 rounded-md">
                <div className="mb-2">C++:</div>
                {question.returnType === 'string' ? 'string' : 
                 question.returnType.includes('[]') ? 
                 `vector<${question.returnType.replace('[]', '')}>` : 
                 question.returnType} {question.functionName}(
                {question.parameters.map((param, index) => (
                  <span key={param.id}>
                    {param.parameterType === 'string' ? 'string' : 
                     param.parameterType.includes('[]') ? 
                     `vector<${param.parameterType.replace('[]', '')}>` : 
                     param.parameterType} {param.parameterName}
                    {index < question.parameters.length - 1 ? ', ' : ''}
                  </span>
                ))}
                );
                
                <div className="mt-4 mb-2">C:</div>
                {question.returnType} {question.functionName}(
                {question.parameters.map((param, index) => {
                  const isArray = param.parameterType.includes('[]');
                  const baseType = param.parameterType.replace('[]', '');
                  return (
                    <span key={param.id}>
                      {isArray ? 
                        (baseType === 'string' ? 
                          `char** ${param.parameterName}, int ${param.parameterName}_size` : 
                          `${baseType}* ${param.parameterName}, int ${param.parameterName}_size`
                        ) : 
                        (param.parameterType === 'string' ? 
                          `char* ${param.parameterName}` : 
                          `${param.parameterType} ${param.parameterName}`
                        )
                      }
                      {index < question.parameters.length - 1 ? ', ' : ''}
                    </span>
                  );
                })}
                );
              </div>
            </CardContent>
          </Card>

          {question.driverCode && (
            <Card>
              <CardHeader>
                <CardTitle>Driver Code</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="cpp">C++</TabsTrigger>
                    <TabsTrigger value="c">C</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cpp" className="mt-0">
                    <pre className="font-mono text-sm bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
                      {question.driverCode.cppCode}
                    </pre>
                  </TabsContent>
                  <TabsContent value="c" className="mt-0">
                    <pre className="font-mono text-sm bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
                      {question.driverCode.cCode}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Function Name</dt>
                  <dd className="mt-1 font-mono">{question.functionName}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Return Type</dt>
                  <dd className="mt-1 font-mono">{question.returnType}</dd>
                </div>
                
                {question.parameters.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Parameters</dt>
                    <dd className="mt-1">
                      <ul className="space-y-1">
                        {question.parameters.map((param) => (
                          <li key={param.id} className="text-sm font-mono">
                            {param.parameterName}: {param.parameterType}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {question.testCases.map((testCase, index) => {
                  let inputObj;
                  try {
                    inputObj = JSON.parse(testCase.input);
                  } catch (e) {
                    inputObj = { error: "Invalid JSON" };
                  }
                  
                  return (
                    <div key={testCase.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Test Case {index + 1}</h3>
                        <div className="flex items-center">
                          {testCase.isHidden && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              Hidden
                            </span>
                          )}
                          <span className="text-xs ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {testCase.points} point{testCase.points !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="mb-2">
                          <span className="font-medium">Input:</span>
                          <pre className="bg-gray-50 mt-1 p-2 rounded-md text-xs overflow-auto">
                            {JSON.stringify(inputObj, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="font-medium">Expected Output:</span>
                          <pre className="bg-gray-50 mt-1 p-2 rounded-md text-xs overflow-auto">
                            {testCase.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionView;
