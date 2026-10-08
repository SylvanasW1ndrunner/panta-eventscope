import { describe, expect, it } from 'vitest';
import { enqueueNotifications, type MovementNotification } from '../src/features/observations/notifications';
import { NOW, marketId, secondId } from './fixtures/panta';
const movement = (id: string, at = NOW): MovementNotification => ({
  id: `${id}:${at}`, marketId: id, title: `Event ${id}`, observedAt: at, deltaPp: '5', direction: 'up',
});
describe('unacknowledged market movements', () => {
  it('retains simultaneous and later crossings with their market identities', () => {
    const first = enqueueNotifications({ items: [], overflow: 0 }, [movement(marketId), movement(secondId)]);
    const later = enqueueNotifications(first, [movement(marketId, NOW + 30000)]);
    expect(later.items.map(item => item.marketId)).toEqual([marketId, secondId, marketId]);
    expect(later.items[0].title).toContain(marketId);
  });
  it('does not repeat an already retained crossing', () => {
    const queue = enqueueNotifications({ items: [], overflow: 0 }, [movement(marketId)]);
    expect(enqueueNotifications(queue, [movement(marketId)]).items).toHaveLength(1);
  });
  it('bounds the queue without silently evicting unacknowledged items', () => {
    const entries = Array.from({ length: 20 }, (_, i) => movement(marketId, NOW + i * 30000));
    const queue = enqueueNotifications({ items: [], overflow: 0 }, entries);
    expect(queue.items).toHaveLength(16);
    expect(queue.items[0].observedAt).toBe(NOW);
    expect(queue.overflow).toBe(4);
  });
});
