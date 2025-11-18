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
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          permissions: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      booking_reschedules: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          original_date: string
          provider_response: string | null
          reason: string | null
          requested_by: string
          requested_date: string
          responded_at: string | null
          status: string | null
          suggested_date: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          original_date: string
          provider_response?: string | null
          reason?: string | null
          requested_by: string
          requested_date: string
          responded_at?: string | null
          status?: string | null
          suggested_date?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          original_date?: string
          provider_response?: string | null
          reason?: string | null
          requested_by?: string
          requested_date?: string
          responded_at?: string | null
          status?: string | null
          suggested_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reschedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string
          description: string | null
          duration_hours: number | null
          id: string
          original_scheduled_date: string | null
          payment_status: string | null
          reschedule_requested_at: string | null
          reschedule_requested_date: string | null
          reschedule_response_deadline: string | null
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
          original_scheduled_date?: string | null
          payment_status?: string | null
          reschedule_requested_at?: string | null
          reschedule_requested_date?: string | null
          reschedule_response_deadline?: string | null
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
          original_scheduled_date?: string | null
          payment_status?: string | null
          reschedule_requested_at?: string | null
          reschedule_requested_date?: string | null
          reschedule_response_deadline?: string | null
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
        }
        Insert: {
          address?: string | null
          age?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
        }
        Update: {
          address?: string | null
          age?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
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
      job_notifications: {
        Row: {
          id: string
          job_id: string | null
          provider_id: string | null
          seen_at: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          provider_id?: string | null
          seen_at?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          provider_id?: string | null
          seen_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_requests: {
        Row: {
          budget: string | null
          created_at: string
          date: string | null
          details: string | null
          exact_time: string | null
          id: string
          invoice_due_date: string | null
          location: string | null
          photo_count: number | null
          service: string
          stripe_invoice_id: string | null
          stripe_invoice_pdf: string | null
          stripe_invoice_url: string | null
          time_preference: string | null
          user_id: string | null
        }
        Insert: {
          budget?: string | null
          created_at?: string
          date?: string | null
          details?: string | null
          exact_time?: string | null
          id?: string
          invoice_due_date?: string | null
          location?: string | null
          photo_count?: number | null
          service: string
          stripe_invoice_id?: string | null
          stripe_invoice_pdf?: string | null
          stripe_invoice_url?: string | null
          time_preference?: string | null
          user_id?: string | null
        }
        Update: {
          budget?: string | null
          created_at?: string
          date?: string | null
          details?: string | null
          exact_time?: string | null
          id?: string
          invoice_due_date?: string | null
          location?: string | null
          photo_count?: number | null
          service?: string
          stripe_invoice_id?: string | null
          stripe_invoice_pdf?: string | null
          stripe_invoice_url?: string | null
          time_preference?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      job_tracking: {
        Row: {
          created_at: string
          id: string
          job_id: string
          latitude: number
          longitude: number
          provider_id: string
          route_polyline: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          latitude: number
          longitude: number
          provider_id: string
          route_polyline?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          latitude?: number
          longitude?: number
          provider_id?: string
          route_polyline?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tracking_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_visits: {
        Row: {
          created_at: string
          evidence_photos: string[] | null
          id: string
          job_id: string
          notes: string | null
          scheduled_date: string
          status: string
          updated_at: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          evidence_photos?: string[] | null
          id?: string
          job_id: string
          notes?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          evidence_photos?: string[] | null
          id?: string
          job_id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_visits_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          amount_booking_fee: number | null
          amount_service_total: number | null
          category: string
          client_id: string | null
          created_at: string
          description: string | null
          escrow_captured: boolean | null
          escrow_refunded: boolean | null
          id: string
          invoice_due_date: string | null
          location: string | null
          payment_status: string | null
          photos: string[] | null
          problem: string | null
          provider_id: string | null
          provider_visited: boolean | null
          rate: number
          scheduled_at: string | null
          service_type: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_invoice_pdf: string | null
          stripe_invoice_url: string | null
          stripe_payment_intent_id: string | null
          title: string
          updated_at: string
          urgent: boolean | null
          visit_fee_paid: boolean | null
        }
        Insert: {
          amount_booking_fee?: number | null
          amount_service_total?: number | null
          category: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          escrow_captured?: boolean | null
          escrow_refunded?: boolean | null
          id?: string
          invoice_due_date?: string | null
          location?: string | null
          payment_status?: string | null
          photos?: string[] | null
          problem?: string | null
          provider_id?: string | null
          provider_visited?: boolean | null
          rate: number
          scheduled_at?: string | null
          service_type?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_pdf?: string | null
          stripe_invoice_url?: string | null
          stripe_payment_intent_id?: string | null
          title: string
          updated_at?: string
          urgent?: boolean | null
          visit_fee_paid?: boolean | null
        }
        Update: {
          amount_booking_fee?: number | null
          amount_service_total?: number | null
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          escrow_captured?: boolean | null
          escrow_refunded?: boolean | null
          id?: string
          invoice_due_date?: string | null
          location?: string | null
          payment_status?: string | null
          photos?: string[] | null
          problem?: string | null
          provider_id?: string | null
          provider_visited?: boolean | null
          rate?: number
          scheduled_at?: string | null
          service_type?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_pdf?: string | null
          stripe_invoice_url?: string | null
          stripe_payment_intent_id?: string | null
          title?: string
          updated_at?: string
          urgent?: boolean | null
          visit_fee_paid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          job_id: string
          message_text: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          job_id: string
          message_text: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          job_id?: string
          message_text?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          id: string
          job_id: string | null
          payment_method: string | null
          provider_id: string
          released_at: string | null
          status: string
          transaction_id: string | null
          type: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          job_id?: string | null
          payment_method?: string | null
          provider_id: string
          released_at?: string | null
          status?: string
          transaction_id?: string | null
          type?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          job_id?: string | null
          payment_method?: string | null
          provider_id?: string
          released_at?: string | null
          status?: string
          transaction_id?: string | null
          type?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          job_request_id: string | null
          short_code: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          full_url: string
          id?: string
          job_request_id?: string | null
          short_code: string
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          full_url?: string
          id?: string
          job_request_id?: string | null
          short_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_short_links_job_request_id_fkey"
            columns: ["job_request_id"]
            isOneToOne: false
            referencedRelation: "job_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          face_photo_url: string | null
          fcm_token: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_tasker: boolean | null
          payment_schedule: string | null
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
          fcm_token?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_tasker?: boolean | null
          payment_schedule?: string | null
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
          fcm_token?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_tasker?: boolean | null
          payment_schedule?: string | null
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
      provider_availability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_available: boolean
          provider_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_available?: boolean
          provider_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          provider_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      provider_payment_methods: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          clabe: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          clabe?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          clabe?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_payment_methods_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      service_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          service_date: string
          service_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          service_date: string
          service_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          service_date?: string
          service_type?: string
          user_id?: string
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
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          active_providers: number | null
          active_users: number | null
          bookings_today: number | null
          cancelled_jobs: number | null
          completed_jobs: number | null
          jobs_today: number | null
          total_jobs: number | null
          total_payments: number | null
        }
        Relationships: []
      }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
