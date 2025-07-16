export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_approvals: {
        Row: {
          amount: number | null
          approval_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          subscription_duration: number | null
          subscription_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          approval_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          subscription_duration?: number | null
          subscription_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          approval_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          subscription_duration?: number | null
          subscription_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          boost_expires_at: string | null
          brand: string | null
          category: string
          condition: string | null
          created_at: string
          currency: string
          cv_url: string | null
          description: string
          experience: string | null
          id: string
          image_urls: string[] | null
          is_boosted: boolean | null
          is_highlighted: boolean | null
          job_title: string | null
          model: string | null
          phone: string
          price: number
          region: string
          salary: string | null
          shop_name: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          boost_expires_at?: string | null
          brand?: string | null
          category: string
          condition?: string | null
          created_at?: string
          currency?: string
          cv_url?: string | null
          description: string
          experience?: string | null
          id?: string
          image_urls?: string[] | null
          is_boosted?: boolean | null
          is_highlighted?: boolean | null
          job_title?: string | null
          model?: string | null
          phone: string
          price: number
          region: string
          salary?: string | null
          shop_name: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          boost_expires_at?: string | null
          brand?: string | null
          category?: string
          condition?: string | null
          created_at?: string
          currency?: string
          cv_url?: string | null
          description?: string
          experience?: string | null
          id?: string
          image_urls?: string[] | null
          is_boosted?: boolean | null
          is_highlighted?: boolean | null
          job_title?: string | null
          model?: string | null
          phone?: string
          price?: number
          region?: string
          salary?: string | null
          shop_name?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          ad_id: string
          comment: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          comment: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          comment?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_approvals: {
        Row: {
          ad_id: string | null
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_confirmed_by_user: boolean | null
          payment_phone: string
          payment_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_confirmed_by_user?: boolean | null
          payment_phone: string
          payment_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string | null
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_confirmed_by_user?: boolean | null
          payment_phone?: string
          payment_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ad_count: number | null
          created_at: string
          email: string
          has_shop: boolean | null
          id: string
          phone: string | null
          shop_name: string | null
          shop_region: string | null
          shop_setup_completed: boolean | null
          subscription_plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_count?: number | null
          created_at?: string
          email: string
          has_shop?: boolean | null
          id?: string
          phone?: string | null
          shop_name?: string | null
          shop_region?: string | null
          shop_setup_completed?: boolean | null
          subscription_plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_count?: number | null
          created_at?: string
          email?: string
          has_shop?: boolean | null
          id?: string
          phone?: string | null
          shop_name?: string | null
          shop_region?: string | null
          shop_setup_completed?: boolean | null
          subscription_plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_expiry: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
