// src/utils/dateUtils.js

/**
 * Retorna um objeto com startDate e endDate (em epoch milliseconds)
 * baseado no período selecionado: 'DAILY', 'WEEKLY', 'MONTHLY'.
 */
export const getPeriodTimestamps = (period) => {
  const now = new Date();
  let startDate = new Date();
  
  if (period === 'DAILY') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'WEEKLY') {
    // Retrocede para o início da semana (Segunda-feira)
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'MONTHLY') {
    // Primeiro dia do mês
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    // Default: Hoje
    startDate.setHours(0, 0, 0, 0);
  }

  // endDate é o final do dia atual
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: startDate.getTime(),
    endDate: endDate.getTime()
  };
}
