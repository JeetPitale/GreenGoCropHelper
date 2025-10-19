// =======================
// JSON Type Definition
// =======================
export const Json = [
  "string",
  "number",
  "boolean",
  "null",
  "object",
  "array",
];

// =======================
// Database Schema
// =======================
export const Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5",
  },
  public: {
    Tables: {
      crops: {
        Row: {
          area_acres: null,
          created_at: "",
          crop_name: "",
          expected_harvest_date: null,
          expected_yield_kg: null,
          farmer_id: "",
          id: "",
          soil_type: null,
          sowing_date: "",
          status: null,
          updated_at: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      expert_queries: {
        Row: {
          category: null,
          created_at: "",
          expert_id: null,
          farmer_id: "",
          id: "",
          query_text: "",
          response_text: null,
          status: null,
          updated_at: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      market_prices: {
        Row: {
          created_at: "",
          crop_name: "",
          id: "",
          market_location: "",
          price_date: "",
          price_per_kg: 0,
          trend: null,
          updated_at: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      profiles: {
        Row: {
          created_at: "",
          full_name: "",
          id: "",
          location: null,
          phone: null,
          updated_at: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      soil_analysis: {
        Row: {
          created_at: "",
          farmer_id: "",
          id: "",
          nitrogen_level: null,
          organic_matter: null,
          ph_level: null,
          phosphorus_level: null,
          potassium_level: null,
          recommendations: null,
          soil_type: null,
          test_date: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      user_roles: {
        Row: {
          created_at: "",
          id: "",
          role: "farmer",
          user_id: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      weather_alerts: {
        Row: {
          alert_type: "",
          created_at: "",
          description: "",
          end_date: null,
          id: "",
          location: "",
          severity: null,
          start_date: "",
        },
        Insert: {},
        Update: {},
        Relationships: [],
      },

      wholesaler_requests: {
        Row: {
          created_at: "",
          crop_id: null,
          crop_name: "",
          delivery_date: null,
          farmer_id: null,
          id: "",
          notes: null,
          offered_price_per_kg: 0,
          quantity_kg: 0,
          status: null,
          updated_at: "",
          wholesaler_id: "",
        },
        Insert: {},
        Update: {},
        Relationships: [
          {
            foreignKeyName: "wholesaler_requests_crop_id_fkey",
            columns: ["crop_id"],
            isOneToOne: false,
            referencedRelation: "crops",
            referencedColumns: ["id"],
          },
        ],
      },
    },

    Views: {},
    Functions: {
      has_role: {
        Args: {
          _role: "farmer",
          _user_id: "",
        },
        Returns: true,
      },
    },
    Enums: {
      app_role: ["farmer", "expert", "wholesaler", "admin"],
    },
    CompositeTypes: {},
  },
};

// =======================
// Constants
// =======================
export const Constants = {
  public: {
    Enums: {
      app_role: ["farmer", "expert", "wholesaler", "admin"],
    },
  },
};
