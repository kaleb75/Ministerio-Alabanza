import { useEffect, useRef } from 'react';
import { Bell, CheckCircle, XCircle, Calendar, Inbox, Users, X, CheckCheck } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { NOTIFICATION_TYPES } from '../../services/notificationService';
import './NotificationCenter.css';

const NOTIF_ICONS = {
  [NOTIFICATION_TYPES.REQUEST_SUBMITTED]:  Inbox,
  [NOTIFICATION_TYPES.REQUEST_APPROVED]:   CheckCircle,
  [NOTIFICATION_TYPES.REQUEST_REJECTED]:   XCircle,
  [NOTIFICATION_TYPES.SCHEDULE_UPDATED]:   Calendar,
  [NOTIFICATION_TYPES.EVENT_REASSIGNED]:   Users,
};

const NOTIF_COLORS = {
  [NOTIFICATION_TYPES.REQUEST_SUBMITTED]:  '#0A84FF',
  [NOTIFICATION_TYPES.REQUEST_APPROVED]:   '#30D158',
  [NOTIFICATION_TYPES.REQUEST_REJECTED]:   '#FF453A',
  [NOTIFICATION_TYPES.SCHEDULE_UPDATED]:   '#FF9500',
  [NOTIFICATION_TYPES.EVENT_REASSIGNED]:   '#BF5AF2',
};

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificationCenter({ onClose }) {
  const { notifications, unreadCount, markNotifRead, markAllNotifsRead } = useWorkflow();
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="notif-center" ref={ref}>
      <div className="notif-center__header">
        <div className="notif-center__header-left">
          <Bell size={15} />
          <span className="notif-center__title">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="notif-center__count">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="notif-center__mark-all" onClick={markAllNotifsRead}>
            <CheckCheck size={13} />
            Marcar todo
          </button>
        )}
      </div>

      <div className="notif-center__list">
        {notifications.length === 0 ? (
          <div className="notif-center__empty">
            <Bell size={24} />
            <p>Sin notificaciones</p>
          </div>
        ) : (
          notifications.slice(0, 12).map((notif) => {
            const Icon = NOTIF_ICONS[notif.type] || Bell;
            const color = NOTIF_COLORS[notif.type] || '#636366';
            return (
              <div
                key={notif.id}
                className={`notif-item ${!notif.isRead ? 'notif-item--unread' : ''}`}
                onClick={() => !notif.isRead && markNotifRead(notif.id)}
              >
                <div className="notif-item__icon" style={{ background: `${color}1A` }}>
                  <Icon size={14} color={color} />
                </div>
                <div className="notif-item__content">
                  <span className="notif-item__title">{notif.title}</span>
                  <span className="notif-item__body">{notif.body}</span>
                </div>
                <div className="notif-item__right">
                  <span className="notif-item__time">{timeAgo(notif.createdAt)}</span>
                  {!notif.isRead && <span className="notif-item__dot" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
