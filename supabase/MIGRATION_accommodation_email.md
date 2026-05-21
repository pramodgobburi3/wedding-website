# Migration: accommodation email

Adds an email address that guests provide when they request hotel nights, so
you can hand check-in/check-out (derived from the requested nights) plus a
contact email to the Waldorf. Shows up in the admin **Accommodations** tab.

Run the steps below, in order, in the Supabase **SQL Editor**. Your tables and
guests already exist, so this only adds one nullable column and replaces two
functions.

---

## 1. Add the nullable column

```sql
alter table public.rsvp_responses
  add column if not exists accommodation_email text;
```

`accommodation_email` is nullable — it's only set when a guest requests at least
one hotel night.

---

## 2. Drop the old `submit_rsvp` (signature changed)

`submit_rsvp` gained a new parameter (`p_accommodation_email`). Postgres treats
that as a *new* function rather than replacing the old one, so the old 7-argument
version must be dropped first — otherwise PostgREST sees two overloads and the
RSVP form fails with a `PGRST203` "could not choose the best candidate function"
error.

```sql
drop function if exists public.submit_rsvp(uuid, text, text[], int, text, jsonb, date[]);
```

---

## 3. Re-create `submit_rsvp` (8-arg version)

```sql
create or replace function public.submit_rsvp(
  p_guest_id                 uuid,
  p_phone                    text,
  p_events_attending         text[],
  p_guest_count              int,
  p_message                  text,
  p_member_attendance        jsonb,
  p_accommodations_requested date[] default null,
  p_accommodation_email      text   default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party_name      text;
  v_party_guest_ids uuid[];
  v_existing_id     uuid;
  v_deadline        date;
begin
  -- Input validation (mirrors the anon_insert RLS check)
  if p_guest_id is null then
    raise exception 'guest_id required';
  end if;
  if p_guest_count < 0 or p_guest_count > 20 then
    raise exception 'invalid guest_count';
  end if;
  if char_length(p_phone) not between 7 and 15 then
    raise exception 'invalid phone';
  end if;
  if p_events_attending is not null and array_length(p_events_attending, 1) > 10 then
    raise exception 'too many events';
  end if;
  if p_message is not null and char_length(p_message) > 2000 then
    raise exception 'message too long';
  end if;
  if p_accommodation_email is not null and char_length(p_accommodation_email) > 254 then
    raise exception 'email too long';
  end if;

  -- Reject submissions after the RSVP deadline (inclusive — deadline day still counts).
  select nullif(value #>> '{}', '')::date into v_deadline
  from app_settings where key = 'rsvp_deadline';

  if v_deadline is not null and current_date > v_deadline then
    return json_build_object('ok', false, 'reason', 'deadline_passed');
  end if;

  -- Look up the caller's party
  select party_name into v_party_name from guests where id = p_guest_id;

  -- Serialize concurrent submits for the same party (or the same guest if no
  -- party_name is set). The lock is automatically released at end-of-transaction.
  perform pg_advisory_xact_lock(
    hashtext('rsvp:' || coalesce(v_party_name, p_guest_id::text))
  );

  -- Collect all guest_ids that belong to this party (or just the caller)
  if v_party_name is not null then
    select array_agg(id) into v_party_guest_ids
    from guests where party_name = v_party_name;
  else
    v_party_guest_ids := array[p_guest_id];
  end if;

  -- If anyone in the party already has a response, UPDATE that row instead
  -- of inserting a new one (this is what powers the "edit your RSVP" flow).
  select id into v_existing_id
  from rsvp_responses
  where guest_id = any(v_party_guest_ids)
  limit 1;

  if v_existing_id is not null then
    update rsvp_responses
    set events_attending         = p_events_attending,
        guest_count              = p_guest_count,
        message                  = p_message,
        member_attendance        = p_member_attendance,
        accommodations_requested = p_accommodations_requested,
        accommodation_email      = p_accommodation_email,
        submitted_at             = now()
    where id = v_existing_id;
    return json_build_object('ok', true, 'edited', true);
  end if;

  insert into rsvp_responses (
    guest_id, phone, events_attending, guest_count, message, member_attendance, accommodations_requested, accommodation_email
  ) values (
    p_guest_id, p_phone, p_events_attending, p_guest_count, p_message, p_member_attendance, p_accommodations_requested, p_accommodation_email
  );

  return json_build_object('ok', true, 'edited', false);
end;
$$;

grant execute on function public.submit_rsvp(uuid, text, text[], int, text, jsonb, date[], text) to anon, authenticated;
```

---

## 4. Re-create `lookup_guest_by_phone`

This version returns `accommodation_email` inside `existing_response` so the
form pre-fills the email when a guest edits an RSVP.

```sql
create or replace function public.lookup_guest_by_phone(p_phone text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest_id         uuid;
  v_guest            record;
  v_existing_id      uuid;
  v_friends_events   text[];
  v_party_members    jsonb;
  v_existing_response jsonb;
begin
  select invited_events into v_friends_events
  from groups where name = 'friends';

  select guest_id into v_guest_id
  from guest_phones where phone = p_phone;

  if v_guest_id is not null then
    select g.id, g.name,
           coalesce(g.events_override, gr.invited_events) as allowed_events,
           g.party_name,
           gr.travel_accommodations
    into v_guest
    from guests g
    join groups gr on gr.id = g.group_id
    where g.id = v_guest_id;

    if v_guest.party_name is not null then
      select jsonb_agg(
        jsonb_build_object(
          'guest_id',      g2.id,
          'name',          g2.name,
          'allowed_events', coalesce(g2.events_override, gr2.invited_events)
        ) order by g2.name
      )
      into v_party_members
      from guests g2
      join groups gr2 on gr2.id = g2.group_id
      where g2.party_name = v_guest.party_name;

      select rr.id into v_existing_id
      from rsvp_responses rr
      join guests g3 on g3.id = rr.guest_id
      where g3.party_name = v_guest.party_name
      limit 1;
    else
      v_party_members := jsonb_build_array(
        jsonb_build_object(
          'guest_id',      v_guest.id,
          'name',          v_guest.name,
          'allowed_events', to_jsonb(v_guest.allowed_events)
        )
      );

      select id into v_existing_id
      from rsvp_responses where guest_id = v_guest.id limit 1;
    end if;

    if v_existing_id is not null then
      select jsonb_build_object(
        'events_attending',         to_jsonb(events_attending),
        'member_attendance',        member_attendance,
        'accommodations_requested', to_jsonb(accommodations_requested),
        'accommodation_email',      accommodation_email
      )
      into v_existing_response
      from rsvp_responses where id = v_existing_id;
    end if;

    return json_build_object(
      'found',                 true,
      'already_submitted',     v_existing_id is not null,
      'guest_id',              v_guest.id,
      'name',                  v_guest.name,
      'allowed_events',        v_guest.allowed_events,
      'party_name',            v_guest.party_name,
      'party_members',         v_party_members,
      'travel_accommodations', v_guest.travel_accommodations,
      'existing_response',     v_existing_response
    );
  else
    select id into v_existing_id
    from contact_requests
    where phone = p_phone limit 1;

    return json_build_object(
      'found',                 false,
      'already_submitted',     v_existing_id is not null,
      'guest_id',              null,
      'name',                  null,
      'allowed_events',        coalesce(v_friends_events, array[]::text[]),
      'party_name',            null,
      'party_members',         jsonb_build_array(),
      'travel_accommodations', false
    );
  end if;
end;
$$;

grant execute on function public.lookup_guest_by_phone(text) to anon;
```

---

## 5. Verify

Exactly one `submit_rsvp` should exist, ending in `..., date[], text`:

```sql
select pg_get_function_identity_arguments(oid)
from pg_proc
where proname = 'submit_rsvp';
```

Expected single row:

```
p_guest_id uuid, p_phone text, p_events_attending text[], p_guest_count integer, p_message text, p_member_attendance jsonb, p_accommodations_requested date[], p_accommodation_email text
```

Confirm the column exists:

```sql
select column_name, is_nullable, data_type
from information_schema.columns
where table_name = 'rsvp_responses' and column_name = 'accommodation_email';
```

Then submit a test RSVP with a hotel night + email and confirm the email shows
in **Admin → Accommodations**.
