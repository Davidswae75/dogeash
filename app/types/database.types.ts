// The database's shape, for type-checked Supabase queries. Written by hand to match
// the files in supabase/migrations/, in the format `supabase gen types` produces;
// once the Supabase CLI is linked, `npm run db:types` regenerates it. Keep it in step with every migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Timestamps = { created_at: string, updated_at: string }

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          city: string | null
          property: Database['public']['Enums']['property_type'] | null
          has_children: boolean | null
          has_other_pets: boolean | null
          experience: Database['public']['Enums']['handler_experience'] | null
          notify_email: boolean
          notify_sms: boolean
          notify_whatsapp: boolean
        } & Timestamps
        Insert: never
        Update: {
          full_name?: string
          phone?: string | null
          city?: string | null
          property?: Database['public']['Enums']['property_type'] | null
          has_children?: boolean | null
          has_other_pets?: boolean | null
          experience?: Database['public']['Enums']['handler_experience'] | null
          notify_email?: boolean
          notify_sms?: boolean
          notify_whatsapp?: boolean
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          public_id: string
          slug: string
          name: string
          initials: string
          tagline: string
          city: string
          area: string
          state: string
          founded: number | null
          status: Database['public']['Enums']['store_status']
          rating: number
          reviews_count: number
          details: Json
          banner_path: string | null
          logo_path: string | null
          visit_days: number[]
          visit_slots: string[]
          home_visits: boolean
          visits_paused: boolean
          pause_note: string
          status_note: string
          status_changed_at: string | null
          created_by: string | null
        } & Timestamps
        Insert: {
          public_id: string
          slug: string
          name: string
          city: string
          initials?: string
          tagline?: string
          area?: string
          state?: string
          founded?: number | null
          details?: Json
        }
        Update: { name?: string, initials?: string, tagline?: string, city?: string, area?: string, state?: string, founded?: number | null, details?: Json, banner_path?: string | null, logo_path?: string | null, visit_days?: number[], visit_slots?: string[], home_visits?: boolean, visits_paused?: boolean, pause_note?: string }
        Relationships: []
      }
      store_members: {
        Row: { store_id: string, user_id: string, role: Database['public']['Enums']['store_role'], created_at: string }
        Insert: { store_id: string, user_id: string, role: Database['public']['Enums']['store_role'] }
        Update: { role?: Database['public']['Enums']['store_role'] }
        Relationships: [
          { foreignKeyName: 'store_members_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      dogs: {
        Row: {
          id: string
          file_no: string
          store_id: string
          name: string
          breed: string
          sex: Database['public']['Enums']['dog_sex']
          city: string
          age: string
          weight_kg: number
          hips: string
          level: number
          price_naira: number
          status: Database['public']['Enums']['dog_status']
          photo_path: string | null
          gallery_paths: string[]
          videos: Json
          admin_note: string
          property: Database['public']['Enums']['property_type'][]
          safe_with_children: boolean
          file: Json | null
        } & Timestamps
        Insert: {
          file_no?: string // assigned by the database
          store_id: string
          name: string
          breed: string
          sex: Database['public']['Enums']['dog_sex']
          city: string
          age: string
          weight_kg: number
          level: number
          price_naira: number
          hips?: string
          status?: Database['public']['Enums']['dog_status']
          photo_path?: string | null
          gallery_paths?: string[]
          videos?: Json
          property?: Database['public']['Enums']['property_type'][]
          safe_with_children?: boolean
          file?: Json | null
        }
        Update: Partial<Omit<Database['public']['Tables']['dogs']['Insert'], 'file_no' | 'store_id'>>
        Relationships: [
          { foreignKeyName: 'dogs_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      conversations: {
        Row: {
          id: string
          store_id: string
          buyer_id: string
          dog_id: string | null
          buyer_name: string
          last_message_at: string
          last_message_preview: string
          last_sender: Database['public']['Enums']['message_role'] | null
          buyer_read_at: string
          store_read_at: string | null
          created_at: string
        }
        Insert: { store_id: string, dog_id?: string | null }
        Update: never
        Relationships: [
          { foreignKeyName: 'conversations_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
          { foreignKeyName: 'conversations_dog_id_fkey', columns: ['dog_id'], isOneToOne: false, referencedRelation: 'dogs', referencedColumns: ['id'] },
        ]
      }
      messages: {
        Row: { id: string, conversation_id: string, sender_id: string | null, sender_role: Database['public']['Enums']['message_role'], body: string, created_at: string }
        Insert: { conversation_id: string, sender_role: Database['public']['Enums']['message_role'], body: string }
        Update: never
        Relationships: [
          { foreignKeyName: 'messages_conversation_id_fkey', columns: ['conversation_id'], isOneToOne: false, referencedRelation: 'conversations', referencedColumns: ['id'] },
        ]
      }
      visits: {
        Row: {
          id: string
          store_id: string
          buyer_id: string
          buyer_name: string
          buyer_phone: string | null
          dog_ids: string[]
          service: string
          day: string
          slot: string
          place: Database['public']['Enums']['visit_place']
          note: string | null
          status: Database['public']['Enums']['visit_status']
          store_note: string | null
        } & Timestamps
        Insert: { store_id: string, dog_ids?: string[], service: string, day: string, slot: string, place?: Database['public']['Enums']['visit_place'], note?: string | null }
        Update: { status?: Database['public']['Enums']['visit_status'], store_note?: string | null }
        Relationships: [
          { foreignKeyName: 'visits_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      staff: {
        Row: { user_id: string, role: Database['public']['Enums']['staff_role'], note: string, created_at: string }
        Insert: never
        Update: never
        Relationships: []
      }
      admin_audit: {
        Row: { id: number, actor_id: string | null, actor_name: string, action: string, target_type: string, target_id: string, detail: Json, created_at: string }
        Insert: never
        Update: never
        Relationships: []
      }
      care_providers: {
        Row: { id: string, public_id: string, slug: string, name: string, person: string | null, type: Database['public']['Enums']['care_type'], city: string, areas: string, home_visits: boolean, verified: boolean, credential: string, rating: number, reviews_count: number, price_from: number } & Timestamps
        Insert: never
        Update: never
        Relationships: []
      }
      store_care_links: {
        Row: { store_id: string, provider_id: string, relationship: string, created_at: string }
        Insert: { store_id: string, provider_id: string, relationship: string }
        Update: { relationship?: string }
        Relationships: [
          { foreignKeyName: 'store_care_links_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
          { foreignKeyName: 'store_care_links_provider_id_fkey', columns: ['provider_id'], isOneToOne: false, referencedRelation: 'care_providers', referencedColumns: ['id'] },
        ]
      }
      store_applications: {
        Row: { store_id: string, address: string, directions: string, contact_phone: string, preferred_days: string[], cac_registered: boolean, id_doc_path: string | null, cac_doc_path: string | null, address_doc_path: string | null, note: string, submitted_at: string | null, updated_at: string }
        Insert: { store_id: string, address?: string, directions?: string, contact_phone?: string, preferred_days?: string[], cac_registered?: boolean, id_doc_path?: string | null, cac_doc_path?: string | null, address_doc_path?: string | null, note?: string }
        Update: { address?: string, directions?: string, contact_phone?: string, preferred_days?: string[], cac_registered?: boolean, id_doc_path?: string | null, cac_doc_path?: string | null, address_doc_path?: string | null, note?: string }
        Relationships: [
          { foreignKeyName: 'store_applications_store_id_fkey', columns: ['store_id'], isOneToOne: true, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      store_reviews: {
        Row: { id: string, store_id: string, author_id: string, author_name: string, author_city: string, visit_id: string | null, rating: number, body: string, store_reply: string | null, replied_at: string | null } & Timestamps
        Insert: { store_id: string, rating: number, body: string }
        Update: { rating?: number, body?: string, store_reply?: string | null }
        Relationships: [
          { foreignKeyName: 'store_reviews_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      store_invites: {
        Row: { id: string, store_id: string, email: string, role: Database['public']['Enums']['store_role'], invited_by: string | null, created_at: string }
        Insert: { store_id: string, email: string, role: Database['public']['Enums']['store_role'] }
        Update: never
        Relationships: [
          { foreignKeyName: 'store_invites_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      notifications: {
        Row: { id: string, user_id: string, kind: Database['public']['Enums']['notification_kind'], title: string, body: string, link: string, topic: string | null, read_at: string | null, created_at: string }
        Insert: never
        Update: { read_at?: string | null }
        Relationships: []
      }
      saved_searches: {
        Row: { id: string, user_id: string, label: string, filters: Json, alerts: boolean, created_at: string }
        Insert: { label: string, filters?: Json, alerts?: boolean }
        Update: { label?: string, alerts?: boolean }
        Relationships: []
      }
      shortlist_items: {
        Row: { user_id: string, dog_id: string, comparing: boolean, created_at: string }
        Insert: { user_id: string, dog_id: string, comparing?: boolean }
        Update: { comparing?: boolean }
        Relationships: [
          { foreignKeyName: 'shortlist_items_dog_id_fkey', columns: ['dog_id'], isOneToOne: false, referencedRelation: 'dogs', referencedColumns: ['id'] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      has_store_role: { Args: { target_store: string, roles: Database['public']['Enums']['store_role'][] }, Returns: boolean }
      mark_conversation_read: { Args: { target: string }, Returns: undefined }
      my_email: { Args: Record<string, never>, Returns: string }
      my_store_invites: { Args: Record<string, never>, Returns: { id: string, store_name: string, store_city: string, role: Database['public']['Enums']['store_role'], invited_by_name: string, created_at: string }[] }
      accept_store_invite: { Args: { target: string }, Returns: string }
      is_staff: { Args: { roles?: Database['public']['Enums']['staff_role'][] }, Returns: boolean }
      admin_overview: { Args: Record<string, never>, Returns: Json }
      admin_stores: { Args: Record<string, never>, Returns: Json }
      admin_applications: { Args: Record<string, never>, Returns: Json }
      admin_staff: { Args: Record<string, never>, Returns: Json }
      admin_schedule_inspection: { Args: { target: string, at: string, inspector: string, note?: string }, Returns: string }
      admin_cancel_inspection: { Args: { target: string, note: string }, Returns: undefined }
      admin_inspections: { Args: Record<string, never>, Returns: Json }
      admin_inspection: { Args: { target: string }, Returns: Json }
      my_store_inspection: { Args: { target: string }, Returns: Json }
      admin_save_inspection: { Args: { target: string, checklist: Json, dogs: Json, photos: string[], summary: string }, Returns: undefined }
      admin_complete_inspection: { Args: { target: string, passed: boolean }, Returns: undefined }
      submit_store_application: { Args: { target: string }, Returns: undefined }
      admin_dogs: { Args: Record<string, never>, Returns: Json }
      admin_set_dog_status: { Args: { target: string, next: Database['public']['Enums']['dog_status'], note?: string }, Returns: undefined }
      admin_reviews: { Args: Record<string, never>, Returns: Json }
      admin_remove_review: { Args: { target: string, note: string }, Returns: undefined }
      admin_people: { Args: { q?: string }, Returns: Json }
      admin_save_provider: { Args: { p: Json }, Returns: string }
      admin_delete_provider: { Args: { target: string }, Returns: undefined }
      admin_set_store_status: { Args: { target: string, next: Database['public']['Enums']['store_status'], note?: string }, Returns: undefined }
      store_team: { Args: { target: string }, Returns: { user_id: string, name: string, email: string | null, role: Database['public']['Enums']['store_role'], joined_at: string }[] }
    }
    Enums: {
      store_status: 'draft' | 'in_review' | 'verified' | 'suspended'
      store_role: 'owner' | 'manager' | 'handler'
      dog_status: 'draft' | 'pending_review' | 'available' | 'reserved' | 'sold' | 'withdrawn'
      dog_sex: 'Male' | 'Female'
      property_type: 'home' | 'compound' | 'estate' | 'business'
      handler_experience: 'first-time' | 'some' | 'experienced' | 'professional'
      message_role: 'buyer' | 'store'
      visit_status: 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'done'
      visit_place: 'kennel' | 'home'
      staff_role: 'admin' | 'inspector'
      care_type: 'vet' | 'trainer' | 'groomer' | 'builder' | 'equipment' | 'boarding'
      notification_kind: 'message' | 'visit' | 'reserved' | 'sold' | 'available' | 'price' | 'team' | 'review' | 'store'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
