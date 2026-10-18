
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "digest_schedules": {
                  Row: {
                    "authors": (string)[] | null,"chat_id": number,"created_at": string,"everything": boolean,"frequency": string,"last_occurrence": string | null,"tags": (string)[] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "authors"?: (string)[] | null,"chat_id": number,"created_at"?: string,"everything"?: boolean,"frequency": string,"last_occurrence"?: string | null,"tags"?: (string)[] | null
                  }
                  Update: {
                    "authors"?: (string)[] | null,"chat_id"?: number,"created_at"?: string,"everything"?: boolean,"frequency"?: string,"last_occurrence"?: string | null,"tags"?: (string)[] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "digest_schedules_chat_id_fkey"
      columns: ["chat_id"]
isOneToOne: true
      referencedRelation: "telegram_chats"
      referencedColumns: ["chat_id"]
    }
                  ]
                },"follows": {
                  Row: {
                    "chat_id": number,"created_at": string,"target": Database["public"]['Enums']["follow_target"],"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "chat_id": number,"created_at"?: string,"target": Database["public"]['Enums']["follow_target"],"value"?: string
                  }
                  Update: {
                    "chat_id"?: number,"created_at"?: string,"target"?: Database["public"]['Enums']["follow_target"],"value"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_chat_id_fkey"
      columns: ["chat_id"]
isOneToOne: false
      referencedRelation: "telegram_chats"
      referencedColumns: ["chat_id"]
    }
                  ]
                },"post_tags": {
                  Row: {
                    "post_id": number,"tag": string
                  }
                  ComputedFields: never
                  Insert: {
                    "post_id": number,"tag": string
                  }
                  Update: {
                    "post_id"?: number,"tag"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_tags_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_tags_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "public_posts"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"body_md": string,"created_at": string,"id": number,"published_at": string | null,"read_minutes": number,"search": unknown,"status": Database["public"]['Enums']["post_status"],"title": string,"topic_slug": string,"updated_at": string,"written_by_author": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string,"body_md": string,"created_at"?: string,"id"?: never,"published_at"?: string | null,"read_minutes"?: number,"search"?: never,"status"?: Database["public"]['Enums']["post_status"],"title": string,"topic_slug": string,"updated_at"?: string,"written_by_author": boolean
                  }
                  Update: {
                    "author_id"?: string,"body_md"?: string,"created_at"?: string,"id"?: never,"published_at"?: string | null,"read_minutes"?: number,"search"?: never,"status"?: Database["public"]['Enums']["post_status"],"title"?: string,"topic_slug"?: string,"updated_at"?: string,"written_by_author"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "public_posts"
      referencedColumns: ["author_id"]
    },{
      foreignKeyName: "posts_topic_slug_fkey"
      columns: ["topic_slug"]
isOneToOne: false
      referencedRelation: "public_posts"
      referencedColumns: ["topic_slug"]
    },{
      foreignKeyName: "posts_topic_slug_fkey"
      columns: ["topic_slug"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["slug"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"display_name": string,"handle": string,"id": string,"provider": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name": string,"handle": string,"id": string,"provider"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string,"handle"?: string,"id"?: string,"provider"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reactions": {
                  Row: {
                    "created_at": string,"kind": Database["public"]['Enums']["reaction_kind"],"post_id": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"kind": Database["public"]['Enums']["reaction_kind"],"post_id": number,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"kind"?: Database["public"]['Enums']["reaction_kind"],"post_id"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "public_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_posts"
      referencedColumns: ["author_id"]
    }
                  ]
                },"telegram_chats": {
                  Row: {
                    "blocked_at": string | null,"chat_id": number,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_at"?: string | null,"chat_id": number,"created_at"?: string
                  }
                  Update: {
                    "blocked_at"?: string | null,"chat_id"?: number,"created_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"topics": {
                  Row: {
                    "created_at": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "public_posts": {
                  Row: {
                    "author_avatar_url": string | null,"author_handle": string | null,"author_id": string | null,"author_name": string | null,"body_md": string | null,"excerpt": string | null,"id": number | null,"published_at": string | null,"reactions": Json | null,"read_minutes": number | null,"tags": (string)[] | null,"title": string | null,"topic_name": string | null,"topic_slug": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "create_post":
{ Args: { "p_body_md": string,"p_tags": (string)[],"p_title": string,"p_topic_slug": string }; Returns: number
                           },
"digest_occurrence":
{ Args: { "p_anchor": string,"p_frequency": string,"p_now": string }; Returns: string
                           },
"digest_text":
{ Args: { "p_authors"?: (string)[],"p_chat_id": number,"p_everything"?: boolean,"p_label": string,"p_since": string,"p_site_url": string,"p_tags"?: (string)[] }; Returns: string
                           },
"enqueue_due_digests":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"feed_page":
{ Args: { "p_before"?: string,"p_days"?: number,"p_time_zone"?: string }; Returns: {
              "author_avatar_url": string | null,
"author_handle": string | null,
"author_id": string | null,
"author_name": string | null,
"body_md": string | null,
"excerpt": string | null,
"id": number | null,
"published_at": string | null,
"reactions": Json | null,
"read_minutes": number | null,
"tags": (string)[] | null,
"title": string | null,
"topic_name": string | null,
"topic_slug": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "public_posts"
        isOneToOne: false
        isSetofReturn: true
      } },
"kick_notifier":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"notifications_ack":
{ Args: { "p_msg_id": number }; Returns: undefined
                           },
"notifications_fail":
{ Args: { "p_error": string,"p_msg_id": number }; Returns: undefined
                           },
"notifications_read":
{ Args: { "p_lease"?: number,"p_qty"?: number }; Returns: {
              "message": Json,"msg_id": number,"read_ct": number
            }[]
                           },
"notifications_retry":
{ Args: { "p_error": string,"p_min_wait"?: number,"p_msg_id": number }; Returns: undefined
                           },
"search_posts":
{ Args: { "max_results"?: number,"q": string }; Returns: {
              "author_avatar_url": string | null,
"author_handle": string | null,
"author_id": string | null,
"author_name": string | null,
"body_md": string | null,
"excerpt": string | null,
"id": number | null,
"published_at": string | null,
"reactions": Json | null,
"read_minutes": number | null,
"tags": (string)[] | null,
"title": string | null,
"topic_name": string | null,
"topic_slug": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "public_posts"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_reaction":
{ Args: { "p_kind": Database["public"]['Enums']["reaction_kind"],"p_post_id": number }; Returns: Json
                           },
"telegram_html_escape":
{ Args: { "p_text": string }; Returns: string
                           }
          }
          Enums: {
            "follow_target": "all"|"topic"|"tag"|"author","post_status": "draft"|"published"|"hidden","reaction_kind": "learned"|"like"|"love"|"funny"|"surprised"|"thanks"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "follow_target": ["all", "topic", "tag", "author"],"post_status": ["draft", "published", "hidden"],"reaction_kind": ["learned", "like", "love", "funny", "surprised", "thanks"]
          }
        }
} as const
