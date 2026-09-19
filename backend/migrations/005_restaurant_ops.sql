-- ============================================
-- SmartStore AI: Restaurant Operations Schema (UUID Unified)
-- ============================================

CREATE TABLE IF NOT EXISTS public.floors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.floor_layouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id uuid NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Default',
    is_default BOOLEAN DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.layout_elements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id uuid NOT NULL REFERENCES public.floor_layouts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    pos_x DECIMAL(10, 2) NOT NULL DEFAULT 0,
    pos_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    rotation INTEGER DEFAULT 0,
    label VARCHAR(50),
    capacity INTEGER DEFAULT 0,
    color_tag VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    guests INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    time TIME NOT NULL,
    floor_id uuid REFERENCES public.floors(id),
    table_label VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kitchen_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    station VARCHAR(50) DEFAULT 'All',
    priority INTEGER DEFAULT 0,
    started_at timestamptz,
    ready_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'todo',
    due_date timestamptz,
    source VARCHAR(50) DEFAULT 'manual',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_floors_store ON public.floors(store_id);
CREATE INDEX IF NOT EXISTS idx_layouts_floor ON public.floor_layouts(floor_id);
CREATE INDEX IF NOT EXISTS idx_elements_layout ON public.layout_elements(layout_id);
CREATE INDEX IF NOT EXISTS idx_reservations_store_date ON public.reservations(store_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_store ON public.kitchen_tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON public.kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tasks_store ON public.tasks(store_id);

-- Updated_at triggers (consistent with 001 schema)
DROP TRIGGER IF EXISTS floors_set_updated_at ON public.floors;
CREATE TRIGGER floors_set_updated_at BEFORE UPDATE ON public.floors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS reservations_set_updated_at ON public.reservations;
CREATE TRIGGER reservations_set_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS kitchen_tickets_set_updated_at ON public.kitchen_tickets;
CREATE TRIGGER kitchen_tickets_set_updated_at BEFORE UPDATE ON public.kitchen_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();