// Schema SQLite. images/perks como TEXT json; booleans como 0/1.
export function initSchema(d) {
  d.exec(`
    create table if not exists vehicles (
      id text primary key, name text not null, category text, year integer,
      price_per_day real, transmission text, fuel text, seats integer, doors integer,
      luggage integer, ac integer default 1, bluetooth integer default 1, gps integer default 0,
      power text, engine text, color text, plate text, available integer default 1,
      featured integer default 0, description text, images text default '[]',
      sort_order integer default 0,
      created_at text default (datetime('now')), updated_at text default (datetime('now')));
    create table if not exists business_info (
      id integer primary key check (id=1), name text not null, tagline text, phone text,
      whatsapp text, email text, address text, hours text, instagram text,
      years_in_business integer default 0, happy_clients integer default 0, rating real default 5,
      hero_eyebrow text, hero_subtitle text, hero_image_url text, cta_title text, cta_subtitle text,
      about_title text, about_subtitle text, about_mission text, perks text default '[]',
      updated_at text default (datetime('now')));
    create table if not exists app_users (
      id text primary key, name text not null, password_hash text not null, role text,
      created_at text default (datetime('now')));
    insert or ignore into business_info (id, name) values (1, 'DOMI RENT CAR');
  `);
}
