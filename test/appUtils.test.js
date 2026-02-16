// Test script for calculateDateForMonth function
// This function is used ONLY for "FIXO" (fixed) type entries
// Run with: node test/appUtils.test.js

const MONTHS_ORDER = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const calculateDateForMonth = (monthName, baseDate) => {
  if (!monthName || !baseDate) return baseDate;
  
  const monthIndex = MONTHS_ORDER.indexOf(monthName);
  if (monthIndex === -1) return baseDate;
  
  const [year, month, day] = baseDate.split('-').map(Number);
  if (!year || !month || !day) return baseDate;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  let targetYear = currentYear;
  const targetMonth = monthIndex;
  
  if (targetMonth < currentMonth) {
    targetYear = currentYear + 1;
  }
  
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const adjustedDay = Math.min(day, lastDayOfTargetMonth);
  
  const targetDate = new Date(targetYear, targetMonth, adjustedDay);
  return targetDate.toISOString().slice(0, 10);
};

// Mock current date to February 2026
const originalDate = global.Date;
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      super(2026, 1, 15); // February 15, 2026
    } else {
      super(...args);
    }
  }
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    }
  };
}

console.log('\n=== Testes da função calculateDateForMonth ===');
console.log('(Usada apenas para lançamentos do tipo FIXO)\n');

// Testes básicos
test('retorna a data base se monthName for nulo', () => {
  expect(calculateDateForMonth(null, '2026-01-15')).toBe('2026-01-15');
});

test('retorna a data base se baseDate for nulo', () => {
  expect(calculateDateForMonth('Janeiro', null)).toBe(null);
});

test('retorna a data base se monthName for inválido', () => {
  expect(calculateDateForMonth('MêsInválido', '2026-01-15')).toBe('2026-01-15');
});

// Testes de meses no mesmo ano
test('calcula data para Fevereiro (mês atual)', () => {
  expect(calculateDateForMonth('Fevereiro', '2026-02-15')).toBe('2026-02-15');
});

test('calcula data para Março (próximo mês)', () => {
  expect(calculateDateForMonth('Março', '2026-02-15')).toBe('2026-03-15');
});

test('calcula data para Dezembro', () => {
  expect(calculateDateForMonth('Dezembro', '2026-02-15')).toBe('2026-12-15');
});

// Testes de tratamento de dias
test('ajusta dia 31 para Fevereiro (não bissexto)', () => {
  expect(calculateDateForMonth('Fevereiro', '2026-01-31')).toBe('2026-02-28');
});

test('ajusta dia 31 para Abril (30 dias)', () => {
  expect(calculateDateForMonth('Abril', '2026-01-31')).toBe('2026-04-30');
});

test('mantém dia 31 para Dezembro (31 dias)', () => {
  expect(calculateDateForMonth('Dezembro', '2026-01-31')).toBe('2026-12-31');
});

// Testes de transição de ano
test('calcula corretamente quando o mês alvo é no próximo ano', () => {
  expect(calculateDateForMonth('Janeiro', '2026-02-15')).toBe('2027-01-15');
});

// Testes de cenários de lançamentos FIXOS
test('calcula datas corretamente para lançamento FIXO em 3 meses', () => {
  const baseDate = '2026-02-15';
  const meses = ['Fevereiro', 'Março', 'Abril'];
  const results = meses.map(mes => calculateDateForMonth(mes, baseDate));
  
  expect(results[0]).toBe('2026-02-15');
  expect(results[1]).toBe('2026-03-15');
  expect(results[2]).toBe('2026-04-15');
});

test('calcula datas corretamente para lançamento FIXO com dia 31', () => {
  const baseDate = '2026-01-31';
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril'];
  const results = meses.map(mes => calculateDateForMonth(mes, baseDate));
  
  // Janeiro será 2027 (mês anterior ao atual)
  expect(results[0]).toBe('2027-01-31');
  // Fevereiro tem 28 dias em 2026
  expect(results[1]).toBe('2026-02-28');
  // Março tem 31 dias
  expect(results[2]).toBe('2026-03-31');
  // Abril tem 30 dias
  expect(results[3]).toBe('2026-04-30');
});

console.log(`\n=== Resultados ===`);
console.log(`Passou: ${passed}`);
console.log(`Falhou: ${failed}`);
console.log(`Total: ${passed + failed}`);

// Restore original Date
global.Date = originalDate;

process.exit(failed > 0 ? 1 : 0);
