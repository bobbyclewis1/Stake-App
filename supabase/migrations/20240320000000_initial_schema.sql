-- Create tables for our Trello clone

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Boards table
CREATE TABLE public.boards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Lists table
CREATE TABLE public.lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Cards table
CREATE TABLE public.cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
    cover_image TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Labels table
CREATE TABLE public.labels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Card Labels junction table
CREATE TABLE public.card_labels (
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, label_id)
);

-- Checklists table
CREATE TABLE public.checklists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Checklist Items table
CREATE TABLE public.checklist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    assignee_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comments table
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Attachments table
CREATE TABLE public.attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Board Members junction table
CREATE TABLE public.board_members (
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- Activity Log table
CREATE TABLE public.activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_boards_owner_id ON public.boards(owner_id);
CREATE INDEX idx_lists_board_id ON public.lists(board_id);
CREATE INDEX idx_cards_list_id ON public.cards(list_id);
CREATE INDEX idx_checklists_card_id ON public.checklists(card_id);
CREATE INDEX idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);
CREATE INDEX idx_comments_card_id ON public.comments(card_id);
CREATE INDEX idx_attachments_card_id ON public.attachments(card_id);
CREATE INDEX idx_board_members_board_id ON public.board_members(board_id);
CREATE INDEX idx_activity_log_board_id ON public.activity_log(board_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can only read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Boards: Users can view boards they are members of
CREATE POLICY "Users can view boards they are members of" ON public.boards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_members
            WHERE board_id = boards.id
            AND user_id = auth.uid()
        )
    );

-- Add more RLS policies as needed...

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 