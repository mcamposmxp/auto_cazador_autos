-- Create table for sellers needing help to sell their car privately
create table if not exists public.vendedores_ayuda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  vendedor_nombre text not null,
  vendedor_correo text not null,
  vendedor_telefono text not null,
  ciudad text,
  estado text,
  preferencia_contacto text,
  marca text not null,
  modelo text not null,
  version text,
  ano integer not null,
  kilometraje integer not null default 0,
  servicios_agencia boolean not null default false,
  documentos_orden boolean not null default true,
  estado_auto text not null,
  fecha_registro timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.vendedores_ayuda enable row level security;

-- Simple permissive policy similar to other public tables
create policy if not exists "Allow all operations on vendedores_ayuda"
  on public.vendedores_ayuda
  for all
  using (true)
  with check (true);

-- Trigger to keep updated_at fresh
create trigger if not exists update_vendedores_ayuda_updated_at
before update on public.vendedores_ayuda
for each row execute function public.update_updated_at_column();