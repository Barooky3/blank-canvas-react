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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_live_counter: {
        Row: {
          ad_spend: number
          contributing_orders: Json
          gross: number
          id: number
          net: number
          order_count: number
          reset_at: string
          reset_history: Json
          updated_at: string
        }
        Insert: {
          ad_spend?: number
          contributing_orders?: Json
          gross?: number
          id?: number
          net?: number
          order_count?: number
          reset_at?: string
          reset_history?: Json
          updated_at?: string
        }
        Update: {
          ad_spend?: number
          contributing_orders?: Json
          gross?: number
          id?: number
          net?: number
          order_count?: number
          reset_at?: string
          reset_history?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_personal_tallies: {
        Row: {
          adjustments: Json
          admin_email: string
          id: string
          reset_at: string
          updated_at: string
        }
        Insert: {
          adjustments?: Json
          admin_email: string
          id?: string
          reset_at?: string
          updated_at?: string
        }
        Update: {
          adjustments?: Json
          admin_email?: string
          id?: string
          reset_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bancontact_live_counter: {
        Row: {
          ad_spend: number
          contributing_orders: Json
          gross: number
          id: number
          net: number
          order_count: number
          reset_at: string
          reset_history: Json
          updated_at: string
        }
        Insert: {
          ad_spend?: number
          contributing_orders?: Json
          gross?: number
          id?: number
          net?: number
          order_count?: number
          reset_at?: string
          reset_history?: Json
          updated_at?: string
        }
        Update: {
          ad_spend?: number
          contributing_orders?: Json
          gross?: number
          id?: number
          net?: number
          order_count?: number
          reset_at?: string
          reset_history?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bancontact_orders: {
        Row: {
          approval_token: string
          approved_at: string | null
          country: string | null
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          order_items: Json
          rejected_at: string | null
          source: string
          split_first_at: string | null
          split_second_at: string | null
          split_second_due_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approval_token: string
          approved_at?: string | null
          country?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          order_items?: Json
          rejected_at?: string | null
          source?: string
          split_first_at?: string | null
          split_second_at?: string | null
          split_second_due_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          approval_token?: string
          approved_at?: string | null
          country?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          order_items?: Json
          rejected_at?: string | null
          source?: string
          split_first_at?: string | null
          split_second_at?: string | null
          split_second_due_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      bancontact_timer_state: {
        Row: {
          enabled: boolean
          id: number
          last_send_at: string | null
          mode: string
          next_send_at: string | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: number
          last_send_at?: string | null
          mode?: string
          next_send_at?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: number
          last_send_at?: string | null
          mode?: string
          next_send_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_by: string
          created_at: string
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          banned_by: string
          created_at?: string
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          banned_by?: string
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      email_otps: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          approval_token: string | null
          checkout_reference: string
          created_at: string
          customer_email: string
          customer_name: string
          discount_code: string | null
          discount_percent: number | null
          email_sent: boolean
          first_visit_at: string | null
          gift_card_code: string | null
          id: string
          order_items: Json
          order_number: number | null
          proof_url: string | null
          rejection_notes: string | null
          rejection_seen: boolean
          shipping_address: Json | null
          status: string
          sumup_checkout_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approval_token?: string | null
          checkout_reference: string
          created_at?: string
          customer_email: string
          customer_name: string
          discount_code?: string | null
          discount_percent?: number | null
          email_sent?: boolean
          first_visit_at?: string | null
          gift_card_code?: string | null
          id?: string
          order_items: Json
          order_number?: number | null
          proof_url?: string | null
          rejection_notes?: string | null
          rejection_seen?: boolean
          shipping_address?: Json | null
          status?: string
          sumup_checkout_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          approval_token?: string | null
          checkout_reference?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          discount_code?: string | null
          discount_percent?: number | null
          email_sent?: boolean
          first_visit_at?: string | null
          gift_card_code?: string | null
          id?: string
          order_items?: Json
          order_number?: number | null
          proof_url?: string | null
          rejection_notes?: string | null
          rejection_seen?: boolean
          shipping_address?: Json | null
          status?: string
          sumup_checkout_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          choice: string
          created_at: string
          id: string
          poll_id: string
          voter_fingerprint: string
        }
        Insert: {
          choice: string
          created_at?: string
          id?: string
          poll_id: string
          voter_fingerprint: string
        }
        Update: {
          choice?: string
          created_at?: string
          id?: string
          poll_id?: string
          voter_fingerprint?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          created_at: string
          gender_tendency: number
          id: string
          longevity: number
          product_id: string
          season: number
          uniqueness: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gender_tendency?: number
          id?: string
          longevity?: number
          product_id: string
          season?: number
          uniqueness?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gender_tendency?: number
          id?: string
          longevity?: number
          product_id?: string
          season?: number
          uniqueness?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_description_overrides: {
        Row: {
          description: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          description: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          description?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_name_overrides: {
        Row: {
          id: string
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_padding_overrides: {
        Row: {
          id: string
          padding_bottom: number
          padding_left: number
          padding_right: number
          padding_top: number
          product_id: string
          scale: number
          updated_at: string
        }
        Insert: {
          id?: string
          padding_bottom?: number
          padding_left?: number
          padding_right?: number
          padding_top?: number
          product_id: string
          scale?: number
          updated_at?: string
        }
        Update: {
          id?: string
          padding_bottom?: number
          padding_left?: number
          padding_right?: number
          padding_top?: number
          product_id?: string
          scale?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_price_overrides: {
        Row: {
          base_price: number | null
          id: string
          original_price: number | null
          product_id: string
          updated_at: string
          variants: Json | null
        }
        Insert: {
          base_price?: number | null
          id?: string
          original_price?: number | null
          product_id: string
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          base_price?: number | null
          id?: string
          original_price?: number | null
          product_id?: string
          updated_at?: string
          variants?: Json | null
        }
        Relationships: []
      }
      product_stock_overrides: {
        Row: {
          created_at: string
          in_stock: boolean | null
          product_id: string
          updated_at: string
          variants: Json | null
        }
        Insert: {
          created_at?: string
          in_stock?: boolean | null
          product_id: string
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          created_at?: string
          in_stock?: boolean | null
          product_id?: string
          updated_at?: string
          variants?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_order: {
        Row: {
          hidden_seeds: Json
          id: number
          order_ids: Json
          seed_overrides: Json
          updated_at: string
        }
        Insert: {
          hidden_seeds?: Json
          id?: number
          order_ids?: Json
          seed_overrides?: Json
          updated_at?: string
        }
        Update: {
          hidden_seeds?: Json
          id?: number
          order_ids?: Json
          seed_overrides?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          images: string[]
          is_admin_added: boolean
          rating: number
          status: string
          text: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          images?: string[]
          is_admin_added?: boolean
          rating: number
          status?: string
          text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          images?: string[]
          is_admin_added?: boolean
          rating?: number
          status?: string
          text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tracking_lookups: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_hint: string | null
          matched: boolean
          order_number: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_hint?: string | null
          matched?: boolean
          order_number: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_hint?: string | null
          matched?: boolean
          order_number?: number
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          cart_items: Json | null
          cart_total: number | null
          city: string | null
          country: string | null
          created_at: string
          current_page: string
          device_type: string | null
          id: string
          is_in_checkout: boolean | null
          last_seen_at: string
          os: string | null
          pages_viewed: Json | null
          referrer: string | null
          region: string | null
          screen_width: number | null
          session_id: string
          user_email: string | null
        }
        Insert: {
          browser?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_page?: string
          device_type?: string | null
          id?: string
          is_in_checkout?: boolean | null
          last_seen_at?: string
          os?: string | null
          pages_viewed?: Json | null
          referrer?: string | null
          region?: string | null
          screen_width?: number | null
          session_id: string
          user_email?: string | null
        }
        Update: {
          browser?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_page?: string
          device_type?: string | null
          id?: string
          is_in_checkout?: boolean | null
          last_seen_at?: string
          os?: string | null
          pages_viewed?: Json | null
          referrer?: string | null
          region?: string | null
          screen_width?: number | null
          session_id?: string
          user_email?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_live_counter_calculated_values: {
        Args: { _reset_at: string }
        Returns: {
          contributing_orders: Json
          gross: number
          order_count: number
        }[]
      }
      bancontact_counter_calculated_values: {
        Args: { _reset_at: string }
        Returns: {
          contributing_orders: Json
          gross: number
          order_count: number
        }[]
      }
      get_poll_counts: {
        Args: { _poll_id: string }
        Returns: {
          choice: string
          vote_count: number
        }[]
      }
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
