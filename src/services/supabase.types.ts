
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
      options: {
        Row: {
          display_order: number;
          id: string;
          is_correct: boolean;
          question_id: string;
          text: string;
        };
        Insert: {
          display_order: number;
          id?: string;
          is_correct?: boolean;
          question_id: string;
          text: string;
        };
      };
      questions: {
        Row: {
          display_order: number;
          id: string;
          image_url: string | null;
          marks_for_correct: number;
          marks_for_unattempted: number;
          marks_for_wrong: number;
          section_id: string;
          text: string;
        };
        Insert: {
          display_order: number;
          id?: string;
          image_url?: string | null;
          marks_for_correct?: number;
          marks_for_unattempted?: number;
          marks_for_wrong?: number;
          section_id: string;
          text: string;
        };
      };
      quiz_attempts: {
        Row: {
          attempted_at: string;
          id: string;
          prn: string;
          quiz_id: string;
        };
        Insert: {
          attempted_at?: string;
          id?: string;
          prn: string;
          quiz_id: string;
        };
      };
      quizzes: {
        Row: {
          code: string;
          created_at: string;
          created_by: string;
          duration: number;
          end_date_time: string;
          id: string;
          instructions: string | null;
          start_date_time: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by: string;
          duration: number;
          end_date_time: string;
          id?: string;
          instructions?: string | null;
          start_date_time: string;
          title: string;
          updated_at?: string;
        };
      };
      sections: {
        Row: {
          display_order: number;
          id: string;
          instructions: string | null;
          quiz_id: string;
          title: string;
        };
        Insert: {
          display_order: number;
          id?: string;
          instructions?: string | null;
          quiz_id: string;
          title: string;
        };
      };
      student_results: {
        Row: {
          cheating_status: string;
          division: string;
          email: string;
          id: string;
          marks_scored: number;
          name: string;
          prn: string;
          quiz_id: string;
          submitted_at: string;
          total_marks: number;
        };
        Insert: {
          cheating_status?: string;
          division: string;
          email: string;
          id?: string;
          marks_scored: number;
          name: string;
          prn: string;
          quiz_id: string;
          submitted_at?: string;
          total_marks: number;
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
      generate_quiz_results_pdf: {
        Args: {
          quiz_id: string;
        };
        Returns: string;
      };
    };
  };
};
