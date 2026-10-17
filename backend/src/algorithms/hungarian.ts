/**
 * Hungarian algorithm (Kuhn-Munkres) for minimum-cost assignment.
 * Cost matrix: rows = orders, cols = delivery persons.
 * Returns assignment pairs [rowIndex, colIndex] minimizing total cost.
 */
export function hungarianAssign(cost: number[][]): Array<[number, number]> {
  const nRows = cost.length;
  if (nRows === 0) return [];
  const nCols = cost[0]?.length ?? 0;
  if (nCols === 0) return [];

  const n = Math.max(nRows, nCols);
  /** Custo 0 em linhas/colunas fictícias = pedido ou entregador não pareado. */
  const matrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i < nRows && j < nCols) return cost[i]![j]!;
      return 0;
    }),
  );

  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0]!;
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = matrix[i0 - 1]![j - 1]! - u[i0]! - v[j]!;
        if (cur < minv[j]!) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j]! < delta) {
          delta = minv[j]!;
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]!]! += delta;
          v[j]! -= delta;
        } else {
          minv[j]! -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0]!;
      p[j0] = p[j1]!;
      j0 = j1;
    } while (j0 !== 0);
  }

  const result: Array<[number, number]> = [];
  for (let j = 1; j <= n; j++) {
    const i = p[j]!;
    if (i > 0 && i <= nRows && j > 0 && j <= nCols) {
      result.push([i - 1, j - 1]);
    }
  }
  return result;
}
