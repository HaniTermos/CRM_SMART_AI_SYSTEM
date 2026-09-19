-- Migration 019: Reservations performance indexes and date-range support
-- Adds indexes to support list, calendar, and status filtering at scale.

CREATE INDEX IF NOT EXISTS idx_reservations_store_date ON public.reservations(store_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_store_status ON public.reservations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_store_date_status ON public.reservations(store_id, date, status);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON public.reservations(time);
