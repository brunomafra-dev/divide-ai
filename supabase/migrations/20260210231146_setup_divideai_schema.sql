-- Tabela de perfis de usuários (estende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de grupos
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('apartment', 'house', 'trip', 'other')) DEFAULT 'other',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros de grupos
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  is_registered BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de despesas
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payer_id UUID REFERENCES public.group_members(id) ON DELETE SET NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de participantes em cada despesa
CREATE TABLE public.expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.group_members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, member_id)
);

-- Tabela de amizades
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Índices para performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX idx_expense_participants_member_id ON public.expense_participants(member_id);
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS (Row Level Security) Policies

-- Perfis: usuários podem ver e editar apenas seu próprio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Grupos: apenas membros podem ver
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver seus grupos"
  ON public.groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() OR id IN (
        SELECT id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Usuários podem criar grupos"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criadores podem atualizar grupos"
  ON public.groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Criadores podem deletar grupos"
  ON public.groups FOR DELETE
  USING (auth.uid() = created_by);

-- Membros de grupos: apenas membros do grupo podem ver
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver membros do grupo"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem adicionar membros"
  ON public.group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem remover membros"
  ON public.group_members FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

-- Despesas: apenas membros do grupo podem ver
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver despesas do grupo"
  ON public.expenses FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar despesas"
  ON public.expenses FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem atualizar despesas"
  ON public.expenses FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem deletar despesas"
  ON public.expenses FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

-- Participantes de despesas: apenas membros do grupo podem ver
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver participantes de despesas"
  ON public.expense_participants FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE group_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Membros podem adicionar participantes"
  ON public.expense_participants FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE group_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Amizades: usuários podem ver suas próprias amizades
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas amizades"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Usuários podem criar solicitações de amizade"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas amizades"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Usuários podem deletar suas amizades"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
