/**
 * arr の各要素の直積を返す
 *
 * product([[1,2],[4,5]])
 * ==> [
 *   [1, 4],
 *   [1, 5],
 *   [2, 4],
 *   [2, 5],
 * ]
 * product([[1,2],[4,5],[7,8]])
 * ==> [
 *   [1, 4, 7],
 *   [1, 4, 8],
 *   [1, 5, 7],
 *   [1, 5, 8],
 *   [2, 4, 7],
 *   [2, 4, 8],
 *   [2, 5, 7],
 *   [2, 5, 8],
 * ]
 */
export function* product<T>(arr: T[][], prefix: T[] = []): Generator<T[]> {
  if (arr.length === 0) {
    yield prefix;
  } else {
    for (let i = 0; i < arr[0].length; i++) {
      const result = prefix.concat(arr[0][i]);
      yield* product(arr.slice(1), result);
    }
  }
}
