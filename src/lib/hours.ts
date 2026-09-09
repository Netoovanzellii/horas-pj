/**
 * Regra de cálculo de saldo/excedente da franquia de horas.
 * Contratadas - Utilizadas = Saldo. Se negativo → Saldo = 0 e Excedente = |valor|.
 */
export interface HoursBalance {
  contractedMinutes: number;
  usedMinutes: number;
  availableMinutes: number;
  overageMinutes: number;
  percentUsed: number; // 0-100+ (pode passar de 100 se houver excedente)
}

export function calcBalance(contractedMinutes: number, usedMinutes: number): HoursBalance {
  const diff = contractedMinutes - usedMinutes;
  const availableMinutes = diff > 0 ? diff : 0;
  const overageMinutes = diff < 0 ? Math.abs(diff) : 0;
  const percentUsed = contractedMinutes > 0 ? Math.round((usedMinutes / contractedMinutes) * 1000) / 10 : 0;
  return {
    contractedMinutes,
    usedMinutes,
    availableMinutes,
    overageMinutes,
    percentUsed,
  };
}
