
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
  codingQuestions?: CodingQuestion[]; // Add this to link coding questions to quiz
};

export type StudentResult = {
  id: string;
  quizId: string;
  name: string;
  prn: string;
  batch: string;  // Changed from division to batch
  email: string;
  cheatingStatus: 'flagged' | 'no-issues';
  marksScored: number;
  totalMarks: number;
  submittedAt: string;
};

// Coding questions types
export type ParameterType = 
  'int' | 'long' | 'float' | 'double' | 'boolean' | 'char' | 'string' | 
  'int[]' | 'long[]' | 'float[]' | 'double[]' | 'boolean[]' | 'char[]' | 'string[]';

export type ReturnType = 
  'int' | 'long' | 'float' | 'double' | 'boolean' | 'char' | 'string' | 'void' |
  'int[]' | 'long[]' | 'float[]' | 'double[]' | 'boolean[]' | 'char[]' | 'string[]';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type FunctionParameter = {
  id: string;
  parameterName: string;
  parameterType: ParameterType;
  displayOrder: number;
};

export type TestCase = {
  id: string;
  input: string; // JSON string for structured input
  output: string;
  isHidden: boolean;
  points: number;
  displayOrder: number;
};

export type DriverCode = {
  cCode: string;
  cppCode: string;
};

export type CodingQuestion = {
  id: string;
  title: string;
  description: string;
  example?: string;
  constraints?: string;
  functionName: string;
  returnType: ReturnType;
  difficulty: DifficultyLevel;
  quizId?: string;
  parameters: FunctionParameter[];
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  driverCode?: DriverCode;
};
