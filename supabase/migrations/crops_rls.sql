-- Enable RLS for crops table
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Farmers can manage their own crops
CREATE POLICY "Farmers manage own crops"
ON public.crops FOR ALL
TO authenticated
USING (farmer_id = auth.uid())
WITH CHECK (farmer_id = auth.uid());

-- Wholesalers can view all crops with status 'growing' or 'harvested'
CREATE POLICY "Wholesalers view crops"
ON public.crops FOR SELECT
TO authenticated
USING (status IN ('growing','harvested'));

-- Admins can view and manage all crops
CREATE POLICY "Admins manage crops"
ON public.crops FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
