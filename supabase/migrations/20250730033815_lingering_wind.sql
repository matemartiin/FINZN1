/*
  # Sistema de Gestión de Clientes

  1. Nueva Tabla
    - `clients` - Gestión completa de clientes con información detallada
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, nombre completo)
      - `email` (text, email del cliente)
      - `phone` (text, teléfono)
      - `address` (text, dirección)
      - `birth_date` (date, fecha de nacimiento)
      - `age_range` (text, rango etario calculado)
      - `client_type` (text, tipo de cliente)
      - `notes` (text, notas adicionales)
      - `status` (text, estado activo/inactivo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS en tabla `clients`
    - Políticas para que usuarios accedan solo a sus clientes
*/

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  birth_date date,
  age_range text,
  client_type text DEFAULT 'individual',
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios gestionen solo sus clientes
CREATE POLICY "Users can manage their own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(user_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_age_range ON clients(user_id, age_range);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular rango etario
CREATE OR REPLACE FUNCTION calculate_age_range(birth_date date)
RETURNS text AS $$
DECLARE
    age integer;
BEGIN
    IF birth_date IS NULL THEN
        RETURN 'no_definido';
    END IF;
    
    age := EXTRACT(YEAR FROM AGE(birth_date));
    
    IF age < 18 THEN
        RETURN 'menor_18';
    ELSIF age BETWEEN 18 AND 25 THEN
        RETURN '18_25';
    ELSIF age BETWEEN 26 AND 35 THEN
        RETURN '26_35';
    ELSIF age BETWEEN 36 AND 50 THEN
        RETURN '36_50';
    ELSE
        RETURN '51_mas';
    END IF;
END;
$$ LANGUAGE plpgsql;