import { useMemo, useState } from "react";

const isEmptyFilterValue = (value) =>
  value === null || value === "" || value === undefined;

const normalizeSmartSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getSmartSearchTerms = (value, columnConfig) => {
  const minimumLength = Number.isInteger(columnConfig?.minimumSearchLength)
    ? columnConfig.minimumSearchLength
    : 3;

  return normalizeSmartSearchText(value)
    .split(" ")
    .filter((term) => term.length >= minimumLength);
};

const isSmartTextFilter = (columnConfig) =>
  columnConfig?.type === "text" &&
  Array.isArray(columnConfig.searchFields) &&
  columnConfig.searchFields.length > 0;

const isFilterActive = (columnKey, filterValue, columnConfigs) => {
  if (isEmptyFilterValue(filterValue)) return false;

  const columnConfig = columnConfigs[columnKey];
  if (isSmartTextFilter(columnConfig)) {
    return getSmartSearchTerms(filterValue, columnConfig).length > 0;
  }

  return true;
};

/**
 * Hook customizado para gerenciar filtros e ordenação em tabelas
 * @param {Array} items - Lista de itens a ser filtrada/ordenada
 * @param {Object} columnConfigs - Configuração de cada coluna
 * @param {Object} initialSort - Ordenação inicial opcional ({ column, direction })
 * @returns {Object} Objeto com funções e estados para gerenciar filtros e ordenação
 */
const useTableFilters = (items, columnConfigs, initialSort = { column: null, direction: "asc" }) => {
  // Estado para filtros por coluna
  const [filters, setFilters] = useState({});

  // Estado para ordenação
  const [sortConfig, setSortConfig] = useState(initialSort);

  /**
   * Aplica filtros aos itens
   * @param {Array} items - Lista de itens
   * @param {Object} filters - Objeto com filtros ativos
   * @param {Object} columnConfigs - Configuração de colunas
   * @returns {Array} Itens filtrados
   */
  const applyFilters = (items, filters, columnConfigs) => {
    return items.filter((item) => {
      return Object.entries(filters).every(([columnKey, filterValue]) => {
        if (!isFilterActive(columnKey, filterValue, columnConfigs)) {
          return true;
        }

        const columnConfig = columnConfigs[columnKey];
        if (!columnConfig) return true;

        const itemValue = columnConfig.transformValue
          ? columnConfig.transformValue(item[columnKey])
          : item[columnKey];

        switch (columnConfig.type) {
          case "text": {
            if (isSmartTextFilter(columnConfig)) {
              const searchTerms = getSmartSearchTerms(filterValue, columnConfig);
              const searchableText = normalizeSmartSearchText(
                columnConfig.searchFields
                  .map((field) => item[field])
                  .filter((value) => value !== null && value !== undefined)
                  .join(" ")
              );

              return columnConfig.matchMode === "anyTerms"
                ? searchTerms.some((term) => searchableText.includes(term))
                : searchTerms.every((term) => searchableText.includes(term));
            }

            const searchText = String(filterValue).toLowerCase();
            const itemText = String(itemValue || "").toLowerCase();
            return itemText.includes(searchText);
          }

          case "select": {
            return String(itemValue) === String(filterValue);
          }

          case "date": {
            const filterDate = new Date(filterValue);
            const itemDate = new Date(itemValue);
            return (
              filterDate.getDate() === itemDate.getDate() &&
              filterDate.getMonth() === itemDate.getMonth() &&
              filterDate.getFullYear() === itemDate.getFullYear()
            );
          }

          case "number": {
            const filterNum = parseFloat(filterValue);
            const itemNum = parseFloat(itemValue);
            return !isNaN(filterNum) && !isNaN(itemNum) && itemNum === filterNum;
          }

          default: {
            return true;
          }
        }
      });
    });
  };

  /**
   * Aplica ordenação aos itens
   * @param {Array} items - Lista de itens
   * @param {Object} sortConfig - Configuração de ordenação
   * @param {Object} columnConfigs - Configuração de colunas
   * @returns {Array} Itens ordenados
   */
  const applySort = (items, sortConfig, columnConfigs) => {
    if (!sortConfig.column) return items;

    const columnConfig = columnConfigs[sortConfig.column];
    const hasConfiguredColumn = Boolean(columnConfig && columnConfig.sortable);

    return [...items].sort((a, b) => {
      const aValue = hasConfiguredColumn && columnConfig.transformValue
        ? columnConfig.transformValue(a[sortConfig.column])
        : a[sortConfig.column];
      const bValue = hasConfiguredColumn && columnConfig.transformValue
        ? columnConfig.transformValue(b[sortConfig.column])
        : b[sortConfig.column];

      let comparison = 0;

      if (hasConfiguredColumn) {
        switch (columnConfig.type) {
          case "date":
            comparison = new Date(aValue) - new Date(bValue);
            break;

          case "number":
            comparison = parseFloat(aValue) - parseFloat(bValue);
            break;

          case "text":
          case "select":
          default:
            // Ordenação alfabética (case-insensitive)
            comparison = String(aValue || "").toLowerCase().localeCompare(
              String(bValue || "").toLowerCase()
            );
            break;
        }
      } else {
        const aNum = Number(aValue);
        const bNum = Number(bValue);

        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = String(aValue || "").localeCompare(String(bValue || ""), undefined, {
            numeric: true,
            sensitivity: "base"
          });
        }
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  };

  /**
   * Aplica filtros e ordenação aos itens
   */
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Aplicar filtros
    result = applyFilters(result, filters, columnConfigs);

    // Aplicar ordenação
    result = applySort(result, sortConfig, columnConfigs);

    return result;
  }, [items, filters, sortConfig, columnConfigs]);

  /**
   * Define o valor do filtro para uma coluna
   * @param {string} column - Chave da coluna
   * @param {any} value - Valor do filtro
   */
  const setColumnFilter = (column, value) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value
    }));
  };

  /**
   * Limpa o filtro de uma coluna
   * @param {string} column - Chave da coluna
   */
  const clearColumnFilter = (column) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  /**
   * Limpa todos os filtros
   */
  const clearAllFilters = () => {
    setFilters({});
  };

  /**
   * Alterna a ordenação de uma coluna
   * @param {string} column - Chave da coluna
   */
  const toggleSort = (column) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        // Se a mesma coluna, alterna entre asc/desc/null
        if (prev.direction === "asc") {
          return { column, direction: "desc" };
        } else {
          return { column: null, direction: "asc" };
        }
      } else {
        // Nova coluna, começa com asc
        return { column, direction: "asc" };
      }
    });
  };

  /**
   * Define a direção de ordenação para uma coluna
   * @param {string} column - Chave da coluna
   * @param {string} direction - Direção ('asc' ou 'desc')
   */
  const setSortDirection = (column, direction) => {
    setSortConfig({ column, direction });
  };

  /**
   * Verifica se há filtros ativos
   */
  const hasActiveFilters = Object.keys(filters).some(
    (key) => isFilterActive(key, filters[key], columnConfigs)
  );

  /**
   * Conta quantos filtros estão ativos
   */
  const activeFiltersCount = Object.keys(filters).filter(
    (key) => isFilterActive(key, filters[key], columnConfigs)
  ).length;

  return {
    filteredAndSortedItems,
    filters,
    sortConfig,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    toggleSort,
    setSortDirection,
    hasActiveFilters,
    activeFiltersCount
  };
};

export default useTableFilters;
