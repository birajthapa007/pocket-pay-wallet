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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          card_number_encrypted: string
          cardholder_name: string
          created_at: string
          cvv_encrypted: string
          expiry_date: string
          id: string
          is_active: boolean
          is_frozen: boolean
          last_four: string
          type: Database["public"]["Enums"]["card_type"]
          wallet_id: string
        }
        Insert: {
          card_number_encrypted: string
          cardholder_name: string
          created_at?: string
          cvv_encrypted: string
          expiry_date: string
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          last_four: string
          type: Database["public"]["Enums"]["card_type"]
          wallet_id: string
        }
        Update: {
          card_number_encrypted?: string
          cardholder_name?: string
          created_at?: string
          cvv_encrypted?: string
          expiry_date?: string
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          last_four?: string
          type?: Database["public"]["Enums"]["card_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_transaction_id: string | null
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_transaction_id?: string | null
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_transaction_id?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      money_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          requested_from_wallet_id: string
          requester_wallet_id: string
          status: Database["public"]["Enums"]["request_status"]
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          requested_from_wallet_id: string
          requester_wallet_id: string
          status?: Database["public"]["Enums"]["request_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          requested_from_wallet_id?: string
          requester_wallet_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_requests_requested_from_wallet_id_fkey"
            columns: ["requested_from_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_requests_requester_wallet_id_fkey"
            columns: ["requester_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          action: string
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          metadata: Json | null
          phone: string | null
          verified_at: string | null
        }
        Insert: {
          action?: string
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          metadata?: Json | null
          phone?: string | null
          verified_at?: string | null
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          phone?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      risk_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          is_risky: boolean
          recipient_wallet_id: string | null
          risk_reason: string | null
          sender_wallet_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          is_risky?: boolean
          recipient_wallet_id?: string | null
          risk_reason?: string | null
          sender_wallet_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          is_risky?: boolean
          recipient_wallet_id?: string | null
          risk_reason?: string | null
          sender_wallet_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_recipient_wallet_id_fkey"
            columns: ["recipient_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_wallet_id_fkey"
            columns: ["sender_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atomic_credit_balance: {
        Args: {
          p_amount: number
          p_description: string
          p_transaction_id: string
          p_wallet_id: string
        }
        Returns: Json
      }
      atomic_debit_balance: {
        Args: {
          p_amount: number
          p_description: string
          p_transaction_id: string
          p_wallet_id: string
        }
        Returns: Json
      }
      atomic_transfer: {
        Args: {
          p_amount: number
          p_description: string
          p_recipient_wallet_id: string
          p_sender_wallet_id: string
          p_transaction_id: string
        }
        Returns: Json
      }
      get_pending_balance: { Args: { p_wallet_id: string }; Returns: number }
      get_user_wallet_id: { Args: { p_user_id: string }; Returns: string }
      get_wallet_balance: { Args: { p_wallet_id: string }; Returns: number }
      is_wallet_owner: {
        Args: { p_user_id: string; p_wallet_id: string }
        Returns: boolean
      }
    }
    Enums: {
      card_type: "virtual" | "physical"
      request_status: "pending" | "accepted" | "declined" | "cancelled"
      transaction_status:
        | "created"
        | "pending_confirmation"
        | "completed"
        | "blocked"
        | "failed"
      transaction_type:
        | "send"
        | "receive"
        | "deposit"
        | "withdrawal"
        | "request"
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
    Enums: {
      card_type: ["virtual", "physical"],
      request_status: ["pending", "accepted", "declined", "cancelled"],
      transaction_status: [
        "created",
        "pending_confirmation",
        "completed",
        "blocked",
        "failed",
      ],
      transaction_type: ["send", "receive", "deposit", "withdrawal", "request"],
    },
  },
} as const
