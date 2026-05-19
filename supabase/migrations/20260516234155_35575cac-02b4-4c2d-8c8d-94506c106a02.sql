
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'staff');
CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'archived');

-- ============ STORES ============
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'USD',
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stores_owner_idx ON public.stores(owner_user_id);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,            -- equals auth.users.id
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_store_idx ON public.profiles(store_id);

-- ============ USER ROLES (separate table for security) ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id, role)
);
CREATE INDEX user_roles_user_idx ON public.user_roles(user_id);
CREATE INDEX user_roles_store_idx ON public.user_roles(store_id);

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);
CREATE INDEX categories_store_idx ON public.categories(store_id);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  status public.product_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);
CREATE INDEX products_store_status_idx ON public.products(store_id, status);
CREATE INDEX products_category_idx ON public.products(category_id);

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _store_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND store_id = _store_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_member(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND store_id = _store_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_admin(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND store_id = _store_id
      AND role IN ('owner', 'admin')
  );
$$;

-- ============ updated_at TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stores_set_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NULL));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ENABLE RLS ============
ALTER TABLE public.stores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES: stores ============
CREATE POLICY "Members can view their store"
  ON public.stores FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), id));

CREATE POLICY "Public can view stores by slug"
  ON public.stores FOR SELECT TO anon
  USING (true);  -- shop is public; storefront looks up store by slug

CREATE POLICY "Owners can create their own store"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner/admin can update store"
  ON public.stores FOR UPDATE TO authenticated
  USING (public.is_store_admin(auth.uid(), id));

-- ============ POLICIES: profiles ============
CREATE POLICY "Users view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ============ POLICIES: user_roles ============
CREATE POLICY "Users view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Store admins view all store roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_store_admin(auth.uid(), store_id));

CREATE POLICY "Store admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_store_admin(auth.uid(), store_id))
  WITH CHECK (public.is_store_admin(auth.uid(), store_id));

-- ============ POLICIES: categories ============
CREATE POLICY "Public can read categories"
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.is_store_admin(auth.uid(), store_id))
  WITH CHECK (public.is_store_admin(auth.uid(), store_id));

-- ============ POLICIES: products ============
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Members view all store products"
  ON public.products FOR SELECT TO authenticated
  USING (public.is_store_member(auth.uid(), store_id));

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_store_admin(auth.uid(), store_id))
  WITH CHECK (public.is_store_admin(auth.uid(), store_id));
