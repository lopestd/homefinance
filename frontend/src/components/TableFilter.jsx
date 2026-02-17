import { useState } from "react";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Componente para renderizar controles de filtro em uma coluna da tabela
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.columnConfig - Configuração da coluna
 * @param {any} props.filterValue - Valor atual do filtro
 * @param {Function} props.onFilterChange - Callback para alterar o valor do filtro
 * @param {Function} props.onClearFilter - Callback para limpar o filtro
 * @param {Object} props.sortConfig - Configuração atual de ordenação
 * @param {Function} props.onSortToggle - Callback para alternar ordenação
 * @param {Function} props.onSortDirectionChange - Callback para definir direção de ordenação
 */
const TableFilter = ({
  columnConfig,
  filterValue,
  onFilterChange,
  onClearFilter,
  sortConfig,
  onSortToggle
}) => {
  const [localValue, setLocalValue] = useState(filterValue || '');

  const isSorted = sortConfig.column === columnConfig.key;
  const hasFilter = filterValue !== null && filterValue !== '' && filterValue !== undefined;

  const handleFilterChange = (value) => {
    setLocalValue(value);
    onFilterChange(value);
  };

  const handleClearFilter = () => {
    setLocalValue('');
    onClearFilter();
  };

  const handleSortClick = () => {
    onSortToggle(columnConfig.key);
  };

  const renderFilterInput = () => {
    switch (columnConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            className="table-filter__input"
            placeholder="Buscar..."
            value={localValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'select':
        return (
          <select
            className="table-filter__select"
            value={localValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Todos</option>
            {columnConfig.options && columnConfig.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <DatePicker
            className="table-filter__date"
            selected={localValue ? new Date(localValue) : null}
            onChange={(date) => handleFilterChange(date ? date.toISOString().split('T')[0] : '')}
            dateFormat="dd/MM/yyyy"
            locale={ptBR}
            placeholderText="dd/mm/aaaa"
            isClearable
            popperPlacement="bottom-start"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className="table-filter__input"
            placeholder="Valor..."
            value={localValue}
            onChange={(e) => handleFilterChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`list-table__header-cell ${hasFilter ? 'has-filter' : ''}`}>
      <div className="list-table__header-label" onClick={handleSortClick}>
        <span>{columnConfig.label}</span>
        {isSorted && (
          <span className="sort-indicator">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>

      <div className="table-filter">
        {renderFilterInput()}
        {hasFilter && (
          <button
            type="button"
            className="table-filter__clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilter();
            }}
            title="Limpar filtro"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default TableFilter;
