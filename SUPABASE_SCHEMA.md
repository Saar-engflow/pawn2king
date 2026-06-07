# Supabase Data Model: Pawn2King Ecosystem

This document outlines the database schema for the Pawn2King application, including user profiles, daily routines, journals, goals, and addiction tracking.

## Table: `profiles`

The core user table in the `public` schema. It extends the base `auth.users` with application-specific metadata.

### Schema Definition

```sql
-- Create the profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    rank TEXT CHECK (rank IN ('Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King')) DEFAULT 'Pawn',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profiles"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trigger for updating the updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, username)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'username'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## Table: `daily_routines`

Stores the tactical objectives and habits for each user.

### Schema Definition

```sql
CREATE TABLE daily_routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    category TEXT CHECK (category IN ('morning', 'deep-work', 'evening', 'general')) DEFAULT 'general',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: `daily_routine_logs`
-- Logs the completion status of the daily routine for each day.
CREATE TABLE daily_routine_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    is_fully_completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Enable RLS for logs
ALTER TABLE daily_routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own routine logs"
    ON daily_routine_logs FOR ALL
    USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own routines"
    ON daily_routines FOR ALL
    USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_daily_routines_updated_at
    BEFORE UPDATE ON daily_routines
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

---

## Table: `journals`

Stores tactical reflections and mission reports.

### Schema Definition

```sql
CREATE TABLE journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Mission Report',
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own journals"
    ON journals FOR ALL
    USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

---

## Table: `goals`

Tracks long-term missions and objectives.

### Schema Definition

```sql
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
    category TEXT CHECK (category IN ('business', 'spiritual', 'physical', 'mental')) DEFAULT 'business',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own goals"
    ON goals FOR ALL
    USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

---

## Table: `addictions`

Stores the current state of each tracked addiction.

### Schema Definition

```sql
CREATE TABLE addictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    last_relapse_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE addictions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own addictions"
    ON addictions FOR ALL
    USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_addictions_updated_at
    BEFORE UPDATE ON addictions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

---

## Table: `relapse_history`

Stores each individual relapse event for an addiction.

### Schema Definition

```sql
CREATE TABLE relapse_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    addiction_id UUID REFERENCES public.addictions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reason TEXT,
    streak_before_relapse TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE relapse_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own relapse history"
    ON relapse_history FOR ALL
    USING (auth.uid() = user_id);

---

## Table: `calendar_events`

Stores events and tasks for the mission calendar.

### Schema Definition

```sql
CREATE TABLE calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    color TEXT DEFAULT 'blue',
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own calendar events"
    ON calendar_events FOR ALL
    USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```
```

---

## Shared Utilities

### Update Timestamp Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```
