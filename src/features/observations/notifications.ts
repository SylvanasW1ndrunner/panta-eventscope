export type MovementNotification = { id: string; marketId: string; title: string; observedAt: number; deltaPp: string; direction: 'up' | 'down' };
export type NotificationQueue = { items: MovementNotification[]; overflow: number };
export function enqueueNotifications(queue: NotificationQueue, incoming: MovementNotification[]): NotificationQueue {
  const items = [...queue.items]; const retained = new Set(items.map(item => item.id));
  let overflow = queue.overflow;
  for (const notification of incoming) {
    if (retained.has(notification.id)) continue;
    retained.add(notification.id);
    if (items.length < 16) items.push({ ...notification });
    else overflow++;
  }
  return { items, overflow };
}
