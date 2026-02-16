# Testes do HomeFinance

Esta pasta contém testes automatizados para o sistema HomeFinance.

## Estrutura

```
test/
├── appUtils.test.js    # Testes da função calculateDateForMonth
└── README.md           # Este arquivo
```

## Como Executar os Testes

### Executar todos os testes
```bash
node test/appUtils.test.js
```

## Testes Disponíveis

### appUtils.test.js

Testes da função `calculateDateForMonth` que calcula datas para lançamentos do tipo **FIXO**.

**Nota:** Esta função NÃO é usada para lançamentos PARCELADOS. Para lançamentos parcelados, todas as parcelas mantêm a mesma data do lançamento inicial.

**Casos testados:**
- Retorno da data base quando parâmetros são nulos ou inválidos
- Cálculo de datas para meses no mesmo ano
- Tratamento de dias em meses com diferentes quantidades de dias
- Transição de ano (quando o mês alvo é no próximo ano)
- Cenários de lançamentos FIXOS

**Resultado esperado:**
```
=== Testes da função calculateDateForMonth ===
(Usada apenas para lançamentos do tipo FIXO)

✓ retorna a data base se monthName for nulo
✓ retorna a data base se baseDate for nulo
✓ retorna a data base se monthName for inválido
✓ calcula data para Fevereiro (mês atual)
✓ calcula data para Março (próximo mês)
✓ calcula data para Dezembro
✓ ajusta dia 31 para Fevereiro (não bissexto)
✓ ajusta dia 31 para Abril (30 dias)
✓ mantém dia 31 para Dezembro (31 dias)
✓ calcula corretamente quando o mês alvo é no próximo ano
✓ calcula datas corretamente para lançamento FIXO em 3 meses
✓ calcula datas corretamente para lançamento FIXO com dia 31

=== Resultados ===
Passou: 12
Falhou: 0
Total: 12
```

## Comportamento de Datas por Tipo de Lançamento

### Lançamentos PARCELADOS
- **Comportamento:** Todas as parcelas mantêm a mesma data do lançamento inicial
- **Exemplo:** 3 parcelas com data 15/01/2026 → Todas com data 15/01/2026

### Lançamentos FIXOS
- **Comportamento:** Cada mês tem a data correspondente, mantendo o mesmo dia
- **Exemplo:** 3 meses (Jan, Fev, Mar) com data base 15/01/2026:
  - Janeiro: 15/01/2026
  - Fevereiro: 15/02/2026
  - Março: 15/03/2026

## Adicionando Novos Testes

Para adicionar novos testes, crie um novo arquivo `.test.js` nesta pasta seguindo o padrão existente:

```javascript
// Novo arquivo: test/novaFuncionalidade.test.js

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

// Seus testes aqui
test('descrição do teste', () => {
  expect(resultado).toBe(esperado);
});
```
