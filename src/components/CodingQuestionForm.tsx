import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FunctionParameter, TestCase, ReturnType, ParameterType, DifficultyLevel } from '@/types';
import { Database } from '@/services/supabase.types';

interface CodingQuestionFormProps {
  quizId: string;
  onSave: () => void;
  onCancel: () => void;
}

const CodingQuestionForm: React.FC<CodingQuestionFormProps> = ({ quizId, onSave, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [example, setExample] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [functionName, setFunctionName] = useState('');
  const [returnType, setReturnType] = useState<ReturnType>('int');
  const [parameters, setParameters] = useState<FunctionParameter[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  
  const returnTypes: ReturnType[] = [
    'int', 'long', 'float', 'double', 'boolean', 'char', 'string', 'void',
    'int[]', 'long[]', 'float[]', 'double[]', 'boolean[]', 'char[]', 'string[]'
  ];
  
  const parameterTypes: ParameterType[] = [
    'int', 'long', 'float', 'double', 'boolean', 'char', 'string',
    'int[]', 'long[]', 'float[]', 'double[]', 'boolean[]', 'char[]', 'string[]'
  ];
  
  const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
  
  const addParameter = () => {
    const newParam: FunctionParameter = {
      id: Date.now().toString(),
      parameterName: '',
      parameterType: 'int'
    };
    setParameters([...parameters, newParam]);
  };
  
  const removeParameter = (id: string) => {
    setParameters(parameters.filter(param => param.id !== id));
    
    setTestCases(testCases.map(testCase => {
      const newInput = { ...testCase.input };
      const paramToRemove = parameters.find(p => p.id === id);
      if (paramToRemove && paramToRemove.parameterName in newInput) {
        delete newInput[paramToRemove.parameterName];
      }
      return { ...testCase, input: newInput };
    }));
  };
  
  const updateParameter = (id: string, field: keyof FunctionParameter, value: string) => {
    const updatedParameters = parameters.map(param => {
      if (param.id === id) {
        const updatedParam = { ...param, [field]: value };
        
        if (field === 'parameterName' && param.parameterName !== '') {
          setTestCases(testCases.map(testCase => {
            const newInput = { ...testCase.input };
            if (param.parameterName in newInput) {
              newInput[value] = newInput[param.parameterName];
              delete newInput[param.parameterName];
            }
            return { ...testCase, input: newInput };
          }));
        }
        
        return updatedParam;
      }
      return param;
    });
    setParameters(updatedParameters);
  };
  
  const addTestCase = () => {
    const newInputs: Record<string, any> = {};
    parameters.forEach(param => {
      switch (param.parameterType) {
        case 'int':
        case 'long':
          newInputs[param.parameterName] = 0;
          break;
        case 'float':
        case 'double':
          newInputs[param.parameterName] = 0.0;
          break;
        case 'boolean':
          newInputs[param.parameterName] = false;
          break;
        case 'char':
          newInputs[param.parameterName] = 'a';
          break;
        case 'string':
          newInputs[param.parameterName] = '';
          break;
        default:
          newInputs[param.parameterName] = '[]';
      }
    });
    
    const newTestCase: TestCase = {
      id: Date.now().toString(),
      input: newInputs,
      output: returnType === 'boolean' ? 'true' : returnType === 'string' ? '' : '0',
      points: 1,
      isHidden: false
    };
    
    setTestCases([...testCases, newTestCase]);
  };
  
  const removeTestCase = (id: string) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };
  
  const updateTestCase = (
    id: string, 
    field: keyof TestCase, 
    value: any
  ) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };
  
  const updateTestCaseInput = (
    testCaseId: string,
    paramName: string,
    value: any
  ) => {
    setTestCases(testCases.map(tc => {
      if (tc.id === testCaseId) {
        const newInput = { ...tc.input };
        newInput[paramName] = value;
        return { ...tc, input: newInput };
      }
      return tc;
    }));
  };
  
  const generateDriverCode = async () => {
    try {
      const formattedParams = parameters.map(p => ({
        parameterName: p.parameterName,
        parameterType: p.parameterType
      }));
      
      const formattedTestCases = testCases.map(tc => ({
        input: tc.input,
        output: tc.output,
        points: tc.points,
        isHidden: tc.isHidden
      }));
      
      const { data, error } = await supabase.rpc('generate_driver_code', {
        function_name: functionName,
        return_type: returnType,
        parameters: formattedParams,
        test_cases: formattedTestCases
      });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error generating driver code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate driver code: ' + error.message,
        variant: 'destructive'
      });
      return null;
    }
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!title.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Question title is required',
          variant: 'destructive'
        });
        return;
      }
      
      if (!description.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Question description is required',
          variant: 'destructive'
        });
        return;
      }
      
      if (!functionName.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Function name is required',
          variant: 'destructive'
        });
        return;
      }
      
      if (parameters.some(p => !p.parameterName.trim())) {
        toast({
          title: 'Validation Error',
          description: 'All parameters must have names',
          variant: 'destructive'
        });
        return;
      }
      
      if (testCases.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one test case is required',
          variant: 'destructive'
        });
        return;
      }
      
      const driverCode = await generateDriverCode();
      if (!driverCode) return;
      
      const { data: questionData, error: questionError } = await supabase
        .from('coding_questions')
        .insert({
          quiz_id: quizId,
          title,
          description,
          example,
          constraints,
          difficulty,
          function_name: functionName,
          return_type: returnType,
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single();
      
      if (questionError) throw questionError;
      
      const parametersToInsert = parameters.map((param, index) => ({
        coding_question_id: questionData.id,
        parameter_name: param.parameterName,
        parameter_type: param.parameterType,
        display_order: index
      }));
      
      const { error: paramsError } = await supabase
        .from('function_parameters')
        .insert(parametersToInsert);
      
      if (paramsError) throw paramsError;
      
      const testCasesToInsert = testCases.map((tc, index) => ({
        coding_question_id: questionData.id,
        input: JSON.stringify(tc.input),
        output: tc.output,
        points: tc.points,
        is_hidden: tc.isHidden,
        display_order: index
      }));
      
      const { error: testCasesError } = await supabase
        .from('test_cases')
        .insert(testCasesToInsert);
      
      if (testCasesError) throw testCasesError;
      
      const { error: driverCodeError } = await supabase
        .from('driver_code')
        .insert({
          coding_question_id: questionData.id,
          c_code: driverCode.c_code,
          cpp_code: driverCode.cpp_code
        });
      
      if (driverCodeError) throw driverCodeError;
      
      toast({
        title: 'Success',
        description: 'Coding question added successfully'
      });
      
      onSave();
    } catch (error: any) {
      console.error('Error saving coding question:', error);
      toast({
        title: 'Error',
        description: 'Failed to save coding question: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const renderTestCaseInputs = (testCase: TestCase) => {
    return parameters.map(param => (
      <div key={param.id} className="mb-2">
        <Label htmlFor={`tc-${testCase.id}-${param.parameterName}`}>
          {param.parameterName} ({param.parameterType})
        </Label>
        <Input
          id={`tc-${testCase.id}-${param.parameterName}`}
          value={testCase.input[param.parameterName] || ''}
          onChange={(e) => updateTestCaseInput(
            testCase.id, 
            param.parameterName, 
            param.parameterType === 'boolean' 
              ? e.target.value === 'true' 
              : e.target.value
          )}
        />
      </div>
    ));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Coding Question</CardTitle>
          <CardDescription>Create a new coding question</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Question Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reverse a String"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a function that reverses a string..."
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="example">Example</Label>
              <Textarea
                id="example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Input: 'hello' Output: 'olleh'"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="constraints">Constraints</Label>
              <Textarea
                id="constraints"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="1 <= s.length <= 100"
                rows={3}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select 
              value={difficulty} 
              onValueChange={(value: DifficultyLevel) => setDifficulty(value)}
            >
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="functionName">Function Name</Label>
              <Input
                id="functionName"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="reverseString"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="returnType">Return Type</Label>
              <Select 
                value={returnType} 
                onValueChange={(value: ReturnType) => setReturnType(value)}
              >
                <SelectTrigger id="returnType">
                  <SelectValue placeholder="Select return type" />
                </SelectTrigger>
                <SelectContent>
                  {returnTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
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
          <CardDescription>Define the parameters for your function</CardDescription>
        </CardHeader>
        <CardContent>
          {parameters.length === 0 ? (
            <p className="text-muted-foreground mb-4">No parameters added yet</p>
          ) : (
            <div className="space-y-4 mb-4">
              {parameters.map((param, index) => (
                <div key={param.id} className="flex items-start space-x-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`param-${param.id}-name`}>Parameter Name</Label>
                      <Input
                        id={`param-${param.id}-name`}
                        value={param.parameterName}
                        onChange={(e) => updateParameter(param.id, 'parameterName', e.target.value)}
                        placeholder="paramName"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`param-${param.id}-type`}>Type</Label>
                      <Select 
                        value={param.parameterType} 
                        onValueChange={(value: ParameterType) => 
                          updateParameter(param.id, 'parameterType', value)
                        }
                      >
                        <SelectTrigger id={`param-${param.id}-type`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameterTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParameter(param.id)}
                    className="text-red-500 hover:text-red-700 mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={addParameter}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Parameter
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
          <CardDescription>Define test cases to validate submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {testCases.length === 0 ? (
            <p className="text-muted-foreground mb-4">No test cases added yet</p>
          ) : (
            <div className="space-y-6 mb-4">
              {testCases.map((testCase, index) => (
                <Card key={testCase.id} className="border-l-4 border-l-arena-red">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Test Case {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTestCase(testCase.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h3 className="font-medium">Input</h3>
                        {renderTestCaseInputs(testCase)}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`tc-${testCase.id}-output`}>Expected Output</Label>
                          <Input
                            id={`tc-${testCase.id}-output`}
                            value={testCase.output}
                            onChange={(e) => updateTestCase(testCase.id, 'output', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`tc-${testCase.id}-points`}>Points</Label>
                          <Input
                            id={`tc-${testCase.id}-points`}
                            type="number"
                            min={1}
                            value={testCase.points}
                            onChange={(e) => updateTestCase(testCase.id, 'points', parseInt(e.target.value))}
                            required
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`tc-${testCase.id}-hidden`}
                            checked={testCase.isHidden}
                            onCheckedChange={(checked) => 
                              updateTestCase(testCase.id, 'isHidden', checked)
                            }
                          />
                          <Label htmlFor={`tc-${testCase.id}-hidden`}>
                            Hide from students
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={addTestCase}
            className="w-full"
            disabled={parameters.length === 0 || parameters.some(p => !p.parameterName.trim())}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Test Case
          </Button>
          
          {parameters.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Add at least one parameter before creating test cases
            </p>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={loading || title.trim() === '' || functionName.trim() === '' || testCases.length === 0}
          className="bg-arena-red hover:bg-arena-darkRed"
        >
          {loading ? 'Saving...' : 'Save Coding Question'}
        </Button>
      </div>
    </div>
  );
};

export default CodingQuestionForm;
