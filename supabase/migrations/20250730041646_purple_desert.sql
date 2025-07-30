/*
  # Sistema de Contactos Flexible

  1. Nueva Tabla
    - `contacts` - Sistema flexible para personas, empresas, propiedades, deudas
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text, nombre - OBLIGATORIO)
      - `type` (text, tipo - OBLIGATORIO: persona/empresa/alquiler/otro)
      - `amount` (decimal, monto relacionado - OPCIONAL)
      - `notes` (text, notas - OPCIONAL)
      - `reminder_date` (date, fecha recordatorio - OPCIONAL)
      - `linked_transaction_id` (uuid, ID de gasto/ingreso vinculado - OPCIONAL)
      - `status` (text, estado - activo/inactivo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS en tabla `contacts`
    - Políticas para acceso por usuario
*/

-- Tabla de contactos flexible
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('persona', 'empresa', 'alquiler', 'otro')),
  amount decimal(10,2),
  notes text,
  reminder_date date,
  linked_transaction_id uuid,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios gestionen solo sus contactos
CREATE POLICY "Users can manage their own contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(user_id, name);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(user_id, status);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();