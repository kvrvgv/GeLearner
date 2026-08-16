import { useCallback, useMemo, useRef } from "react";
import { shuffle } from "../utils/shuffle";

/**
 * Отдаёт элементы по одному в случайном порядке, не повторяя один и тот же
 * элемент, пока не закончится весь набор (набор пересоздаётся заново после
 * этого, с проверкой чтобы не повторить последний элемент сразу).
 */
export function useShuffledQueue<T extends { id: number }>(items: T[]) {
  const queueRef = useRef<T[]>([]);
  const posRef = useRef(0);
  const lastIdRef = useRef<number | null>(null);
  const itemsKey = useMemo(() => items.map((i) => i.id).join(","), [items]);
  const itemsKeyRef = useRef(itemsKey);

  const next = useCallback((): T | null => {
    if (items.length === 0) return null;

    if (itemsKeyRef.current !== itemsKey) {
      itemsKeyRef.current = itemsKey;
      queueRef.current = [];
      posRef.current = 0;
    }

    if (posRef.current >= queueRef.current.length) {
      let fresh = shuffle(items);
      if (fresh.length > 1 && fresh[0].id === lastIdRef.current) {
        [fresh[0], fresh[1]] = [fresh[1], fresh[0]];
      }
      queueRef.current = fresh;
      posRef.current = 0;
    }

    const picked = queueRef.current[posRef.current];
    posRef.current += 1;
    lastIdRef.current = picked.id;
    return picked;
  }, [items, itemsKey]);

  return { next };
}
