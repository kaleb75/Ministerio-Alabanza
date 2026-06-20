import { supabase } from '../lib/supabase';

function fromRow(r) {
  return {
    id: r.id,
    actionType: r.action_type,
    performedBy: r.performed_by,
    performedByName: r.performed_by_name,
    targetEntity: r.target_entity,
    targetEntityId: r.target_entity_id,
    description: r.description,
    previousValue: r.previous_value,
    newValue: r.new_value,
    timestamp: r.timestamp,
  };
}

export async function getAllAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getAuditLogsForEntity(entityId) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('target_entity_id', String(entityId))
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createAuditLog(entry) {
  const { data: row, error } = await supabase
    .from('audit_logs')
    .insert({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      action_type: entry.actionType,
      performed_by: entry.performedBy,
      performed_by_name: entry.performedByName,
      target_entity: entry.targetEntity,
      target_entity_id: String(entry.targetEntityId || ''),
      description: entry.description || '',
      previous_value: entry.previousValue ?? null,
      new_value: entry.newValue ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row);
}

export const ACTION_TYPES = {
  REQUEST_CREATED: 'request_created',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_CANCELLED: 'request_cancelled',
  EVENT_UPDATED: 'event_updated',
};

export const ACTION_LABELS = {
  request_created: 'Solicitud creada',
  request_approved: 'Solicitud aprobada',
  request_rejected: 'Solicitud rechazada',
  request_cancelled: 'Solicitud cancelada',
  event_updated: 'Evento actualizado',
};

export const ACTION_COLORS = {
  request_created: '#0A84FF',
  request_approved: '#30D158',
  request_rejected: '#FF453A',
  request_cancelled: '#636366',
  event_updated: '#FF9500',
};
