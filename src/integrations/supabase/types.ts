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
      documents: {
        Row: {
          doc_type: string | null
          file_url: string | null
          id: string
          provider_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          uploaded_at: string | null
          verification_status: string | null
        }
        Insert: {
          doc_type?: string | null
          file_url?: string | null
          id?: string
          provider_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uploaded_at?: string | null
          verification_status?: string | null
        }
        Update: {
          doc_type?: string | null
          file_url?: string | null
          id?: string
          provider_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uploaded_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          chamby_commission_amount: number
          created_at: string | null
          id: string
          job_id: string
          pdf_url: string | null
          provider_id: string
          provider_notes: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal_provider: number
          total_customer_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chamby_commission_amount?: number
          created_at?: string | null
          id?: string
          job_id: string
          pdf_url?: string | null
          provider_id: string
          provider_notes?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal_provider?: number
          total_customer_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chamby_commission_amount?: number
          created_at?: string | null
          id?: string
          job_id?: string
          pdf_url?: string | null
          provider_id?: string
          provider_notes?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal_provider?: number
          total_customer_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          amount_booking_fee: number | null
          amount_service_total: number | null
          assignment_deadline: string | null
          budget: string | null
          category: string
          client_confirmed_visit: boolean | null
          client_id: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          exact_time: string | null
          final_price: number | null
          id: string
          location: string | null
          original_scheduled_date: string | null
          photo_count: number | null
          photos: string[] | null
          problem: string | null
          provider_confirmed_visit: boolean | null
          provider_id: string | null
          provider_visited: boolean | null
          rate: number
          reschedule_requested_at: string | null
          reschedule_requested_date: string | null
          reschedule_response_deadline: string | null
          scheduled_at: string | null
          service_type: string | null
          status: string | null
          stripe_visit_payment_intent_id: string | null
          time_preference: string | null
          title: string
          total_amount: number | null
          updated_at: string | null
          urgent: boolean | null
          visit_confirmation_deadline: string | null
          visit_dispute_reason: string | null
          visit_dispute_status: string | null
          visit_fee_amount: number | null
          visit_fee_paid: boolean | null
        }
        Insert: {
          amount_booking_fee?: number | null
          amount_service_total?: number | null
          assignment_deadline?: string | null
          budget?: string | null
          category: string
          client_confirmed_visit?: boolean | null
          client_id: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          exact_time?: string | null
          final_price?: number | null
          id?: string
          location?: string | null
          original_scheduled_date?: string | null
          photo_count?: number | null
          photos?: string[] | null
          problem?: string | null
          provider_confirmed_visit?: boolean | null
          provider_id?: string | null
          provider_visited?: boolean | null
          rate: number
          reschedule_requested_at?: string | null
          reschedule_requested_date?: string | null
          reschedule_response_deadline?: string | null
          scheduled_at?: string | null
          service_type?: string | null
          status?: string | null
          stripe_visit_payment_intent_id?: string | null
          time_preference?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string | null
          urgent?: boolean | null
          visit_confirmation_deadline?: string | null
          visit_dispute_reason?: string | null
          visit_dispute_status?: string | null
          visit_fee_amount?: number | null
          visit_fee_paid?: boolean | null
        }
        Update: {
          amount_booking_fee?: number | null
          amount_service_total?: number | null
          assignment_deadline?: string | null
          budget?: string | null
          category?: string
          client_confirmed_visit?: boolean | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          exact_time?: string | null
          final_price?: number | null
          id?: string
          location?: string | null
          original_scheduled_date?: string | null
          photo_count?: number | null
          photos?: string[] | null
          problem?: string | null
          provider_confirmed_visit?: boolean | null
          provider_id?: string | null
          provider_visited?: boolean | null
          rate?: number
          reschedule_requested_at?: string | null
          reschedule_requested_date?: string | null
          reschedule_response_deadline?: string | null
          scheduled_at?: string | null
          service_type?: string | null
          status?: string | null
          stripe_visit_payment_intent_id?: string | null
          time_preference?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          urgent?: boolean | null
          visit_confirmation_deadline?: string | null
          visit_dispute_reason?: string | null
          visit_dispute_status?: string | null
          visit_fee_amount?: number | null
          visit_fee_paid?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_system_message: boolean
          job_id: string
          message_text: string
          read: boolean
          receiver_id: string
          sender_id: string
          system_event_type: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_system_message?: boolean
          job_id: string
          message_text: string
          read?: boolean
          receiver_id: string
          sender_id: string
          system_event_type?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_system_message?: boolean
          job_id?: string
          message_text?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          system_event_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_rate_limit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string
          phone_number: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address: string
          phone_number?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string
          phone_number?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          job_id: string
          metadata: Json | null
          provider_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          job_id: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          job_id?: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string | null
          provider_id: string
          status: string
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string | null
          provider_id: string
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_at?: string | null
          provider_id?: string
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["user_id"]
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
      photo_short_links: {
        Row: {
          clicks: number | null
          created_at: string | null
          full_url: string
          id: string
          short_code: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          full_url: string
          id?: string
          short_code: string
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          full_url?: string
          id?: string
          short_code?: string
        }
        Relationships: []
      }
      provider_details: {
        Row: {
          admin_notes: string | null
          background_check_status: string | null
          created_at: string | null
          face_photo_url: string | null
          id: string
          id_document_url: string | null
          ine_back_url: string | null
          ine_front_url: string | null
          provider_id: string | null
          selfie_url: string | null
          selfie_with_id_url: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          admin_notes?: string | null
          background_check_status?: string | null
          created_at?: string | null
          face_photo_url?: string | null
          id?: string
          id_document_url?: string | null
          ine_back_url?: string | null
          ine_front_url?: string | null
          provider_id?: string | null
          selfie_url?: string | null
          selfie_with_id_url?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          admin_notes?: string | null
          background_check_status?: string | null
          created_at?: string | null
          face_photo_url?: string | null
          id?: string
          id_document_url?: string | null
          ine_back_url?: string | null
          ine_front_url?: string | null
          provider_id?: string | null
          selfie_url?: string | null
          selfie_with_id_url?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          avatar_url: string | null
          business_email: string | null
          business_phone: string | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          display_name: string | null
          fcm_token: string | null
          hourly_rate: number | null
          id: string
          last_location_update: string | null
          onboarding_complete: boolean
          onboarding_step: string | null
          rating: number | null
          skills: string[] | null
          specialty: string | null
          stripe_account_id: string | null
          stripe_onboarding_status: string
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          zone_served: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_email?: string | null
          business_phone?: string | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          display_name?: string | null
          fcm_token?: string | null
          hourly_rate?: number | null
          id?: string
          last_location_update?: string | null
          onboarding_complete?: boolean
          onboarding_step?: string | null
          rating?: number | null
          skills?: string[] | null
          specialty?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_status?: string
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          zone_served?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_email?: string | null
          business_phone?: string | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          display_name?: string | null
          fcm_token?: string | null
          hourly_rate?: number | null
          id?: string
          last_location_update?: string | null
          onboarding_complete?: boolean
          onboarding_step?: string | null
          rating?: number | null
          skills?: string[] | null
          specialty?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_status?: string
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          zone_served?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
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
          job_id: string | null
          provider_id: string
          rating: number
          reviewer_role: string
          tags: string[] | null
          updated_at: string | null
          visible_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          provider_id: string
          rating: number
          reviewer_role?: string
          tags?: string[] | null
          updated_at?: string | null
          visible_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          provider_id?: string
          rating?: number
          reviewer_role?: string
          tags?: string[] | null
          updated_at?: string | null
          visible_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_locations: {
        Row: {
          address: string
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message_text: string
          provider_id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_text: string
          provider_id: string
          read?: boolean
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_text?: string
          provider_id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          amount: number
          created_at: string
          email: string
          expires_at: string
          id: string
          phone: string | null
          reason: string
          redeemed_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          phone?: string | null
          reason?: string
          redeemed_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          phone?: string | null
          reason?: string
          redeemed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_admin_stats: { Args: never; Returns: boolean }
      check_otp_rate_limit: { Args: { phone: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          _action: string
          _max_attempts?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      create_job_reminders: { Args: never; Returns: undefined }
      delete_user_account: { Args: { user_id: string }; Returns: undefined }
      generate_short_code: { Args: never; Returns: string }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_providers: number
          active_users: number
          bookings_today: number
          cancelled_jobs: number
          completed_jobs: number
          jobs_today: number
          total_jobs: number
          total_payments: number
        }[]
      }
      get_client_id_from_auth: { Args: never; Returns: string }
      get_client_id_from_user_id: {
        Args: { auth_user_id: string }
        Returns: string
      }
      get_provider_profile_id: {
        Args: { auth_user_id: string }
        Returns: string
      }
      get_public_provider_profiles: {
        Args: never
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
      get_top_providers: {
        Args: { limit_count?: number }
        Returns: {
          completed_jobs: number
          full_name: string
          rating: number
          total_earnings: number
          total_reviews: number
          user_id: string
        }[]
      }
      get_user_email: { Args: never; Returns: string }
      get_verified_providers: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          hourly_rate: number
          id: string
          rating: number
          skills: string[]
          specialty: string
          total_reviews: number
          user_id: string
          verified: boolean
          zone_served: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_provider: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "client" | "provider"
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
      app_role: ["admin", "client", "provider"],
    },
  },
} as const
