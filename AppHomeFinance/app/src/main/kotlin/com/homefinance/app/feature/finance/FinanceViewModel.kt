package com.homefinance.app.feature.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.data.repository.FinanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.math.roundToLong

class FinanceViewModel(
    private val financeRepository: FinanceRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(FinanceUiState())
    val uiState: StateFlow<FinanceUiState> = _uiState.asStateFlow()

    private var currentUserId: Long? = null

    fun loadForUser(userId: Long) {
        if (currentUserId == userId && !_uiState.value.isLoading) {
            return
        }
        currentUserId = userId
        refresh(forceLoading = true)
    }

    fun selectBudget(budgetId: Long?) {
        _uiState.update { it.copy(selectedBudgetId = budgetId) }
        refresh(forceLoading = false)
    }

    fun createBudget(yearText: String) {
        val userId = currentUserId ?: return
        val year = yearText.trim().toIntOrNull()
        if (year == null || year < 2000 || year > 2100) {
            _uiState.update { it.copy(message = "Ano invalido.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createBudget(userId, year)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Orcamento criado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createCategory(name: String, type: CategoryType) {
        val userId = currentUserId ?: return
        val normalized = name.trim()
        if (normalized.isEmpty()) {
            _uiState.update { it.copy(message = "Informe o nome da categoria.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createCategory(userId, normalized, type)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Categoria criada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createRevenue(description: String, amountText: String, categoryId: Long?) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: _uiState.value.budgets.firstOrNull()?.id
        if (budgetId == null) {
            _uiState.update { it.copy(message = "Crie um orcamento primeiro.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descricao e valor sao obrigatorios.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createRevenue(
                userId = userId,
                budgetId = budgetId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Receita registrada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createExpense(description: String, amountText: String, categoryId: Long?) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: _uiState.value.budgets.firstOrNull()?.id
        if (budgetId == null) {
            _uiState.update { it.copy(message = "Crie um orcamento primeiro.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descricao e valor sao obrigatorios.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createExpense(
                userId = userId,
                budgetId = budgetId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Despesa registrada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun toggleRevenueStatus(revenueId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            financeRepository.toggleRevenueStatus(userId, revenueId)
            refresh(forceLoading = false)
        }
    }

    fun toggleExpenseStatus(expenseId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            financeRepository.toggleExpenseStatus(userId, expenseId)
            refresh(forceLoading = false)
        }
    }

    fun deleteRevenue(revenueId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            financeRepository.deleteRevenue(userId, revenueId)
            refresh(forceLoading = false)
        }
    }

    fun deleteExpense(expenseId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            financeRepository.deleteExpense(userId, expenseId)
            refresh(forceLoading = false)
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }

    private fun refresh(forceLoading: Boolean) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            if (forceLoading) {
                _uiState.update { it.copy(isLoading = true) }
            }
            val selectedBudget = _uiState.value.selectedBudgetId
            val snapshot = financeRepository.loadSnapshot(userId, selectedBudget)
            val resolvedSelected = when {
                snapshot.budgets.isEmpty() -> null
                selectedBudget == null -> snapshot.budgets.first().id
                snapshot.budgets.any { it.id == selectedBudget } -> selectedBudget
                else -> snapshot.budgets.first().id
            }
            val refreshedSnapshot = if (resolvedSelected != selectedBudget) {
                financeRepository.loadSnapshot(userId, resolvedSelected)
            } else {
                snapshot
            }

            _uiState.update {
                it.copy(
                    isLoading = false,
                    selectedBudgetId = resolvedSelected,
                    budgets = refreshedSnapshot.budgets,
                    categoriesRevenue = refreshedSnapshot.categoriesRevenue,
                    categoriesExpense = refreshedSnapshot.categoriesExpense,
                    revenues = refreshedSnapshot.revenues,
                    expenses = refreshedSnapshot.expenses
                )
            }
        }
    }

    private fun parseAmountToCents(text: String): Long {
        val normalized = text.trim().replace(",", ".")
        val value = normalized.toDoubleOrNull() ?: return 0L
        if (value <= 0.0) return 0L
        return (value * 100.0).roundToLong()
    }
}

