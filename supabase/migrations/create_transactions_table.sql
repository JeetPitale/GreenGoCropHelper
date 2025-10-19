-- ============================================
-- Transactions Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    farmer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wholesaler_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    crop_name text NOT NULL,
    quantity_kg numeric(10,2) NOT NULL,
    price_per_kg numeric(10,2) NOT NULL,
    total_amount numeric(12,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
    notes text,
    status text DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Index for fast lookup by farmer
CREATE INDEX IF NOT EXISTS idx_transactions_farmer_id ON public.transactions(farmer_id);

-- Index for fast lookup by wholesaler
CREATE INDEX IF NOT EXISTS idx_transactions_wholesaler_id ON public.transactions(wholesaler_id);

-- Trigger to update 'updated_at' automatically
CREATE OR REPLACE FUNCTION update_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_transaction_timestamp
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_transaction_timestamp();
