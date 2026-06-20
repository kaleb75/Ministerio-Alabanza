import { supabase } from '../lib/supabase';
import { REQUEST_STATUS } from '../utils/workflowRules';

function fromRow(r) {
  return {
    id: r.id,
    requesterId: r.requester_id,
    requesterName: r.requester_name,
    requesterRole: r.requester_role,
    originalEventId: r.original_event_id,
    originalEventTitle: r.original_event_title,
    originalDate: r.original_date,
    requestType: r.request_type,
    requestedDate: r.requested_date,
    swapWithEventId: r.swap_with_event_id,
    swapWithDirectorName: r.swap_with_director_name,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    reviewedBy: r.reviewed_by,
    reviewedByName: r.reviewed_by_name,
    reviewedAt: r.reviewed_at,
    reviewComment: r.review_comment,
  };
}

export async function getAllRequests() {
  const { data, error } = await supabase
    .from('requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getRequestsByUser(userId) {
  const { data, error } = await supabase
    .from('requests').select('*').eq('requester_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getPendingRequests() {
  const { data, error } = await supabase
    .from('requests').select('*').eq('status', REQUEST_STATUS.PENDING).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createRequest(data) {
  const { data: row, error } = await supabase
    .from('requests')
    .insert({
      id: 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      requester_id: data.requesterId,
      requester_name: data.requesterName,
      requester_role: data.requesterRole,
      original_event_id: data.originalEventId,
      original_event_title: data.originalEventTitle,
      original_date: data.originalDate,
      request_type: data.requestType,
      requested_date: data.requestedDate || null,
      swap_with_event_id: data.swapWithEventId || null,
      swap_with_director_name: data.swapWithDirectorName || null,
      reason: data.reason,
      status: REQUEST_STATUS.PENDING,
      reviewed_by: null,
      reviewed_by_name: null,
      reviewed_at: null,
      review_comment: null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row);
}

export async function approveRequest(requestId, reviewerId, reviewerName, comment) {
  const { data: row, error } = await supabase
    .from('requests')
    .update({
      status: REQUEST_STATUS.APPROVED,
      reviewed_by: reviewerId,
      reviewed_by_name: reviewerName,
      reviewed_at: new Date().toISOString(),
      review_comment: comment || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', REQUEST_STATUS.PENDING)
    .select()
    .single();
  if (error) return null;
  return fromRow(row);
}

export async function rejectRequest(requestId, reviewerId, reviewerName, reason) {
  const { data: row, error } = await supabase
    .from('requests')
    .update({
      status: REQUEST_STATUS.REJECTED,
      reviewed_by: reviewerId,
      reviewed_by_name: reviewerName,
      reviewed_at: new Date().toISOString(),
      review_comment: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', REQUEST_STATUS.PENDING)
    .select()
    .single();
  if (error) return null;
  return fromRow(row);
}

export async function cancelRequest(requestId) {
  const { data: row, error } = await supabase
    .from('requests')
    .update({
      status: REQUEST_STATUS.CANCELLED,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();
  if (error) return null;
  return fromRow(row);
}
