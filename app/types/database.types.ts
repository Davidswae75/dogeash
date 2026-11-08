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
        Row: { id: string, public_id: string, slug: string, name: string, person: string | null, type: Database['public']['Enums']['care_type'], city: string, areas: string, home_visits: boolean, verified: boolean, credential: string, rating: number, reviews_count: number, price_from: number, about: string, hours: string, weekdays: number[], slots: string[], taking_bookings: boolean } & Timestamps
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
      reports: {
        Row: { id: string, reporter_id: string, kind: string, target_id: string, reason: string, details: string, status: string, resolution: string, resolved_by: string | null, resolved_at: string | null, created_at: string }
        Insert: { kind: string, target_id: string, reason: string, details?: string }
        Update: never
        Relationships: []
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
      owned_dogs: {
        Row: { id: string, owner_id: string, name: string, breed: string, sex: 'Male' | 'Female' | null, born_on: string | null, weight_kg: number | null, microchip: string, level: number | null, photo_path: string | null, store_id: string | null, dog_id: string | null, came_from: string, got_on: string | null, notes: string, created_at: string, updated_at: string }
        Insert: { name: string, breed?: string, sex?: 'Male' | 'Female' | null, born_on?: string | null, weight_kg?: number | null, microchip?: string, level?: number | null, photo_path?: string | null, store_id?: string | null, came_from?: string, got_on?: string | null, notes?: string }
        Update: { name?: string, breed?: string, sex?: 'Male' | 'Female' | null, born_on?: string | null, weight_kg?: number | null, microchip?: string, level?: number | null, photo_path?: string | null, store_id?: string | null, came_from?: string, got_on?: string | null, notes?: string }
        Relationships: [
          { foreignKeyName: 'owned_dogs_store_id_fkey', columns: ['store_id'], isOneToOne: false, referencedRelation: 'stores', referencedColumns: ['id'] },
        ]
      }
      owned_dog_records: {
        Row: { id: string, owned_dog_id: string, owner_id: string, kind: Database['public']['Enums']['owned_dog_record_kind'], title: string, done_on: string | null, due_on: string | null, by_whom: string, note: string, provider_id: string | null, care_booking_id: string | null, created_at: string }
        Insert: { owned_dog_id: string, kind: Database['public']['Enums']['owned_dog_record_kind'], title: string, done_on?: string | null, due_on?: string | null, by_whom?: string, note?: string }
        Update: { kind?: Database['public']['Enums']['owned_dog_record_kind'], title?: string, done_on?: string | null, due_on?: string | null, by_whom?: string, note?: string }
        Relationships: [
          { foreignKeyName: 'owned_dog_records_owned_dog_id_fkey', columns: ['owned_dog_id'], isOneToOne: false, referencedRelation: 'owned_dogs', referencedColumns: ['id'] },
        ]
      }
      saved_searches: {
        Row: { id: string, user_id: string, label: string, filters: Json, alerts: boolean, created_at: string }
        Insert: { label: string, filters?: Json, alerts?: boolean }
        Update: { label?: string, alerts?: boolean }
        Relationships: []
      }
      reservations: {
        Row: { id: string, ref: string, dog_id: string, store_id: string, buyer_id: string, dog_name: string, dog_file_no: string, dog_photo_path: string | null, store_name: string, price_naira: number, deposit_naira: number, commission_naira: number, status: Database['public']['Enums']['reservation_status'], expires_at: string, deposit_paid_at: string | null, paid_at: string | null, completed_at: string | null, closed_at: string | null, closed_by: 'buyer' | 'store' | 'dogeash' | 'system' | null, close_reason: string, money_decision: 'waiting' | 'refund' | 'release' | null, created_at: string, updated_at: string }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      payments: {
        Row: { id: string, reservation_id: string, buyer_id: string, kind: 'deposit' | 'balance', reference: string, amount_naira: number, status: Database['public']['Enums']['payment_status'], channel: string, paid_at: string | null, created_at: string }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: [
          { foreignKeyName: 'payments_reservation_id_fkey', columns: ['reservation_id'], isOneToOne: false, referencedRelation: 'reservations', referencedColumns: ['id'] },
        ]
      }
      refunds: {
        Row: { id: string, reservation_id: string, payment_id: string, amount_naira: number, reason: string, status: Database['public']['Enums']['money_move_status'], provider_id: string | null, failure: string, created_at: string, done_at: string | null }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: [
          { foreignKeyName: 'refunds_reservation_id_fkey', columns: ['reservation_id'], isOneToOne: false, referencedRelation: 'reservations', referencedColumns: ['id'] },
        ]
      }
      payouts: {
        Row: { id: string, store_id: string, reservation_id: string, amount_naira: number, status: Database['public']['Enums']['money_move_status'], transfer_reference: string | null, transfer_code: string | null, failure: string, created_at: string, done_at: string | null }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: [
          { foreignKeyName: 'payouts_reservation_id_fkey', columns: ['reservation_id'], isOneToOne: true, referencedRelation: 'reservations', referencedColumns: ['id'] },
        ]
      }
      store_payout_accounts: {
        Row: { store_id: string, bank_code: string, bank_name: string, account_name: string, account_last4: string, recipient_code: string, updated_by: string | null, updated_at: string }
        Insert: { store_id: string, bank_code: string, bank_name: string, account_name: string, account_last4: string, recipient_code: string, updated_by?: string | null, updated_at?: string }
        Update: { bank_code?: string, bank_name?: string, account_name?: string, account_last4?: string, recipient_code?: string, updated_by?: string | null, updated_at?: string }
        Relationships: []
      }
      care_provider_members: {
        Row: { provider_id: string, user_id: string, created_at: string }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      care_provider_invites: {
        Row: { id: string, provider_id: string, email: string, invited_by: string | null, created_at: string }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      care_bookings: {
        Row: { id: string, provider_id: string, buyer_id: string, service: string, day: string, slot: string, place: 'premises' | 'home', note: string, owned_dog_id: string | null, dog_name: string, share_record: boolean, status: Database['public']['Enums']['care_booking_status'], provider_note: string, buyer_name: string, buyer_phone: string | null, created_at: string, updated_at: string }
        Insert: { provider_id: string, service: string, day: string, slot: string, place?: 'premises' | 'home', note?: string, owned_dog_id?: string | null, dog_name?: string, share_record?: boolean }
        Update: { [_ in never]: never }
        Relationships: [
          { foreignKeyName: 'care_bookings_provider_id_fkey', columns: ['provider_id'], isOneToOne: false, referencedRelation: 'care_providers', referencedColumns: ['id'] },
        ]
      }
      shortlist_items: {
        Row: { user_id: string, dog_id: string, comparing: boolean, saved_price: number | null, created_at: string }
        Insert: { user_id: string, dog_id: string, comparing?: boolean }
        Update: { comparing?: boolean }
        Relationships: [
          { foreignKeyName: 'shortlist_items_dog_id_fkey', columns: ['dog_id'], isOneToOne: false, referencedRelation: 'dogs', referencedColumns: ['id'] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      money_rules: { Args: Record<string, never>, Returns: Json }
      start_reservation: { Args: { file_no: string }, Returns: Json }
      start_balance_payment: { Args: { reservation: string }, Returns: Json }
      cancel_reservation: { Args: { reservation: string, reason?: string }, Returns: undefined }
      confirm_handover: { Args: { reservation: string }, Returns: undefined }
      expire_reservations: { Args: Record<string, never>, Returns: number }
      record_payment: { Args: { payment_reference: string, amount_paid_naira: number, succeeded: boolean, pay_channel?: string }, Returns: Json }
      record_refund: { Args: { refund: string, to_status: Database['public']['Enums']['money_move_status'], provider?: string | null, why?: string }, Returns: undefined }
      store_reservations: { Args: { target_store: string }, Returns: Json }
      store_cancel_reservation: { Args: { reservation: string, reason: string }, Returns: undefined }
      admin_decide_deposit: { Args: { reservation: string, decision: string, note?: string }, Returns: undefined }
      admin_money: { Args: Record<string, never>, Returns: Json }
      claim_refund: { Args: { refund: string }, Returns: Json }
      claim_payout: { Args: { payout: string }, Returns: Json }
      record_transfer: { Args: { transfer_ref: string, to_status: Database['public']['Enums']['money_move_status'], code?: string | null, why?: string }, Returns: undefined }
      record_refund_by_payment: { Args: { payment_reference: string, to_status: Database['public']['Enums']['money_move_status'], provider?: string | null, why?: string }, Returns: undefined }
      is_provider_member: { Args: { target: string }, Returns: boolean }
      admin_invite_provider: { Args: { provider: string, invite_email: string }, Returns: undefined }
      admin_provider_managers: { Args: Record<string, never>, Returns: Json }
      my_provider_invites: { Args: Record<string, never>, Returns: { id: string, provider_name: string, provider_type: Database['public']['Enums']['care_type'], provider_city: string, created_at: string }[] }
      accept_provider_invite: { Args: { target: string }, Returns: string }
      provider_save_profile: { Args: { provider: string, p: Json }, Returns: undefined }
      set_care_booking_status: { Args: { booking: string, to_status: Database['public']['Enums']['care_booking_status'], answer_note?: string }, Returns: undefined }
      provider_bookings: { Args: { provider: string }, Returns: Json }
      provider_add_record: { Args: { booking: string, rec_kind: Database['public']['Enums']['owned_dog_record_kind'], rec_title: string, rec_done: string | null, rec_due: string | null, rec_note?: string }, Returns: undefined }
      provider_booking_records: { Args: { booking: string }, Returns: Json }
      account_exists: { Args: { check_email: string }, Returns: boolean }
      has_store_role: { Args: { target_store: string, roles: Database['public']['Enums']['store_role'][] }, Returns: boolean }
      mark_conversation_read: { Args: { target: string }, Returns: undefined }
      my_email: { Args: Record<string, never>, Returns: string }
      my_store_invites: { Args: Record<string, never>, Returns: { id: string, store_name: string, store_city: string, role: Database['public']['Enums']['store_role'], invited_by_name: string, created_at: string }[] }
      accept_store_invite: { Args: { target: string }, Returns: string }
      is_staff: { Args: { roles?: Database['public']['Enums']['staff_role'][] }, Returns: boolean }
      admin_overview: { Args: Record<string, never>, Returns: Json }
      admin_stores: { Args: Record<string, never>, Returns: Json }
      admin_applications: { Args: Record<string, never>, Returns: Json }
      my_block: { Args: Record<string, never>, Returns: Json }
      admin_store: { Args: { target: string }, Returns: Json }
      admin_visits: { Args: Record<string, never>, Returns: Json }
      admin_reinspections: { Args: Record<string, never>, Returns: Json }
      admin_send_announcement: { Args: { audience: string, title: string, body: string, link?: string | null, banner_until?: string | null }, Returns: number }
      admin_announcements: { Args: Record<string, never>, Returns: Json }
      admin_settings: { Args: Record<string, never>, Returns: Json }
      admin_history: { Args: { days: number }, Returns: Json }
      admin_search: { Args: { q: string }, Returns: Json }
      admin_save_settings: { Args: { s: Json }, Returns: undefined }
      admin_end_banner: { Args: { target: string }, Returns: undefined }
      site_banner: { Args: Record<string, never>, Returns: Json }
      admin_send_reinspection_reminders: { Args: Record<string, never>, Returns: number }
      my_store_verification: { Args: { target: string }, Returns: string | null }
      admin_nudge_visit: { Args: { target: string }, Returns: undefined }
      admin_person: { Args: { target: string }, Returns: Json }
      admin_block_person: { Args: { target: string, reason: string }, Returns: undefined }
      admin_unblock_person: { Args: { target: string }, Returns: undefined }
      admin_reports: { Args: Record<string, never>, Returns: Json }
      admin_open_reports: { Args: Record<string, never>, Returns: number }
      admin_report_messages: { Args: { report: string }, Returns: Json }
      admin_resolve_report: { Args: { target: string, outcome: string, note: string }, Returns: undefined }
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
      owned_dog_record_kind: 'vaccination' | 'treatment' | 'vet' | 'training' | 'reminder'
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
      notification_kind: 'message' | 'visit' | 'reserved' | 'sold' | 'available' | 'price' | 'team' | 'review' | 'store' | 'report' | 'announcement' | 'payment' | 'care'
      care_booking_status: 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'done'
      reservation_status: 'pending' | 'held' | 'paid' | 'completed' | 'cancelled' | 'expired'
      payment_status: 'pending' | 'success' | 'failed'
      money_move_status: 'due' | 'sending' | 'done' | 'failed'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
