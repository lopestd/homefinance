package com.homefinance.app.feature.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CardMovement
import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.RecurrenceType
import com.homefinance.app.data.repository.FinanceRepository
import java.util.Calendar
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

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

    fun resetAfterRestore() {
        currentUserId = null
        _uiState.value = FinanceUiState()
    }

    fun selectBudget(budgetId: Long?) {
        _uiState.update { it.copy(selectedBudgetId = budgetId) }
        refresh(forceLoading = false)
    }

    fun createBudget(yearText: String) {
        val userId = currentUserId ?: return
        val year = yearText.trim().toIntOrNull()
        if (year == null || year < 2000 || year > 2100) {
            _uiState.update { it.copy(message = "Ano inválido.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createBudget(userId, year)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Orçamento criado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updateBudget(budgetId: Long, yearText: String) {
        val userId = currentUserId ?: return
        val year = yearText.trim().toIntOrNull()
        if (year == null || year < 2000 || year > 2100) {
            _uiState.update { it.copy(message = "Ano inválido.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updateBudget(userId, budgetId, year)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Orçamento atualizado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun deleteBudget(budgetId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deleteBudget(userId, budgetId)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Orçamento excluído.")
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

    fun updateCategory(categoryId: Long, name: String, type: CategoryType) {
        val userId = currentUserId ?: return
        val normalized = name.trim()
        if (normalized.isEmpty()) {
            _uiState.update { it.copy(message = "Informe o nome da categoria.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updateCategory(userId, categoryId, normalized, type)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Categoria atualizada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun deleteCategory(categoryId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deleteCategory(userId, categoryId)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Categoria excluída.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createRevenue(description: String, amountText: String, categoryId: Long?) {
        createRevenue(
            description = description,
            amountText = amountText,
            categoryId = categoryId,
            complement = null,
            month = 1,
            dateIso = null,
            status = "Pendente",
            recurrenceType = RecurrenceType.EVENTUAL,
            installmentsText = "1",
            recurrenceMonths = emptyList()
        )
    }

    fun createRevenue(
        description: String,
        amountText: String,
        categoryId: Long?,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installmentsText: String,
        recurrenceMonths: List<Int>
    ) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: _uiState.value.budgets.firstOrNull()?.id
        if (budgetId == null) {
            _uiState.update { it.copy(message = "Crie um orçamento primeiro.") }
            return
        }
        if (categoryId == null) {
            _uiState.update { it.copy(message = "Selecione uma categoria.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descrição e valor são obrigatórios.") }
            return
        }
        val installments = installmentsText.trim().toIntOrNull()?.coerceAtLeast(1) ?: 1
        viewModelScope.launch {
            val result = financeRepository.createRevenue(
                userId = userId,
                budgetId = budgetId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents,
                complement = complement,
                month = month,
                dateIso = dateIso?.takeIf { it.isNotBlank() },
                status = status,
                recurrenceType = recurrenceType,
                installments = installments,
                recurrenceMonths = recurrenceMonths
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Receita registrada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createExpense(description: String, amountText: String, categoryId: Long?) {
        createExpense(
            description = description,
            amountText = amountText,
            categoryId = categoryId,
            complement = null,
            month = 1,
            dateIso = null,
            status = "Pendente",
            recurrenceType = RecurrenceType.EVENTUAL,
            installmentsText = "1",
            recurrenceMonths = emptyList()
        )
    }

    fun createExpense(
        description: String,
        amountText: String,
        categoryId: Long?,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installmentsText: String,
        recurrenceMonths: List<Int>
    ) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: _uiState.value.budgets.firstOrNull()?.id
        if (budgetId == null) {
            _uiState.update { it.copy(message = "Crie um orçamento primeiro.") }
            return
        }
        if (categoryId == null) {
            _uiState.update { it.copy(message = "Selecione uma categoria.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descrição e valor são obrigatórios.") }
            return
        }
        val installments = installmentsText.trim().toIntOrNull()?.coerceAtLeast(1) ?: 1
        viewModelScope.launch {
            val result = financeRepository.createExpense(
                userId = userId,
                budgetId = budgetId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents,
                complement = complement,
                month = month,
                dateIso = dateIso?.takeIf { it.isNotBlank() },
                status = status,
                recurrenceType = recurrenceType,
                installments = installments,
                recurrenceMonths = recurrenceMonths
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Despesa registrada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updateInitialBalance(amountText: String) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: _uiState.value.budgets.firstOrNull()?.id
        if (budgetId == null) {
            _uiState.update { it.copy(message = "Crie um orçamento primeiro.") }
            return
        }
        val cents = parseAmountToCents(amountText, allowNegative = true)
        viewModelScope.launch {
            val result = financeRepository.updateInitialBalance(userId, budgetId, cents)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Saldo inicial atualizado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createPredefinedExpense(description: String, categoryId: Long?) {
        val userId = currentUserId ?: return
        val normalized = description.trim()
        if (normalized.isEmpty() || categoryId == null) {
            _uiState.update { it.copy(message = "Informe categoria e descrição.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createPredefinedExpense(userId, categoryId, normalized)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Gasto pré-definido criado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updatePredefinedExpense(predefinedExpenseId: Long, description: String, categoryId: Long?) {
        val userId = currentUserId ?: return
        val normalized = description.trim()
        if (normalized.isEmpty() || categoryId == null) {
            _uiState.update { it.copy(message = "Informe categoria e descrição.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updatePredefinedExpense(userId, predefinedExpenseId, categoryId, normalized)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Gasto pré-definido atualizado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun deletePredefinedExpense(predefinedExpenseId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deletePredefinedExpense(userId, predefinedExpenseId)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Gasto pré-definido excluído.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createPredefinedRevenue(description: String, isRecurring: Boolean) {
        val userId = currentUserId ?: return
        val normalized = description.trim()
        if (normalized.isEmpty()) {
            _uiState.update { it.copy(message = "Informe a descrição.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createPredefinedRevenue(userId, normalized, isRecurring)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Receita pré-definida criada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updatePredefinedRevenue(predefinedRevenueId: Long, description: String, isRecurring: Boolean) {
        val userId = currentUserId ?: return
        val normalized = description.trim()
        if (normalized.isEmpty()) {
            _uiState.update { it.copy(message = "Informe a descrição.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updatePredefinedRevenue(userId, predefinedRevenueId, normalized, isRecurring)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Receita pré-definida atualizada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun deletePredefinedRevenue(predefinedRevenueId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deletePredefinedRevenue(userId, predefinedRevenueId)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Receita pré-definida excluída.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createCard(name: String, limitText: String) {
        val userId = currentUserId ?: return
        val normalized = name.trim()
        val cents = parseAmountToCents(limitText)
        if (normalized.isEmpty()) {
            _uiState.update { it.copy(message = "Informe o nome do cartão.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.createCard(userId, normalized, cents)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Cartão criado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updateCard(cardId: Long, name: String, limitText: String) {
        val userId = currentUserId ?: return
        val normalized = name.trim()
        val cents = parseAmountToCents(limitText)
        if (normalized.isEmpty()) {
            _uiState.update { it.copy(message = "Informe o nome do cartão.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updateCard(userId, cardId, normalized, cents)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Cartão atualizado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun deleteCard(cardId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deleteCard(userId, cardId)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Cartão excluído.")
            }
            refresh(forceLoading = false)
        }
    }

    fun setCardLimit(cardId: Long?, month: Int, limitText: String) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: return
        if (cardId == null) {
            _uiState.update { it.copy(message = "Selecione um cartão.") }
            return
        }
        val cents = parseAmountToCents(limitText)
        viewModelScope.launch {
            val result = financeRepository.setCardLimit(userId, cardId, budgetId, month, cents)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Limite mensal atualizado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun createCardCharge(
        cardId: Long?,
        categoryId: Long?,
        description: String,
        amountText: String,
        movement: CardMovement,
        complement: String?,
        month: Int,
        dateIso: String,
        recurrenceType: RecurrenceType,
        installmentsText: String,
        recurrenceMonths: List<Int>
    ) {
        val userId = currentUserId ?: return
        val budgetId = _uiState.value.selectedBudgetId ?: _uiState.value.budgets.firstOrNull()?.id
        if (budgetId == null) {
            _uiState.update { it.copy(message = "Crie um orçamento primeiro.") }
            return
        }
        if (cardId == null) {
            _uiState.update { it.copy(message = "Selecione um cartão.") }
            return
        }
        if (categoryId == null) {
            _uiState.update { it.copy(message = "Selecione uma categoria.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descrição e valor são obrigatórios.") }
            return
        }
        val installments = installmentsText.trim().toIntOrNull()?.coerceAtLeast(1) ?: 1
        viewModelScope.launch {
            val result = financeRepository.createCardCharge(
                userId = userId,
                budgetId = budgetId,
                cardId = cardId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents,
                movement = movement,
                complement = complement,
                month = month,
                dateIso = dateIso,
                recurrenceType = recurrenceType,
                installments = installments,
                recurrenceMonths = recurrenceMonths
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Lançamento de cartão registrado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updateRevenue(
        revenueId: Long,
        description: String,
        amountText: String,
        categoryId: Long?,
        complement: String?,
        dateIso: String?,
        status: String
    ) {
        val userId = currentUserId ?: return
        if (categoryId == null) {
            _uiState.update { it.copy(message = "Selecione uma categoria.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descrição e valor são obrigatórios.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updateRevenue(
                userId = userId,
                revenueId = revenueId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents,
                complement = complement,
                dateIso = dateIso?.takeIf { it.isNotBlank() },
                status = status
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Receita atualizada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updateExpense(
        expenseId: Long,
        description: String,
        amountText: String,
        categoryId: Long?,
        complement: String?,
        dateIso: String?,
        status: String
    ) {
        val userId = currentUserId ?: return
        if (categoryId == null) {
            _uiState.update { it.copy(message = "Selecione uma categoria.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descrição e valor são obrigatórios.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updateExpense(
                userId = userId,
                expenseId = expenseId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents,
                complement = complement,
                dateIso = dateIso?.takeIf { it.isNotBlank() },
                status = status
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Despesa atualizada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun updateCardCharge(
        chargeId: Long,
        cardId: Long?,
        categoryId: Long?,
        description: String,
        amountText: String,
        movement: CardMovement,
        complement: String?,
        dateIso: String
    ) {
        val userId = currentUserId ?: return
        if (cardId == null) {
            _uiState.update { it.copy(message = "Selecione um cartão.") }
            return
        }
        if (categoryId == null) {
            _uiState.update { it.copy(message = "Selecione uma categoria.") }
            return
        }
        val normalizedDescription = description.trim()
        val cents = parseAmountToCents(amountText)
        if (normalizedDescription.isEmpty() || cents <= 0L) {
            _uiState.update { it.copy(message = "Descrição e valor são obrigatórios.") }
            return
        }
        viewModelScope.launch {
            val result = financeRepository.updateCardCharge(
                userId = userId,
                chargeId = chargeId,
                cardId = cardId,
                categoryId = categoryId,
                description = normalizedDescription,
                amountCents = cents,
                movement = movement,
                complement = complement,
                dateIso = dateIso
            )
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Lançamento de cartão atualizado.")
            }
            refresh(forceLoading = false)
        }
    }

    fun closeCardInvoice(cardId: Long, budgetId: Long, month: Int) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.closeCardInvoice(userId, cardId, budgetId, month)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Fatura fechada.")
            }
            refresh(forceLoading = false)
        }
    }

    fun reopenCardInvoice(cardId: Long, budgetId: Long, month: Int) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.reopenCardInvoice(userId, cardId, budgetId, month)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Fatura reaberta.")
            }
            refresh(forceLoading = false)
        }
    }

    fun deleteCardCharge(chargeId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deleteCardCharge(userId, chargeId)
            _uiState.update {
                it.copy(message = result.exceptionOrNull()?.message ?: "Lançamento de cartão excluído.")
            }
            refresh(forceLoading = false)
        }
    }

    fun toggleRevenueStatus(revenueId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.toggleRevenueStatus(userId, revenueId)
            result.exceptionOrNull()?.message?.let { message ->
                _uiState.update { it.copy(message = message) }
            }
            refresh(forceLoading = false)
        }
    }

    fun toggleExpenseStatus(expenseId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.toggleExpenseStatus(userId, expenseId)
            result.exceptionOrNull()?.message?.let { message ->
                _uiState.update { it.copy(message = message) }
            }
            refresh(forceLoading = false)
        }
    }

    fun deleteRevenue(revenueId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deleteRevenue(userId, revenueId)
            result.exceptionOrNull()?.message?.let { message ->
                _uiState.update { it.copy(message = message) }
            }
            refresh(forceLoading = false)
        }
    }

    fun deleteExpense(expenseId: Long) {
        val userId = currentUserId ?: return
        viewModelScope.launch {
            val result = financeRepository.deleteExpense(userId, expenseId)
            result.exceptionOrNull()?.message?.let { message ->
                _uiState.update { it.copy(message = message) }
            }
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
            val defaultBudgetId = resolveDefaultBudgetId(snapshot.budgets)
            val resolvedSelected = when {
                snapshot.budgets.isEmpty() -> null
                selectedBudget == null -> defaultBudgetId
                snapshot.budgets.any { it.id == selectedBudget } -> selectedBudget
                else -> defaultBudgetId
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
                    expenses = refreshedSnapshot.expenses,
                    predefinedExpenses = refreshedSnapshot.predefinedExpenses,
                    predefinedRevenues = refreshedSnapshot.predefinedRevenues,
                    cards = refreshedSnapshot.cards,
                    cardCharges = refreshedSnapshot.cardCharges,
                    cardSummaries = refreshedSnapshot.cardSummaries
                )
            }
        }
    }

    private fun parseAmountToCents(text: String, allowNegative: Boolean = false): Long {
        val trimmed = text.trim()
        val negative = allowNegative && trimmed.startsWith("-")
        val normalized = trimmed
            .removePrefix("-")
            .removePrefix("R$")
            .trim()
        val separatorIndex = maxOf(normalized.lastIndexOf(','), normalized.lastIndexOf('.'))
        val cents = if (separatorIndex >= 0) {
            val reais = normalized.take(separatorIndex).filter(Char::isDigit).toLongOrNull() ?: 0L
            val centavos = normalized
                .drop(separatorIndex + 1)
                .filter(Char::isDigit)
                .take(2)
                .padEnd(2, '0')
                .toLongOrNull() ?: 0L
            reais * 100L + centavos
        } else {
            val reais = normalized.filter(Char::isDigit).toLongOrNull() ?: return 0L
            reais * 100L
        }
        val signedCents = if (negative) -cents else cents
        if (!allowNegative && signedCents <= 0L) return 0L
        return signedCents
    }
}

internal fun resolveDefaultBudgetId(
    budgets: List<BudgetItem>,
    currentYear: Int = Calendar.getInstance().get(Calendar.YEAR)
): Long? {
    return budgets.firstOrNull { it.year == currentYear }?.id
        ?: budgets.firstOrNull()?.id
}
