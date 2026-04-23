-- Tabela de inventário de cordas da Trovantina
CREATE TABLE IF NOT EXISTS cordas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir dados iniciais
INSERT INTO cordas (categoria, tipo, quantidade) VALUES
  ('Bandolim', 'Dragão', 0),
  ('Bandolim', 'Thomastik', 0),
  ('Guitarra', 'Packs', 0),
  ('Cavaquinho', 'Standard', 0),
  ('Braguesa', 'Standard', 0),
  ('Contra Baixo', 'Standard', 0);

-- Desativar RLS para permitir acesso público (este é um inventário partilhado)
ALTER TABLE cordas ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e escrita a todos (inventário partilhado sem autenticação)
CREATE POLICY "Allow public read" ON cordas FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON cordas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON cordas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON cordas FOR DELETE USING (true);
