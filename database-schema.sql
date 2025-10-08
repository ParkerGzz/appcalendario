-- ============================================
-- CALENDARIO INTELIGENTE - Database Schema
-- PostgreSQL 15+
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para operaciones geoespaciales
CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- Para jobs programados (opcional)

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL si solo usa OAuth
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(5) DEFAULT 'es',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TABLA: locations
-- ============================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL, -- 'Casa', 'Trabajo', 'Supermercado X'
    address TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    -- PostGIS point para queries geoespaciales
    geom GEOMETRY(Point, 4326), -- SRID 4326 = WGS 84
    service_hours JSONB, -- { "mon": ["09:00-13:00", "15:00-18:00"], ... }
    is_default BOOLEAN DEFAULT FALSE, -- Casa/Trabajo
    location_type VARCHAR(20), -- 'home', 'work', 'place'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);

-- Trigger para actualizar geom automáticamente
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_location_geom
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geom();

-- ============================================
-- TABLA: calendar_accounts
-- ============================================
CREATE TABLE calendar_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'google', 'microsoft', 'icloud'
    provider_account_id VARCHAR(255), -- ID en el proveedor
    email VARCHAR(255),
    -- Tokens cifrados (usar pgcrypto)
    access_token TEXT, -- ENCRYPTED
    refresh_token TEXT, -- ENCRYPTED
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    calendar_list JSONB, -- Lista de calendarios disponibles
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    webhook_id VARCHAR(255), -- Para Google/Microsoft notifications
    webhook_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, provider_account_id)
);

CREATE INDEX idx_calendar_accounts_user_id ON calendar_accounts(user_id);
CREATE INDEX idx_calendar_accounts_webhook ON calendar_accounts(webhook_id) WHERE webhook_id IS NOT NULL;

-- ============================================
-- TABLA: events (eventos sincronizados)
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calendar_account_id UUID REFERENCES calendar_accounts(id) ON DELETE CASCADE,
    provider_event_id VARCHAR(255), -- ID en Google/Microsoft/iCloud
    title VARCHAR(255),
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    location_text TEXT, -- Texto libre si no hay location_id
    is_all_day BOOLEAN DEFAULT FALSE,
    source_calendar VARCHAR(100),
    recurrence_rule TEXT, -- RRULE si es recurrente
    status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'
    is_busy BOOLEAN DEFAULT TRUE, -- Para cálculo de disponibilidad
    attendees JSONB, -- Lista de invitados
    reminders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(calendar_account_id, provider_event_id)
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_time_range ON events(start_time, end_time);
CREATE INDEX idx_events_calendar_account ON events(calendar_account_id);

-- ============================================
-- TABLA: availability_blocks (disponibilidad recurrente)
-- ============================================
CREATE TABLE availability_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100), -- 'Trabajo', 'Gimnasio', 'Almuerzo'
    rrule TEXT, -- RFC 5545 recurrence rule (opcional)
    weekday INTEGER, -- 0=Monday, 6=Sunday (NULL si usa RRULE)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    block_type VARCHAR(20) NOT NULL, -- 'work', 'available', 'blocked', 'flexible'
    is_hard BOOLEAN DEFAULT TRUE, -- true = no se puede sobreescribir
    priority INTEGER DEFAULT 5, -- 1-10, mayor = más importante
    color VARCHAR(7), -- Hex color para UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_availability_user_id ON availability_blocks(user_id);
CREATE INDEX idx_availability_weekday ON availability_blocks(weekday);

-- ============================================
-- TABLA: tasks
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_min INTEGER NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    location_text VARCHAR(255), -- Texto libre si no hay location_id
    -- Ventanas de tiempo (restricciones)
    window_start TIMESTAMP WITH TIME ZONE, -- Earliest posible
    window_end TIMESTAMP WITH TIME ZONE,   -- Latest posible
    deadline DATE,
    priority INTEGER DEFAULT 3, -- 1-5
    must_be_in_person BOOLEAN DEFAULT TRUE,
    prep_min INTEGER DEFAULT 0, -- Tiempo de preparación antes
    buffer_min INTEGER DEFAULT 15, -- Buffer después
    flexible_days INTEGER[], -- [1,2,3,4,5] = Lun-Vie
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- ============================================
-- TABLA: plan_slots (tareas agendadas)
-- ============================================
CREATE TABLE plan_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Información de traslado
    travel_from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    travel_to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    travel_min INTEGER DEFAULT 0,
    travel_mode VARCHAR(20), -- 'driving', 'transit', 'walking', 'bicycling'
    -- Metadatos del plan
    confidence DECIMAL(3, 2) DEFAULT 1.0, -- 0.0-1.0
    score DECIMAL(10, 2), -- Score del algoritmo de scheduling
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'committed', 'modified', 'cancelled'
    committed_at TIMESTAMP WITH TIME ZONE,
    committed_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plan_slots_task_id ON plan_slots(task_id);
CREATE INDEX idx_plan_slots_time_range ON plan_slots(scheduled_start, scheduled_end);
CREATE INDEX idx_plan_slots_status ON plan_slots(status);

-- ============================================
-- TABLA: distance_cache
-- ============================================
CREATE TABLE distance_cache (
    origin_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    dest_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    time_bucket VARCHAR(20) NOT NULL, -- 'morning', 'midday', 'afternoon', 'evening'
    travel_mode VARCHAR(20) NOT NULL DEFAULT 'driving',
    distance_km DECIMAL(10, 2),
    travel_min INTEGER,
    traffic_factor DECIMAL(3, 2), -- Multiplicador por tráfico
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (origin_id, dest_id, time_bucket, travel_mode)
);

CREATE INDEX idx_distance_cache_updated ON distance_cache(updated_at);

-- Limpiar cache viejo (más de 7 días)
CREATE OR REPLACE FUNCTION cleanup_old_distance_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM distance_cache
    WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLA: activity_log (auditoría)
-- ============================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'task_created', 'plan_generated', 'event_synced'
    entity_type VARCHAR(50), -- 'task', 'event', 'plan_slot'
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- ============================================
-- TABLA: sync_errors (errores de sincronización)
-- ============================================
CREATE TABLE sync_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
    error_type VARCHAR(50),
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_errors_calendar_account ON sync_errors(calendar_account_id);
CREATE INDEX idx_sync_errors_resolved ON sync_errors(resolved) WHERE NOT resolved;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Eventos y tareas agendadas combinadas
CREATE VIEW calendar_items AS
SELECT
    'event' AS item_type,
    e.id,
    e.user_id,
    e.title,
    e.start_time,
    e.end_time,
    e.location_text AS location,
    e.is_all_day,
    NULL AS priority,
    'external' AS source
FROM events e
WHERE e.status != 'cancelled'

UNION ALL

SELECT
    'task' AS item_type,
    ps.id,
    t.user_id,
    t.title,
    ps.scheduled_start AS start_time,
    ps.scheduled_end AS end_time,
    l.label AS location,
    FALSE AS is_all_day,
    t.priority,
    'internal' AS source
FROM plan_slots ps
JOIN tasks t ON ps.task_id = t.id
LEFT JOIN locations l ON t.location_id = l.id
WHERE ps.status IN ('draft', 'committed');

-- Vista: Disponibilidad calculada por día
CREATE VIEW daily_availability AS
SELECT
    u.id AS user_id,
    generate_series(
        date_trunc('day', NOW()),
        date_trunc('day', NOW() + INTERVAL '30 days'),
        INTERVAL '1 day'
    )::date AS date,
    ab.start_time,
    ab.end_time,
    ab.block_type
FROM users u
CROSS JOIN availability_blocks ab
WHERE ab.user_id = u.id
  AND (ab.weekday IS NULL OR ab.weekday = EXTRACT(ISODOW FROM generate_series)::INTEGER - 1);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función: Calcular huecos libres en un día
CREATE OR REPLACE FUNCTION calculate_free_slots(
    p_user_id UUID,
    p_date DATE
)
RETURNS TABLE(start_time TIMESTAMP WITH TIME ZONE, end_time TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    -- Implementación simplificada
    -- TODO: Restar eventos y availability_blocks de las 24 horas del día
    RETURN QUERY
    SELECT
        (p_date + TIME '09:00')::TIMESTAMP WITH TIME ZONE,
        (p_date + TIME '18:00')::TIMESTAMP WITH TIME ZONE;
END;
$$ LANGUAGE plpgsql;

-- Función: Calcular distancia entre dos ubicaciones
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- Radio de la Tierra en km
    dLat DECIMAL;
    dLng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := radians(lat2 - lat1);
    dLng := radians(lng2 - lng1);

    a := sin(dLat/2) * sin(dLat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dLng/2) * sin(dLng/2);

    c := 2 * atan2(sqrt(a), sqrt(1-a));

    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_calendar_accounts_updated_at BEFORE UPDATE ON calendar_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plan_slots_updated_at BEFORE UPDATE ON plan_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DATOS INICIALES (SEEDS)
-- ============================================

-- Insertar usuario de ejemplo (dev only)
-- INSERT INTO users (email, timezone, language)
-- VALUES ('test@example.com', 'America/Santiago', 'es');

-- ============================================
-- JOBS PROGRAMADOS (con pg_cron)
-- ============================================

-- Limpiar cache de distancias viejo (diario a las 3 AM)
-- SELECT cron.schedule('cleanup-distance-cache', '0 3 * * *', 'SELECT cleanup_old_distance_cache();');

-- Sincronizar calendarios (cada 15 minutos)
-- SELECT cron.schedule('sync-calendars', '*/15 * * * *', 'SELECT sync_all_calendars();');

-- ============================================
-- INDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Índice compuesto para búsqueda de eventos en rango de fechas por usuario
CREATE INDEX idx_events_user_time_composite ON events(user_id, start_time, end_time);

-- Índice para búsqueda geoespacial de ubicaciones cercanas
-- (usa PostGIS GIST index ya creado arriba)

-- Índice para tareas pendientes ordenadas por prioridad y deadline
CREATE INDEX idx_tasks_pending_priority ON tasks(user_id, status, priority DESC, deadline ASC)
WHERE status = 'pending';

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE users IS 'Usuarios de la aplicación';
COMMENT ON TABLE locations IS 'Ubicaciones guardadas (casa, trabajo, lugares frecuentes)';
COMMENT ON TABLE calendar_accounts IS 'Cuentas de calendario externas (Google, Microsoft, iCloud)';
COMMENT ON TABLE events IS 'Eventos sincronizados desde calendarios externos';
COMMENT ON TABLE availability_blocks IS 'Bloques de disponibilidad recurrente (ej: horario de trabajo)';
COMMENT ON TABLE tasks IS 'Tareas por agendar';
COMMENT ON TABLE plan_slots IS 'Slots agendados para tareas (resultado del planificador)';
COMMENT ON TABLE distance_cache IS 'Cache de distancias entre ubicaciones por franja horaria';
COMMENT ON TABLE activity_log IS 'Log de actividad del usuario para auditoría';
COMMENT ON TABLE sync_errors IS 'Errores de sincronización con calendarios externos';
