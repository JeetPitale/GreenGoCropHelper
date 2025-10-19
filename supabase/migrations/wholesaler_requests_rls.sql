-- ============================================
-- Wholesaler Requests Table RLS
-- ============================================

-- Enable RLS on the wholesaler_requests table
ALTER TABLE public.wholesaler_requests ENABLE ROW LEVEL SECURITY;

-- Wholesalers can manage their own requests
CREATE POLICY "Wholesalers manage own requests"
ON public.wholesaler_requests FOR ALL
TO authenticated
USING (wholesaler_id = auth.uid())
WITH CHECK (wholesaler_id = auth.uid());

-- Farmers can view requests for their crops
CREATE POLICY "Farmers view requests for their crops"
ON public.wholesaler_requests FOR SELECT
TO authenticated
USING (farmer_id = auth.uid());

-- Admins can manage all requests
CREATE POLICY "Admins manage all requests"
ON public.wholesaler_requests FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
