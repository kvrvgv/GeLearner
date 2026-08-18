import { useCallback, useEffect, useMemo, useRef } from "react";
import { shuffle } from "../utils/shuffle";

const STORAGE_PREFIX = "gelearner-queue-";

interface PersistedQueue {
  itemsKey: string;
  ids: number[];
  pos: number;
  lastId: number | null;
}

/** Короткий детерминированный хэш (djb2), чтобы ключ в localStorage не раздувался
 *  до списка из сотен id при большом наборе слов. */
function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function loadPersisted(storageKey: string): PersistedQueue | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as PersistedQueue) : null;
  } catch {
    return null;
  }
}

function savePersisted(storageKey: string, data: PersistedQueue) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто работаем без персистентности
  }
}

/**
 * Отдаёт элементы по одному в случайном порядке, не повторяя один и тот же
 * элемент, пока не закончится весь набор (набор пересоздаётся заново после
 * этого, с проверкой чтобы не повторить последний элемент сразу).
 *
 * Если передан storageId, позиция в колоде сохраняется в localStorage и
 * восстанавливается при следующем визите, чтобы один и тот же пользователь на
 * одном устройстве видел меньше повторов между сессиями, а не только в рамках
 * одного открытия страницы. Ключ хранения учитывает конкретный набор элементов
 * (темы/уровень), так что переключение фильтров не затирает прогресс по
 * другой комбинации — у каждой своя запись.
 */
export function useShuffledQueue<T extends { id: number }>(items: T[], storageId?: string) {
  const queueRef = useRef<T[]>([]);
  const posRef = useRef(0);
  const lastIdRef = useRef<number | null>(null);
  const itemsKey = useMemo(() => items.map((i) => i.id).join(","), [items]);
  const itemsKeyRef = useRef<string | null>(null);
  const storageKey = useMemo(
    () => (storageId && items.length > 0 ? `${STORAGE_PREFIX}${storageId}-${hashKey(itemsKey)}` : null),
    [storageId, itemsKey, items.length]
  );

  // Восстанавливаем сохранённую колоду при первом появлении актуального набора элементов
  useEffect(() => {
    if (!storageKey || items.length === 0 || itemsKeyRef.current === itemsKey) return;

    const saved = loadPersisted(storageKey);
    if (saved && saved.itemsKey === itemsKey) {
      const byId = new Map(items.map((i) => [i.id, i]));
      const restored = saved.ids.map((id) => byId.get(id)).filter((x): x is T => !!x);
      if (restored.length === items.length) {
        queueRef.current = restored;
        posRef.current = Math.min(saved.pos, restored.length);
        lastIdRef.current = saved.lastId;
        itemsKeyRef.current = itemsKey;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, itemsKey, items.length]);

  const next = useCallback((): T | null => {
    if (items.length === 0) return null;

    if (itemsKeyRef.current !== itemsKey) {
      itemsKeyRef.current = itemsKey;
      queueRef.current = [];
      posRef.current = 0;
    }

    if (posRef.current >= queueRef.current.length) {
      const fresh = shuffle(items);
      if (fresh.length > 1 && fresh[0].id === lastIdRef.current) {
        [fresh[0], fresh[1]] = [fresh[1], fresh[0]];
      }
      queueRef.current = fresh;
      posRef.current = 0;
    }

    const picked = queueRef.current[posRef.current];
    posRef.current += 1;
    lastIdRef.current = picked.id;

    if (storageKey) {
      savePersisted(storageKey, {
        itemsKey,
        ids: queueRef.current.map((i) => i.id),
        pos: posRef.current,
        lastId: lastIdRef.current,
      });
    }

    return picked;
  }, [items, itemsKey, storageKey]);

  return { next };
}
