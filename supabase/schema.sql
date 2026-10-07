create table matches(id text primary key,owner_id uuid default auth.uid() references auth.users,share_token text unique not null,series_id text,data jsonb not null,updated_at timestamptz default now());
create table series(id text primary key,owner_id uuid default auth.uid() references auth.users,share_token text unique not null,name text,best_of int,concluded boolean default false);
alter table matches enable row level security;alter table series enable row level security;
create policy own_matches on matches for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy own_series on series for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create or replace function get_match_by_token(t text) returns jsonb language sql security definer set search_path=public as $$ select data from matches where share_token=t $$;
create or replace function get_series_by_token(t text) returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('series',jsonb_build_object('id',s.id,'token',s.share_token,'name',s.name,'bestOf',s.best_of,'concluded',coalesce(s.concluded,false)),'matches',coalesce((select jsonb_agg(m.data) from matches m where m.series_id=s.id),'[]'::jsonb)) from series s where s.share_token=t $$;
grant execute on function get_match_by_token(text),get_series_by_token(text) to anon,authenticated;
-- Normalised, ball-by-ball tables (written by the app alongside the jsonb snapshot)
create table teams(id text primary key,match_id text references matches(id) on delete cascade,owner_id uuid default auth.uid(),name text,idx int);
create table players(id text primary key,team_id text references teams(id) on delete cascade,owner_id uuid default auth.uid(),name text,pos int);
create table balls(match_id text references matches(id) on delete cascade,innings int,seq int,owner_id uuid default auth.uid(),bowler text,runs int,extra text,wicket jsonb,primary key(match_id,innings,seq));
alter table teams enable row level security;alter table players enable row level security;alter table balls enable row level security;
create policy own_teams on teams for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy own_players on players for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy own_balls on balls for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());

-- Existing project? run: alter table series add column if not exists concluded boolean default false;
