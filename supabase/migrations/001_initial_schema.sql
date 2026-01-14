-- Create media_items table
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('soundbites', 'gifs', 'images')),
  storage_path text not null,
  storage_bucket text not null default 'media',
  size bigint,
  uploaded_at timestamptz default now(),
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster queries
create index if not exists idx_media_items_type on public.media_items(type);
create index if not exists idx_media_items_display_order on public.media_items(type, display_order);

-- Enable Row Level Security
alter table public.media_items enable row level security;

-- Allow public read access (for viewing media)
create policy "Allow public read access"
  on public.media_items
  for select
  to public
  using (true);

-- Allow public insert access (for uploading)
create policy "Allow public insert access"
  on public.media_items
  for insert
  to public
  with check (true);

-- Allow public update access (for renaming, reordering)
create policy "Allow public update access"
  on public.media_items
  for update
  to public
  using (true)
  with check (true);

-- Allow public delete access
create policy "Allow public delete access"
  on public.media_items
  for delete
  to public
  using (true);

-- Enable Realtime for media_items table
alter publication supabase_realtime add table public.media_items;

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_media_items_updated_at
  before update on public.media_items
  for each row
  execute function public.update_updated_at_column();
