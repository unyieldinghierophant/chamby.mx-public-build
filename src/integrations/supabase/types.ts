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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string
          description: string | null
          duration_hours: number | null
          id: string
          payment_status: string | null
          scheduled_date: string
          service_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          tasker_id: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          payment_status?: string | null
          scheduled_date: string
          service_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          tasker_id: string
          title: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          payment_status?: string | null
          scheduled_date?: string
          service_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          tasker_id?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          age: number | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          role: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          doc_type: string | null
          file_url: string | null
          id: string
          uploaded_at: string | null
          verification_status: string | null
        }
        Insert: {
          client_id?: string | null
          doc_type?: string | null
          file_url?: string | null
          id?: string
          uploaded_at?: string | null
          verification_status?: string | null
        }
        Update: {
          client_id?: string | null
          doc_type?: string | null
          file_url?: string | null
          id?: string
          uploaded_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category: string
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          photos: string[] | null
          problem: string | null
          provider_id: string
          rate: number
          scheduled_at: string | null
          service_type: string | null
          status: string
          title: string
          updated_at: string
          urgent: boolean | null
          visit_fee_paid: boolean | null
        }
        Insert: {
          category: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          photos?: string[] | null
          problem?: string | null
          provider_id: string
          rate: number
          scheduled_at?: string | null
          service_type?: string | null
          status?: string
          title: string
          updated_at?: string
          urgent?: boolean | null
          visit_fee_paid?: boolean | null
        }
        Update: {
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          photos?: string[] | null
          problem?: string | null
          provider_id?: string
          rate?: number
          scheduled_at?: string | null
          service_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          urgent?: boolean | null
          visit_fee_paid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verification_otps: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone_number: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash: string
          phone_number: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          phone_number?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          face_photo_url: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_tasker: boolean | null
          phone: string | null
          rating: number | null
          skills: string[] | null
          specialty: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified: boolean | null
          zone_served: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          face_photo_url?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_tasker?: boolean | null
          phone?: string | null
          rating?: number | null
          skills?: string[] | null
          specialty?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified?: boolean | null
          zone_served?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          face_photo_url?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_tasker?: boolean | null
          phone?: string | null
          rating?: number | null
          skills?: string[] | null
          specialty?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified?: boolean | null
          zone_served?: string | null
        }
        Relationships: []
      }
      provider_invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          invoice_photo_url: string | null
          job_id: string | null
          provider_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_photo_url?: string | null
          job_id?: string | null
          provider_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_photo_url?: string | null
          job_id?: string | null
          provider_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          provider_id: string
          rating: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          provider_id: string
          rating: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          provider_id?: string
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          name: string
          price_from: number | null
          price_to: number | null
          tags: string[] | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          name: string
          price_from?: number | null
          price_to?: number | null
          tags?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          name?: string
          price_from?: number | null
          price_to?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_otp_rate_limit: {
        Args: { phone: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _action: string
          _max_attempts?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_client_id_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_provider_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          hourly_rate: number
          id: string
          rating: number
          skills: string[]
          total_reviews: number
          verification_status: string
        }[]
      }
      get_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
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
