-- ============================================
-- Transactions Table RLS
-- ============================================

-- Enable RLS on the transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Farmers can view their own transactions
CREATE POLICY "Farmers can view own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (farmer_id = auth.uid());

-- Wholesalers can view transactions where they are the wholesaler
CREATE POLICY "Wholesalers can view own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (wholesaler_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Farmers can insert their own transactions
CREATE POLICY "Farmers can create transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (farmer_id = auth.uid());

-- Admins can manage all transactions
CREATE POLICY "Admins can manage all transactions"
ON public.transactions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);
