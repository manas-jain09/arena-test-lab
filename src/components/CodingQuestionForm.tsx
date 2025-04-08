import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { customClient } from '@/integrations/supabase/customClient';
import { CodingQuestion, ParameterType, ReturnType, DifficultyLevel, FunctionParameter, TestCase, DriverCode } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, MoveDown, MoveUp, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface CodingQuestionFormProps {
  editMode?: boolean;
}

const CodingQuestionForm: React.FC<CodingQuestionFormProps> = ({ editMode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(editMode);
  const [activeTab, setActiveTab] = useState('cpp');
  const [driverCode, setDriverCode] = useState<DriverCode>({
    cCode: '',
    cppCode: '',
  });
  const [availableQuizzes, setAvailableQuizzes] = useState<Array<{ id: string; title: string }>>([]);

  const [questionData, setQuestionData] = useState<Omit<CodingQuestion, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'driverCode'>>({
    title: '',
    description: '',
    example: '',
    constraints: '',
    functionName: '',
    returnType: 'int',
    difficulty: 'medium',
    quizId: undefined,
    parameters: [],
    testCases: []
  });

  const returnTypeOptions: ReturnType[] = [
    'int', 'long', 'float', 'double', 'boolean', 'char', 'string', 'void',
    'int[]', 'long[]', 'float[]', 'double[]', 'boolean[]', 'char[]', 'string[]'
  ];

  const parameterTypeOptions: ParameterType[] = [
    'int', 'long', 'float', 'double', 'boolean', 'char', 'string',
    'int[]', 'long[]', 'float[]', 'double[]', 'boolean[]', 'char[]', 'string[]'
  ];

  const difficultyOptions: DifficultyLevel[] = ['easy', 'medium', 'hard'];

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('id, title')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAvailableQuizzes(data || []);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      }
    };

    fetchQuizzes();
  }, []);

  useEffect(() => {
    const fetchCodingQuestion = async () => {
      if (!editMode || !id) return;

      try {
        const { data: questionData, error: questionError } = await customClient
          .from('coding_questions')
          .select('*')
          .eq('id', id)
          .single();

        if (questionError) throw questionError;

        const { data: parametersData, error: parametersError } = await customClient
          .from('function_parameters')
          .select('*')
          .eq('coding_question_id', id)
          .order('display_order', { ascending: true });

        if (parametersError) throw parametersError;

        const { data: testCasesData, error: testCasesError } = await customClient
          .from('test_cases')
          .select('*')
          .eq('coding_question_id', id)
          .order('display_order', { ascending: true });

        if (testCasesError) throw testCasesError;

        const { data: driverCodeData, error: driverCodeError } = await customClient
          .from('driver_code')
          .select('*')
          .eq('coding_question_id', id)
          .single();

        if (driverCodeError && driverCodeError.code !== 'PGRST116') throw driverCodeError;

        const parameters: FunctionParameter[] = parametersData.map(param => ({
          id: param.id,
          parameterName: param.parameter_name,
          parameterType: param.parameter_type as ParameterType,
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

        setQuestionData({
          title: questionData.title,
          description: questionData.description,
          example: questionData.example || '',
          constraints: questionData.constraints || '',
          functionName: questionData.function_name,
          returnType: questionData.return_type as ReturnType,
          difficulty: questionData.difficulty as DifficultyLevel,
          quizId: questionData.quiz_id,
          parameters,
          testCases
        });

        if (driverCodeData) {
          setDriverCode({
            cCode: driverCodeData.c_code,
            cppCode: driverCodeData.cpp_code
          });
        }
      } catch (error) {
        console.error('Error fetching coding question data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load coding question data. Please try again.',
          variant: 'destructive'
        });
        navigate('/admin/coding-questions');
      } finally {
        setLoading(false);
      }
    };

    fetchCodingQuestion();
  }, [id, editMode, navigate, toast]);

  const generateDriverCode = async () => {
    if (!questionData.functionName || !questionData.parameters.length || !questionData.testCases.length) {
      toast({
        title: 'Missing Information',
        description: 'Function name, parameters, and test cases are required to generate driver code.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const parametersData = questionData.parameters.map(param => ({
        parameter_name: param.parameterName,
        parameter_type: param.parameterType
      }));

      const testCasesData = questionData.testCases.map(testCase => {
        try {
          return {
            input: JSON.parse(testCase.input),
            output: testCase.output,
            points: testCase.points
          };
        } catch (e) {
          throw new Error(`Invalid JSON in test case input: ${testCase.input}`);
        }
      });

      const { data, error } = await customClient.rpc('generate_driver_code', {
        function_name: questionData.functionName,
        return_type: questionData.returnType,
        parameters: parametersData,
        test_cases: testCasesData
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'c_code' in data && 'cpp_code' in data) {
        setDriverCode({
          cCode: data.c_code as string,
          cppCode: data.cpp_code as string
        });
        
        toast({
          title: 'Success',
          description: 'Driver code generated successfully'
        });
      } else {
        throw new Error('Invalid response format from driver code generator');
      }
    } catch (error) {
      console.error('Error generating driver code:', error);
      toast({
        title: 'Error',
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Failed to generate driver code. Please check your inputs.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setQuestionData(prev => ({ ...prev, [name]: value }));
  };

  const addParameter = () => {
    const newParameter: FunctionParameter = {
      id: Date.now().toString(),
      parameterName: '',
      parameterType: 'int',
      displayOrder: questionData.parameters.length
    };
    
    setQuestionData(prev => ({
      ...prev,
      parameters: [...prev.parameters, newParameter]
    }));
  };

  const handleParameterChange = (
    parameterId: string, 
    field: string, 
    value: string
  ) => {
    setQuestionData(prev => ({
      ...prev,
      parameters: prev.parameters.map(param => 
        param.id === parameterId 
          ? { ...param, [field]: value } 
          : param
      )
    }));
  };

  const removeParameter = (parameterId: string) => {
    setQuestionData(prev => ({
      ...prev,
      parameters: prev.parameters
        .filter(param => param.id !== parameterId)
        .map((param, index) => ({ ...param, displayOrder: index }))
    }));
  };

  const moveParameterUp = (index: number) => {
    if (index === 0) return;
    
    const newParameters = [...questionData.parameters];
    [newParameters[index], newParameters[index - 1]] = [newParameters[index - 1], newParameters[index]];
    
    setQuestionData(prev => ({
      ...prev,
      parameters: newParameters.map((param, i) => ({ ...param, displayOrder: i }))
    }));
  };

  const moveParameterDown = (index: number) => {
    if (index === questionData.parameters.length - 1) return;
    
    const newParameters = [...questionData.parameters];
    [newParameters[index], newParameters[index + 1]] = [newParameters[index + 1], newParameters[index]];
    
    setQuestionData(prev => ({
      ...prev,
      parameters: newParameters.map((param, i) => ({ ...param, displayOrder: i }))
    }));
  };

  const addTestCase = () => {
    let defaultInput = {};
    
    questionData.parameters.forEach(param => {
      let defaultValue;
      switch (param.parameterType) {
        case 'int':
        case 'long':
          defaultValue = 0;
          break;
        case 'float':
        case 'double':
          defaultValue = 0.0;
          break;
        case 'boolean':
          defaultValue = false;
          break;
        case 'char':
          defaultValue = 'a';
          break;
        case 'string':
          defaultValue = '';
          break;
        case 'int[]':
        case 'long[]':
          defaultValue = [0, 0];
          break;
        case 'float[]':
        case 'double[]':
          defaultValue = [0.0, 0.0];
          break;
        case 'boolean[]':
          defaultValue = [false, false];
          break;
        case 'char[]':
          defaultValue = ['a', 'b'];
          break;
        case 'string[]':
          defaultValue = ['', ''];
          break;
        default:
          defaultValue = '';
      }
      defaultInput = { ...defaultInput, [param.parameterName]: defaultValue };
    });

    const newTestCase: TestCase = {
      id: Date.now().toString(),
      input: JSON.stringify(defaultInput, null, 2),
      output: '',
      isHidden: false,
      points: 1,
      displayOrder: questionData.testCases.length
    };
    
    setQuestionData(prev => ({
      ...prev,
      testCases: [...prev.testCases, newTestCase]
    }));
  };

  const handleTestCaseChange = (
    testCaseId: string, 
    field: string, 
    value: string | number | boolean
  ) => {
    setQuestionData(prev => ({
      ...prev,
      testCases: prev.testCases.map(testCase => 
        testCase.id === testCaseId 
          ? { ...testCase, [field]: value } 
          : testCase
      )
    }));
  };

  const handleTestCaseInputChange = (
    testCaseId: string, 
    paramName: string, 
    value: string
  ) => {
    setQuestionData(prev => ({
      ...prev,
      testCases: prev.testCases.map(testCase => {
        if (testCase.id === testCaseId) {
          try {
            const inputObj = JSON.parse(testCase.input);
            const param = questionData.parameters.find(p => p.parameterName === paramName);
            let typedValue: any = value;
            
            if (param) {
              switch (param.parameterType) {
                case 'int':
                case 'long':
                  typedValue = parseInt(value) || 0;
                  break;
                case 'float':
                case 'double':
                  typedValue = parseFloat(value) || 0.0;
                  break;
                case 'boolean':
                  typedValue = value.toLowerCase() === 'true';
                  break;
                case 'int[]':
                case 'long[]':
                  if (value.includes(',')) {
                    typedValue = value.split(',').map(v => parseInt(v.trim()) || 0);
                  } else {
                    try {
                      typedValue = JSON.parse(value);
                    } catch (e) {
                      typedValue = [0];
                    }
                  }
                  break;
                case 'float[]':
                case 'double[]':
                  if (value.includes(',')) {
                    typedValue = value.split(',').map(v => parseFloat(v.trim()) || 0.0);
                  } else {
                    try {
                      typedValue = JSON.parse(value);
                    } catch (e) {
                      typedValue = [0.0];
                    }
                  }
                  break;
                case 'boolean[]':
                  if (value.includes(',')) {
                    typedValue = value.split(',').map(v => v.trim().toLowerCase() === 'true');
                  } else {
                    try {
                      typedValue = JSON.parse(value);
                    } catch (e) {
                      typedValue = [false];
                    }
                  }
                  break;
                case 'char[]':
                case 'string[]':
                  if (value.includes(',')) {
                    typedValue = value.split(',').map(v => v.trim());
                  } else {
                    try {
                      typedValue = JSON.parse(value);
                    } catch (e) {
                      typedValue = [''];
                    }
                  }
                  break;
              }
            }
            
            const updatedInput = { ...inputObj, [paramName]: typedValue };
            return { ...testCase, input: JSON.stringify(updatedInput, null, 2) };
          } catch (e) {
            console.error('Error parsing test case input:', e);
            return testCase;
          }
        }
        return testCase;
      })
    }));
  };

  const removeTestCase = (testCaseId: string) => {
    setQuestionData(prev => ({
      ...prev,
      testCases: prev.testCases
        .filter(testCase => testCase.id !== testCaseId)
        .map((testCase, index) => ({ ...testCase, displayOrder: index }))
    }));
  };

  const moveTestCaseUp = (index: number) => {
    if (index === 0) return;
    
    const newTestCases = [...questionData.testCases];
    [newTestCases[index], newTestCases[index - 1]] = [newTestCases[index - 1], newTestCases[index]];
    
    setQuestionData(prev => ({
      ...prev,
      testCases: newTestCases.map((testCase, i) => ({ ...testCase, displayOrder: i }))
    }));
  };

  const moveTestCaseDown = (index: number) => {
    if (index === questionData.testCases.length - 1) return;
    
    const newTestCases = [...questionData.testCases];
    [newTestCases[index], newTestCases[index + 1]] = [newTestCases[index + 1], newTestCases[index]];
    
    setQuestionData(prev => ({
      ...prev,
      testCases: newTestCases.map((testCase, i) => ({ ...testCase, displayOrder: i }))
    }));
  };

  const validateTestCaseInputs = () => {
    for (const testCase of questionData.testCases) {
      try {
        const parsedInput = JSON.parse(testCase.input);
        
        if (typeof parsedInput !== 'object' || parsedInput === null || Array.isArray(parsedInput)) {
          return `Test case input must be a JSON object: ${testCase.input}`;
        }
        
        for (const param of questionData.parameters) {
          if (!(param.parameterName in parsedInput)) {
            return `Parameter "${param.parameterName}" is missing in test case input: ${testCase.input}`;
          }
        }
      } catch (e) {
        return `Invalid JSON in test case input: ${testCase.input}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    if (!questionData.title.trim()) {
      toast({
        title: "Error",
        description: "Question title is required",
        variant: "destructive"
      });
      return;
    }

    if (!questionData.description.trim()) {
      toast({
        title: "Error",
        description: "Question description is required",
        variant: "destructive"
      });
      return;
    }

    if (!questionData.functionName.trim()) {
      toast({
        title: "Error",
        description: "Function name is required",
        variant: "destructive"
      });
      return;
    }

    if (questionData.parameters.some(param => !param.parameterName.trim())) {
      toast({
        title: "Error",
        description: "All parameters must have names",
        variant: "destructive"
      });
      return;
    }

    if (questionData.testCases.length === 0) {
      toast({
        title: "Error",
        description: "At least one test case is required",
        variant: "destructive"
      });
      return;
    }

    const testCaseError = validateTestCaseInputs();
    if (testCaseError) {
      toast({
        title: "Error",
        description: testCaseError,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      if (editMode && id) {
        const { error: questionError } = await customClient
          .from('coding_questions')
          .update({
            title: questionData.title,
            description: questionData.description,
            example: questionData.example || null,
            constraints: questionData.constraints || null,
            function_name: questionData.functionName,
            return_type: questionData.returnType,
            difficulty: questionData.difficulty,
            quiz_id: questionData.quizId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (questionError) throw questionError;

        const { error: deleteParamsError } = await customClient
          .from('function_parameters')
          .delete()
          .eq('coding_question_id', id);

        if (deleteParamsError) throw deleteParamsError;

        const { error: deleteTestCasesError } = await customClient
          .from('test_cases')
          .delete()
          .eq('coding_question_id', id);

        if (deleteTestCasesError) throw deleteTestCasesError;

        for (const param of questionData.parameters) {
          const { error: paramError } = await customClient
            .from('function_parameters')
            .insert({
              coding_question_id: id,
              parameter_name: param.parameterName,
              parameter_type: param.parameterType,
              display_order: param.displayOrder
            });

          if (paramError) throw paramError;
        }

        for (const testCase of questionData.testCases) {
          const { error: testCaseError } = await customClient
            .from('test_cases')
            .insert({
              coding_question_id: id,
              input: testCase.input,
              output: testCase.output,
              is_hidden: testCase.isHidden,
              points: testCase.points,
              display_order: testCase.displayOrder
            });

          if (testCaseError) throw testCaseError;
        }

        if (driverCode.cCode && driverCode.cppCode) {
          const { data: existingDriverCode, error: checkError } = await customClient
            .from('driver_code')
            .select('id')
            .eq('coding_question_id', id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') throw checkError;

          if (existingDriverCode) {
            const { error: updateDriverCodeError } = await customClient
              .from('driver_code')
              .update({
                c_code: driverCode.cCode,
                cpp_code: driverCode.cppCode
              })
              .eq('id', existingDriverCode.id);

            if (updateDriverCodeError) throw updateDriverCodeError;
          } else {
            const { error: insertDriverCodeError } = await customClient
              .from('driver_code')
              .insert({
                coding_question_id: id,
                c_code: driverCode.cCode,
                cpp_code: driverCode.cppCode
              });

            if (insertDriverCodeError) throw insertDriverCodeError;
          }
        }

        toast({
          title: "Success",
          description: "Coding question updated successfully"
        });
      } else {
        const { data: newQuestion, error: questionError } = await customClient
          .from('coding_questions')
          .insert({
            title: questionData.title,
            description: questionData.description,
            example: questionData.example || null,
            constraints: questionData.constraints || null,
            function_name: questionData.functionName,
            return_type: questionData.returnType,
            difficulty: questionData.difficulty,
            quiz_id: questionData.quizId || null,
            created_by: user.id
          })
          .select()
          .single();

        if (questionError) throw questionError;

        for (const param of questionData.parameters) {
          const { error: paramError } = await customClient
            .from('function_parameters')
            .insert({
              coding_question_id: newQuestion.id,
              parameter_name: param.parameterName,
              parameter_type: param.parameterType,
              display_order: param.displayOrder
            });

          if (paramError) throw paramError;
        }

        for (const testCase of questionData.testCases) {
          const { error: testCaseError } = await customClient
            .from('test_cases')
            .insert({
              coding_question_id: newQuestion.id,
              input: testCase.input,
              output: testCase.output,
              is_hidden: testCase.isHidden,
              points: testCase.points,
              display_order: testCase.displayOrder
            });

          if (testCaseError) throw testCaseError;
        }

        if (driverCode.cCode && driverCode.cppCode) {
          const { error: driverCodeError } = await customClient
            .from('driver_code')
            .insert({
              coding_question_id: newQuestion.id,
              c_code: driverCode.cCode,
              cpp_code: driverCode.cppCode
            });

          if (driverCodeError) throw driverCodeError;
        }

        toast({
          title: "Success",
          description: "Coding question created successfully"
        });
      }
      
      navigate('/admin/coding-questions');
    } catch (error) {
      console.error('Error saving coding question:', error);
      toast({
        title: "Error",
        description: "Failed to save coding question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <p className="text-gray-500">Loading question data...</p>
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
          <h1 className="text-2xl font-bold">
            {editMode ? 'Edit Coding Question' : 'Create New Coding Question'}
          </h1>
        </div>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed" 
          onClick={handleSubmit}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" /> 
          {editMode ? 'Update Question' : 'Create Question'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the basic details of your coding question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Question Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={questionData.title}
                  onChange={handleQuestionChange}
                  placeholder="e.g., Sum of Two Numbers"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={questionData.difficulty}
                  onValueChange={(value) => handleSelectChange('difficulty', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizId">Add to Quiz (Optional)</Label>
              <Select
                value={questionData.quizId || "none"}
                onValueChange={(value) => handleSelectChange('quizId', value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableQuizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={questionData.description}
                onChange={handleQuestionChange}
                placeholder="Describe the problem that needs to be solved..."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="example">Example (Optional)</Label>
              <Textarea
                id="example"
                name="example"
                value={questionData.example || ''}
                onChange={handleQuestionChange}
                placeholder="Provide examples of inputs and expected outputs..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">Constraints (Optional)</Label>
              <Textarea
                id="constraints"
                name="constraints"
                value={questionData.constraints || ''}
                onChange={handleQuestionChange}
                placeholder="List any constraints for the problem..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="functionName">Function Name</Label>
                <Input
                  id="functionName"
                  name="functionName"
                  value={questionData.functionName}
                  onChange={handleQuestionChange}
                  placeholder="e.g., calculateSum"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnType">Return Type</Label>
                <Select
                  value={questionData.returnType}
                  onValueChange={(value) => handleSelectChange('returnType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select return type" />
                  </SelectTrigger>
                  <SelectContent>
                    {returnTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Function Parameters</CardTitle>
            <CardDescription>
              Define the parameters for your function
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionData.parameters.map((param, index) => (
              <div key={param.id} className="flex items-center space-x-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Input
                      value={param.parameterName}
                      onChange={(e) => handleParameterChange(param.id, 'parameterName', e.target.value)}
                      placeholder="Parameter Name"
                      required
                    />
                  </div>
                  <div>
                    <Select
                      value={param.parameterType}
                      onValueChange={(value) => handleParameterChange(param.id, 'parameterType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {parameterTypeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveParameterUp(index)}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                  )}
                  {index < questionData.parameters.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveParameterDown(index)}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParameter(param.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={addParameter}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Parameter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
            <CardDescription>
              Create test cases to validate your function
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionData.testCases.map((testCase, index) => (
              <Card key
