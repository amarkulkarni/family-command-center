-- Shared container for both parents
create table family_spaces (
  id uuid default gen_random_uuid() primary key,
  name text default 'Our Family',
  invite_code text unique,
  created_at timestamptz default now()
);

-- Links auth.users to a family_space
create table family_members (
  id uuid default gen_random_uuid() primary key,
  family_space_id uuid references family_spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(family_space_id, user_id)
);

-- One row per input channel (Gmail forward, Twilio bot; later WhatsApp extension, SMS)
create table connectors (
  id uuid default gen_random_uuid() primary key,
  family_space_id uuid references family_spaces(id) on delete cascade,
  type text not null,              -- 'GMAIL_FORWARD' | 'TWILIO_WHATSAPP' | 'WHATSAPP_WEB'
  owner_email text,                -- whose Gmail this captures (for GMAIL_FORWARD)
  display_name text,               -- "Dad's Gmail", "Family Bot"
  status text default 'ACTIVE',
  last_received_at timestamptz,
  created_at timestamptz default now()
);

-- Source-agnostic message store
create table messages (
  id uuid default gen_random_uuid() primary key,
  family_space_id uuid references family_spaces(id) on delete cascade,
  connector_id uuid references connectors(id) on delete cascade,
  external_id text,                -- email Message-ID header or Twilio SID
  subject text,                    -- email subject; null for WhatsApp
  snippet text,
  body_text text,
  from_address text,               -- email address or phone number
  from_name text,
  received_at timestamptz,
  raw_payload jsonb,
  ai_processed boolean default false,
  ai_category text,
  ai_summary text,
  ai_action_items text[],
  ai_key_dates jsonb,              -- [{ "label": "...", "date": "YYYY-MM-DD" }]
  ai_urgency text,                 -- HIGH | MEDIUM | LOW
  is_read boolean default false,
  is_archived boolean default false,
  created_at timestamptz default now(),
  unique(connector_id, external_id)
);

create index messages_family_received on messages(family_space_id, received_at desc);
create index messages_family_category on messages(family_space_id, ai_category);
create index messages_unprocessed on messages(ai_processed) where ai_processed = false;

-- Enable RLS
alter table family_spaces enable row level security;
alter table family_members enable row level security;
alter table connectors enable row level security;
alter table messages enable row level security;

-- RLS Policies

-- family_members: users can see their own record
create policy "Users can see their family membership"
  on family_members for select
  using (user_id = auth.uid());

-- messages: users can only see messages from family spaces they're a member of
create policy "Users can see messages from their family space"
  on messages for select
  using (
    family_space_id in (
      select family_space_id from family_members where user_id = auth.uid()
    )
  );

-- connectors: users can only see connectors from their family space
create policy "Users can see connectors from their family space"
  on connectors for select
  using (
    family_space_id in (
      select family_space_id from family_members where user_id = auth.uid()
    )
  );

-- family_spaces: users can see their family space
create policy "Users can see their family space"
  on family_spaces for select
  using (
    id in (
      select family_space_id from family_members where user_id = auth.uid()
    )
  );
