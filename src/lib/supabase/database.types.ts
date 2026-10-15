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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id: string
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          booking_horizon_days: number
          cancellation_min_hours: number
          id: boolean
          max_active_appointments_per_client: number
          min_advance_minutes: number
          slot_minutes: number
          timezone: string
          updated_at: string
        }
        Insert: {
          booking_horizon_days?: number
          cancellation_min_hours?: number
          id?: boolean
          max_active_appointments_per_client?: number
          min_advance_minutes?: number
          slot_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          booking_horizon_days?: number
          cancellation_min_hours?: number
          id?: boolean
          max_active_appointments_per_client?: number
          min_advance_minutes?: number
          slot_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          quantity?: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: number
          item_id: string
          performed_by: string | null
          quantity_after: number
          quantity_delta: number
          reason: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Insert: {
          created_at?: string
          id?: never
          item_id: string
          performed_by?: string | null
          quantity_after: number
          quantity_delta: number
          reason?: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Update: {
          created_at?: string
          id?: never
          item_id?: string
          performed_by?: string | null
          quantity_after?: number
          quantity_delta?: number
          reason?: string | null
          type?: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_low_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
    }
    Views: {
      inventory_low_stock: {
        Row: {
          id: string | null
          min_quantity: number | null
          name: string | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          id?: string | null
          min_quantity?: number | null
          name?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          id?: string | null
          min_quantity?: number | null
          name?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_unschedulable_appointments: {
        Args: never
        Returns: {
          appointment_id: string
          client_id: string
          ends_at: string
          reason: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      book_appointment: {
        Args: { p_notes?: string; p_starts_at: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_inventory_item: {
        Args: {
          p_initial_quantity?: number
          p_min_quantity?: number
          p_name: string
          p_unit: string
        }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_available_slots: {
        Args: { p_date: string }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      register_inventory_movement: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_reason?: string
          p_type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        Returns: {
          created_at: string
          id: number
          item_id: string
          performed_by: string | null
          quantity_after: number
          quantity_delta: number
          reason: string | null
          type: Database["public"]["Enums"]["inventory_movement_type"]
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_appointment_status: {
        Args: {
          p_appointment_id: string
          p_status: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: {
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      timemultirange: { Args: never; Returns: unknown }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      inventory_movement_type: "entry" | "exit" | "adjustment"
      user_role: "client" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      inventory_movement_type: ["entry", "exit", "adjustment"],
      user_role: ["client", "admin"],
    },
  },
} as const
