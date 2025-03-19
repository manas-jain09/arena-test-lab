export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      coding_questions: {
        Row: {
          constraints: string | null
          created_at: string
          created_by: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          example: string | null
          function_name: string
          id: string
          quiz_id: string | null
          return_type: Database["public"]["Enums"]["return_type"]
          title: string
          updated_at: string
        }
        Insert: {
          constraints?: string | null
          created_at?: string
          created_by: string
          description: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          example?: string | null
          function_name: string
          id?: string
          quiz_id?: string | null
          return_type: Database["public"]["Enums"]["return_type"]
          title: string
          updated_at?: string
        }
        Update: {
          constraints?: string | null
          created_at?: string
          created_by?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          example?: string | null
          function_name?: string
          id?: string
          quiz_id?: string | null
          return_type?: Database["public"]["Enums"]["return_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_code: {
        Row: {
          c_code: string
          coding_question_id: string | null
          cpp_code: string
          id: string
        }
        Insert: {
          c_code: string
          coding_question_id?: string | null
          cpp_code: string
          id?: string
        }
        Update: {
          c_code?: string
          coding_question_id?: string | null
          cpp_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_code_coding_question_id_fkey"
            columns: ["coding_question_id"]
            isOneToOne: false
            referencedRelation: "coding_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      function_parameters: {
        Row: {
          coding_question_id: string | null
          display_order: number
          id: string
          parameter_name: string
          parameter_type: Database["public"]["Enums"]["parameter_type"]
        }
        Insert: {
          coding_question_id?: string | null
          display_order: number
          id?: string
          parameter_name: string
          parameter_type: Database["public"]["Enums"]["parameter_type"]
        }
        Update: {
          coding_question_id?: string | null
          display_order?: number
          id?: string
          parameter_name?: string
          parameter_type?: Database["public"]["Enums"]["parameter_type"]
        }
        Relationships: [
          {
            foreignKeyName: "function_parameters_coding_question_id_fkey"
            columns: ["coding_question_id"]
            isOneToOne: false
            referencedRelation: "coding_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          display_order: number
          id: string
          is_correct: boolean
          question_id: string
          text: string
        }
        Insert: {
          display_order: number
          id?: string
          is_correct?: boolean
          question_id: string
          text: string
        }
        Update: {
          display_order?: number
          id?: string
          is_correct?: boolean
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          display_order: number
          id: string
          image_url: string | null
          marks_for_correct: number
          marks_for_unattempted: number
          marks_for_wrong: number
          section_id: string
          text: string
        }
        Insert: {
          display_order: number
          id?: string
          image_url?: string | null
          marks_for_correct?: number
          marks_for_unattempted?: number
          marks_for_wrong?: number
          section_id: string
          text: string
        }
        Update: {
          display_order?: number
          id?: string
          image_url?: string | null
          marks_for_correct?: number
          marks_for_unattempted?: number
          marks_for_wrong?: number
          section_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          id: string
          prn: string
          quiz_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          prn: string
          quiz_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          prn?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          duration: number
          end_date_time: string
          id: string
          instructions: string | null
          start_date_time: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          duration: number
          end_date_time: string
          id?: string
          instructions?: string | null
          start_date_time: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          duration?: number
          end_date_time?: string
          id?: string
          instructions?: string | null
          start_date_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          display_order: number
          id: string
          instructions: string | null
          quiz_id: string
          title: string
        }
        Insert: {
          display_order: number
          id?: string
          instructions?: string | null
          quiz_id: string
          title: string
        }
        Update: {
          display_order?: number
          id?: string
          instructions?: string | null
          quiz_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_results: {
        Row: {
          cheating_status: string
          division: string
          email: string
          id: string
          marks_scored: number
          name: string
          prn: string
          quiz_id: string
          submitted_at: string
          total_marks: number
        }
        Insert: {
          cheating_status?: string
          division: string
          email: string
          id?: string
          marks_scored: number
          name: string
          prn: string
          quiz_id: string
          submitted_at?: string
          total_marks: number
        }
        Update: {
          cheating_status?: string
          division?: string
          email?: string
          id?: string
          marks_scored?: number
          name?: string
          prn?: string
          quiz_id?: string
          submitted_at?: string
          total_marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          coding_question_id: string | null
          display_order: number
          id: string
          input: string
          is_hidden: boolean
          output: string
          points: number
        }
        Insert: {
          coding_question_id?: string | null
          display_order: number
          id?: string
          input: string
          is_hidden?: boolean
          output: string
          points?: number
        }
        Update: {
          coding_question_id?: string | null
          display_order?: number
          id?: string
          input?: string
          is_hidden?: boolean
          output?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_coding_question_id_fkey"
            columns: ["coding_question_id"]
            isOneToOne: false
            referencedRelation: "coding_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_driver_code: {
        Args: {
          function_name: string
          return_type: string
          parameters: Json
          test_cases: Json
        }
        Returns: Json
      }
      generate_quiz_results_pdf: {
        Args: {
          quiz_id: string
        }
        Returns: string
      }
    }
    Enums: {
      difficulty_level: "easy" | "medium" | "hard"
      parameter_type:
        | "int"
        | "long"
        | "float"
        | "double"
        | "boolean"
        | "char"
        | "string"
        | "int[]"
        | "long[]"
        | "float[]"
        | "double[]"
        | "boolean[]"
        | "char[]"
        | "string[]"
      return_type:
        | "int"
        | "long"
        | "float"
        | "double"
        | "boolean"
        | "char"
        | "string"
        | "void"
        | "int[]"
        | "long[]"
        | "float[]"
        | "double[]"
        | "boolean[]"
        | "char[]"
        | "string[]"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
