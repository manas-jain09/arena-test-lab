
export type Database = {
  public: {
    Tables: {
      coding_questions: {
        Row: {
          id: string;
          quiz_id: string;
          title: string;
          description: string;
          example?: string;
          constraints?: string;
          difficulty: 'easy' | 'medium' | 'hard';
          function_name: string;
          return_type: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          quiz_id: string;
          title: string;
          description: string;
          example?: string;
          constraints?: string;
          difficulty: 'easy' | 'medium' | 'hard';
          function_name: string;
          return_type: string;
          created_by: string;
        };
      };
      function_parameters: {
        Row: {
          id: string;
          coding_question_id: string;
          parameter_name: string;
          parameter_type: string;
          display_order: number;
        };
        Insert: {
          coding_question_id: string;
          parameter_name: string;
          parameter_type: string;
          display_order: number;
        };
      };
      test_cases: {
        Row: {
          id: string;
          coding_question_id: string;
          input: string;
          output: string;
          points: number;
          is_hidden: boolean;
          display_order: number;
        };
        Insert: {
          coding_question_id: string;
          input: string;
          output: string;
          points: number;
          is_hidden: boolean;
          display_order: number;
        };
      };
      driver_code: {
        Row: {
          id: string;
          coding_question_id: string;
          c_code: string;
          cpp_code: string;
        };
        Insert: {
          coding_question_id: string;
          c_code: string;
          cpp_code: string;
        };
      };
    };
    Functions: {
      generate_driver_code: {
        Args: {
          function_name: string;
          return_type: string;
          parameters: {
            parameterName: string;
            parameterType: string;
          }[];
          test_cases: {
            input: Record<string, any>;
            output: string;
            points: number;
            isHidden: boolean;
          }[];
        };
        Returns: {
          c_code: string;
          cpp_code: string;
        };
      };
    };
  };
};
