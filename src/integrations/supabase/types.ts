export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          created_at: string
          currency: string | null
          id: string
          initial_balance: number
          name: string
          type: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          initial_balance?: number
          name: string
          type: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          initial_balance?: number
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      asset_history: {
        Row: {
          asset_id: string
          created_at: string | null
          date: string
          id: string
          user_id: string
          value: number
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          date: string
          id?: string
          user_id: string
          value: number
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          account_id: string | null
          asset_type_id: string | null
          created_at: string | null
          currency: string | null
          current_value: number
          id: string
          initial_value: number
          name: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_type_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_value?: number
          id?: string
          initial_value?: number
          name: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_type_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_value?: number
          id?: string
          initial_value?: number
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_asset_type_id_fkey"
            columns: ["asset_type_id"]
            isOneToOne: false
            referencedRelation: "asset_types"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          from_currency: string
          id?: string
          rate: number
          to_currency: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_entries: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          id: string
          is_adjustment: boolean | null
          sub_category_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          description?: string | null
          id?: string
          is_adjustment?: boolean | null
          sub_category_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_adjustment?: boolean | null
          sub_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "expense_sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_sub_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_vouchers: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_vouchers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      income_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string
          currency: string | null
          date: string
          description: string | null
          id: string
          is_adjustment: boolean | null
          is_recurring: boolean
          sub_category_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_adjustment?: boolean | null
          is_recurring?: boolean
          sub_category_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_adjustment?: boolean | null
          is_recurring?: boolean
          sub_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "income_sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sub_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          account_id: string | null
          amount: number
          auto_log_enabled: boolean | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          day_of_month: number | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          start_date: string
          sub_category_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_log_enabled?: boolean | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_month?: number | null
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          start_date: string
          sub_category_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_log_enabled?: boolean | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          day_of_month?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          start_date?: string
          sub_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "expense_sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_incomes: {
        Row: {
          account_id: string | null
          amount: number
          auto_log_enabled: boolean
          category_id: string | null
          created_at: string
          currency: string | null
          day_of_month: number | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          start_date: string
          sub_category_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_log_enabled?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string | null
          day_of_month?: number | null
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          start_date?: string
          sub_category_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_log_enabled?: boolean
          category_id?: string | null
          created_at?: string
          currency?: string | null
          day_of_month?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          start_date?: string
          sub_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_incomes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_incomes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_incomes_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "income_sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
