
export type User = {
  id: string;
  email: string;
  role: 'admin';
};

export type Section = {
  id: string;
  title: string;
  instructions?: string;
  questions: Question[];
};

export type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  imageUrl?: string;
  options: Option[];
  marksForCorrect: number;
  marksForWrong: number;
  marksForUnattempted: number;
};

export type Quiz = {
  id: string;
  title: string;
  code: string;
  instructions?: string;
  duration: number; // in minutes
  startDateTime: string;
  endDateTime: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type StudentResult = {
  id: string;
  quizId: string;
  name: string;
  prn: string;
  division: string;
  email: string;
  cheatingStatus: 'flagged' | 'no-issues';
  marksScored: number;
  totalMarks: number;
  submittedAt: string;
};

export type ReturnType = 
  | 'int' | 'long' | 'float' | 'double' | 'boolean' | 'char' | 'string' | 'void'
  | 'int[]' | 'long[]' | 'float[]' | 'double[]' | 'boolean[]' | 'char[]' | 'string[]';

export type ParameterType = 
  | 'int' | 'long' | 'float' | 'double' | 'boolean' | 'char' | 'string'
  | 'int[]' | 'long[]' | 'float[]' | 'double[]' | 'boolean[]' | 'char[]' | 'string[]';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type FunctionParameter = {
  id: string;
  parameterName: string;
  parameterType: ParameterType;
};

export type TestCase = {
  id: string;
  input: Record<string, any>;
  output: string;
  points: number;
  isHidden: boolean;
};

export type CodingQuestion = {
  id: string;
  quizId: string;
  title: string;
  description: string;
  example?: string;
  constraints?: string;
  difficulty: DifficultyLevel;
  functionName: string;
  returnType: ReturnType;
  parameters: FunctionParameter[];
  testCases: TestCase[];
  driverCode: {
    cCode: string;
    cppCode: string;
  };
};
