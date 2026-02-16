# Análise de Bugs: Campos de Modal em Despesas, Receitas e Cartões

## Data da Análise
2026-02-15

## Ambiente Testado
- **Windows 11**: Chrome com idioma pt-BR (funcionando corretamente)
- **Windows 11**: Chrome com idioma en-US (com bugs)
- **Mobile (Android/iOS)**: Chrome (funcionando corretamente)
- **Linux Debian 13**: Chrome com idioma en-US (com bugs)

---

## 1. Bugs Identificados

### Bug #1: Formato do Campo Data
**Sintoma:** O campo de data exibe `02/15/2026` (formato mm/dd/yyyy) em vez de `15/02/2026` (formato dd/mm/yyyy brasileiro).

### Bug #2: Campo Valor não aceita vírgula como separador decimal
**Sintoma:** O campo de valor não permite digitar vírgula `,` como separador de centavos. Exemplo: `100,50` não é aceito.

---

## 2. Causa Raiz

### Comportamento do HTML5

Os elementos HTML5 `<input type="date">` e `<input type="number">` têm seu comportamento de formatação determinado pelo **idioma configurado no navegador**, não pelo atributo `lang` do HTML.

**Importante:** O atributo `<html lang="pt-BR">` NÃO afeta a formatação desses campos. O navegador usa suas próprias configurações de idioma.

### Tabela de Comportamento

| Idioma do Navegador | Formato de Data | Separador Decimal |
|---------------------|-----------------|-------------------|
| pt-BR | dd/mm/yyyy | Vírgula `,` |
| en-US | mm/dd/yyyy | Ponto `.` |

---

## 3. Código Atual

### Campo de Data
**Arquivos:**
- [`DespesasPage.jsx:601-609`](frontend/src/pages/DespesasPage.jsx:601)
- [`ReceitasPage.jsx:512-520`](frontend/src/pages/ReceitasPage.jsx:512)
- [`CartaoPage.jsx:807-810`](frontend/src/pages/CartaoPage.jsx:807)

```jsx
<input
  type="date"
  value={manualForm.data}
  onChange={(event) => setManualForm((prev) => ({ ...prev, data: event.target.value }))}
/>
```

### Campo de Valor
**Arquivos:**
- [`DespesasPage.jsx:589-599`](frontend/src/pages/DespesasPage.jsx:589)
- [`ReceitasPage.jsx:500-510`](frontend/src/pages/ReceitasPage.jsx:500)
- [`CartaoPage.jsx:803-806`](frontend/src/pages/CartaoPage.jsx:803)

```jsx
<input
  type="number"
  step="0.01"
  value={manualForm.valor}
  onChange={(event) => setManualForm((prev) => ({ ...prev, valor: event.target.value }))}
/>
```

---

## 4. Soluções

### 4.1 Campo de Valor - Usar biblioteca `react-number-format`

**Instalação:**
```bash
npm install react-number-format
```

**Implementação:**
```jsx
import { NumericFormat } from 'react-number-format';

<NumericFormat
  value={manualForm.valor}
  onValueChange={(values) => {
    setManualForm((prev) => ({ ...prev, valor: values.value }));
  }}
  thousandSeparator="."
  decimalSeparator=","
  decimalScale={2}
  fixedDecimalScale
  prefix="R$ "
  allowNegative={false}
  customInput={input}
/>
```

**Vantagens:**
- Força o formato brasileiro independentemente do idioma do navegador
- Não permite entrada de letras
- Formata automaticamente enquanto digita
- Valor retornado é numérico (compatível com banco de dados)

### 4.2 Campo de Data - Usar biblioteca `react-datepicker`

**Instalação:**
```bash
npm install react-datepicker
```

**Implementação:**
```jsx
import DatePicker, { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

<DatePicker
  selected={manualForm.data ? new Date(manualForm.data) : null}
  onChange={(date) => {
    const formattedDate = date ? date.toISOString().split('T')[0] : '';
    setManualForm((prev) => ({ ...prev, data: formattedDate }));
  }}
  dateFormat="dd/MM/yyyy"
  locale="pt-BR"
/>
```

**Vantagens:**
- Exibe sempre no formato dd/mm/yyyy
- Calendar em português
- Valor interno mantido em ISO (YYYY-MM-DD)

---

## 5. Arquivos a Modificar

| Arquivo | Campo Data | Campo Valor |
|---------|------------|-------------|
| [`DespesasPage.jsx`](frontend/src/pages/DespesasPage.jsx) | Linhas 601-609 | Linhas 589-599 |
| [`ReceitasPage.jsx`](frontend/src/pages/ReceitasPage.jsx) | Linhas 512-520 | Linhas 500-510 |
| [`CartaoPage.jsx`](frontend/src/pages/CartaoPage.jsx) | Linhas 807-810 | Linhas 803-806 |

---

## 6. Conclusão

O atributo `<html lang="pt-BR">` não resolve o problema porque os navegadores ignoram esse atributo para formatação de campos de formulário, usando preferencialmente o idioma configurado no próprio navegador.

A solução definitiva requer o uso de bibliotecas JavaScript que permitam controle total sobre a formatação:
- **react-number-format** para campos de valor monetário
- **react-datepicker** para campos de data
