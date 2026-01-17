-- Create text_items table
create table if not exists public.text_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster queries
create index if not exists idx_text_items_display_order on public.text_items(display_order);

-- Enable Row Level Security
alter table public.text_items enable row level security;

-- Allow public read access (for viewing text)
create policy "Allow public read access"
  on public.text_items
  for select
  to public
  using (true);

-- Allow public insert access (for creating text)
create policy "Allow public insert access"
  on public.text_items
  for insert
  to public
  with check (true);

-- Allow public update access (for editing, reordering)
create policy "Allow public update access"
  on public.text_items
  for update
  to public
  using (true)
  with check (true);

-- Allow public delete access
create policy "Allow public delete access"
  on public.text_items
  for delete
  to public
  using (true);

-- Enable Realtime for text_items table
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'text_items'
    and schemaname = 'public'
  ) then
    alter publication supabase_realtime add table public.text_items;
  end if;
end $$;

-- Set replica identity full for Realtime
alter table public.text_items replica identity full;

-- Create trigger to automatically update updated_at
create trigger update_text_items_updated_at
  before update on public.text_items
  for each row
  execute function public.update_updated_at_column();
