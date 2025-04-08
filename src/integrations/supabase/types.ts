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
          batch: string | null
          cheating_status: string
          email: string
          id: string
          marks_scored: number
          name: string
          prn: string
          quiz_id: string
          submitted_at: string
          total_marks: number
          year: string | null
        }
        Insert: {
          batch?: string | null
          cheating_status?: string
          email: string
          id?: string
          marks_scored: number
          name: string
          prn: string
          quiz_id: string
          submitted_at?: string
          total_marks: number
          year?: string | null
        }
        Update: {
          batch?: string | null
          cheating_status?: string
          email?: string
          id?: string
          marks_scored?: number
          name?: string
          prn?: string
          quiz_id?: string
          submitted_at?: string
          total_marks?: number
          year?: string | null
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
        Args: { quiz_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["easy", "medium", "hard"],
      parameter_type: [
        "int",
        "long",
        "float",
        "double",
        "boolean",
        "char",
        "string",
        "int[]",
        "long[]",
        "float[]",
        "double[]",
        "boolean[]",
        "char[]",
        "string[]",
      ],
      return_type: [
        "int",
        "long",
        "float",
        "double",
        "boolean",
        "char",
        "string",
        "void",
        "int[]",
        "long[]",
        "float[]",
        "double[]",
        "boolean[]",
        "char[]",
        "string[]",
      ],
    },
  },
} as const
