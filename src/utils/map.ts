// map に key が存在すればその値を返し、存在しなければ value を map にセットして value を返す
export function setDefault<T, U>(map: Map<T, U>, key: T, value: U): U {
  if (map.has(key)) {
    return map.get(key) as U;
  }
  map.set(key, value);
  return value;
}

export function setDefaultFunc<T, U>(
  map: Map<T, U>,
  key: T,
  valueFunc: () => U
): U {
  if (map.has(key)) {
    return map.get(key) as U;
  }
  const value = valueFunc();
  map.set(key, value);
  return value;
}
