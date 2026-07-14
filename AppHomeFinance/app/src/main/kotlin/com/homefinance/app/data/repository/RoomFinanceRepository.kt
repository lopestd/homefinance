package com.homefinance.app.data.repository

import androidx.room.withTransaction
import com.homefinance.app.core.model.BudgetItem
import com.homefinance.app.core.model.CardChargeItem
import com.homefinance.app.core.model.CardItem
import com.homefinance.app.core.model.CardMonthlySummary
import com.homefinance.app.core.model.CardMovement
import com.homefinance.app.core.model.CategoryItem
import com.homefinance.app.core.model.CategoryType
import com.homefinance.app.core.model.ExpenseItem
import com.homefinance.app.core.model.FinanceSnapshot
import com.homefinance.app.core.model.PredefinedExpenseItem
import com.homefinance.app.core.model.PredefinedRevenueItem
import com.homefinance.app.core.model.RecurrenceType
import com.homefinance.app.core.model.RevenueItem
import com.homefinance.app.data.local.HomeFinanceDatabase
import com.homefinance.app.data.local.entity.CartaoEntity
import com.homefinance.app.data.local.entity.CartaoFaturaFechadaEntity
import com.homefinance.app.data.local.entity.CartaoLimiteMensalEntity
import com.homefinance.app.data.local.entity.CategoriaEntity
import com.homefinance.app.data.local.entity.DespesaEntity
import com.homefinance.app.data.local.entity.DespesaMesEntity
import com.homefinance.app.data.local.entity.GastoPredefinidoEntity
import com.homefinance.app.data.local.entity.LancamentoCartaoEntity
import com.homefinance.app.data.local.entity.LancamentoCartaoMesEntity
import com.homefinance.app.data.local.entity.OrcamentoEntity
import com.homefinance.app.data.local.entity.OrcamentoMesEntity
import com.homefinance.app.data.local.entity.ReceitaEntity
import com.homefinance.app.data.local.entity.ReceitaMesEntity
import com.homefinance.app.data.local.entity.SaldoInicialOrcamentoEntity
import com.homefinance.app.data.local.entity.TipoReceitaEntity
import java.util.Calendar
import java.util.Locale
import kotlin.math.min

class RoomFinanceRepository(
    private val database: HomeFinanceDatabase
) : FinanceRepository {
    private val budgetDao = database.orcamentoDao()
    private val categoryDao = database.categoriaDao()
    private val receitaDao = database.receitaDao()
    private val despesaDao = database.despesaDao()
    private val predefinedDao = database.predefinedDao()
    private val cardDao = database.cartaoDao()

    override suspend fun loadSnapshot(userId: Long, selectedBudgetId: Long?): FinanceSnapshot {
        ensureBudgetMonths(userId)
        syncAllCardInvoiceExpenses(userId)
        val balances = budgetDao.listInitialBalances(userId).associateBy { it.budgetId }
        val budgets = budgetDao.listByUser(userId).map { budget ->
            BudgetItem(
                id = budget.id,
                year = budget.year,
                isActive = budget.isActive,
                months = budgetDao.listMonths(userId, budget.id).ifEmpty { (1..12).toList() },
                initialBalanceCents = balances[budget.id]?.initialBalanceCents ?: 0L
            )
        }
        val categoriesRevenue = categoryDao.listByType(userId, CategoryType.RECEITA.name).map {
            CategoryItem(id = it.id, name = displayCategoryName(it.name), type = CategoryType.RECEITA)
        }
        val categoriesExpense = categoryDao.listByType(userId, CategoryType.DESPESA.name).map {
            CategoryItem(id = it.id, name = displayCategoryName(it.name), type = CategoryType.DESPESA)
        }
        val revenues = receitaDao.listByUser(userId, selectedBudgetId).map {
            RevenueItem(
                id = it.id,
                budgetId = it.budgetId,
                categoryId = it.categoryId,
                description = it.description,
                complement = it.complement,
                amountCents = it.amountCents,
                month = it.month,
                dateIso = it.dateIso,
                status = it.status,
                recurrenceType = recurrenceFrom(it.recurrenceType),
                installment = it.installment,
                totalInstallments = it.totalInstallments,
                categoryName = it.categoryName?.let(::displayCategoryName)
            )
        }
        val expenses = despesaDao.listByUser(userId, selectedBudgetId).map {
            ExpenseItem(
                id = it.id,
                budgetId = it.budgetId,
                categoryId = it.categoryId,
                description = it.description,
                complement = it.complement,
                amountCents = it.amountCents,
                month = it.month,
                dateIso = it.dateIso,
                status = it.status,
                recurrenceType = recurrenceFrom(it.recurrenceType),
                installment = it.installment,
                totalInstallments = it.totalInstallments,
                isCardInvoice = it.isCardInvoice,
                categoryName = it.categoryName?.let(::displayCategoryName)
            )
        }
        val predefinedExpenses = predefinedDao.listExpenses(userId).map {
            PredefinedExpenseItem(id = it.id, categoryId = it.categoryId, description = it.description)
        }
        val predefinedRevenues = predefinedDao.listRevenues(userId).map {
            PredefinedRevenueItem(id = it.id, description = it.description, isRecurring = it.isRecurring)
        }
        val cards = cardDao.listCards(userId).map {
            CardItem(id = it.id, name = it.name, defaultLimitCents = it.defaultLimitCents, isActive = it.isActive)
        }
        val cardCharges = cardDao.listCharges(userId, selectedBudgetId).map {
            val movement = movementFromDescription(it.description)
            CardChargeItem(
                id = it.id,
                budgetId = it.budgetId,
                cardId = it.cardId,
                cardName = it.cardName,
                categoryId = it.categoryId,
                categoryName = it.categoryName,
                description = cleanCreditTag(it.description),
                complement = it.complement,
                amountCents = it.amountCents,
                month = it.month,
                dateIso = it.dateIso,
                recurrenceType = recurrenceFrom(it.recurrenceType),
                installment = it.installment,
                totalInstallments = it.totalInstallments,
                movement = movement
            )
        }

        return FinanceSnapshot(
            budgets = budgets,
            categoriesRevenue = categoriesRevenue,
            categoriesExpense = categoriesExpense,
            revenues = revenues,
            expenses = expenses,
            predefinedExpenses = predefinedExpenses,
            predefinedRevenues = predefinedRevenues,
            cards = cards,
            cardCharges = cardCharges,
            cardSummaries = buildCardSummaries(
                selectedBudgetId = selectedBudgetId,
                budgets = budgets,
                cards = cards,
                charges = cardCharges,
                limits = cardDao.listLimits(userId),
                closedInvoices = cardDao.listClosedInvoices(userId)
            )
        )
    }

    override suspend fun createBudget(userId: Long, year: Int): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val existing = budgetDao.findByYear(userId, year)
                if (existing != null) {
                    throw IllegalArgumentException("Já existe um orçamento para $year.")
                }
                val budgetId = budgetDao.insert(
                    OrcamentoEntity(
                        userId = userId,
                        year = year,
                        createdAt = timestamp()
                    )
                )
                (1..12).forEach { month ->
                    budgetDao.insertMonth(OrcamentoMesEntity(budgetId = budgetId, month = month, userId = userId))
                }
                budgetDao.upsertInitialBalance(
                    SaldoInicialOrcamentoEntity(
                        userId = userId,
                        budgetId = budgetId,
                        year = year,
                        initialBalanceCents = 0L,
                        createdAt = timestamp()
                    )
                )
            }
        }.map { Unit }
    }

    override suspend fun updateBudget(userId: Long, budgetId: Long, year: Int): Result<Unit> {
        return runCatching {
            val current = budgetDao.findById(userId, budgetId)
                ?: throw IllegalArgumentException("Orçamento não encontrado.")
            val existing = budgetDao.findByYear(userId, year)
            if (existing != null && existing.id != budgetId) {
                throw IllegalArgumentException("Já existe um orçamento para $year.")
            }
            budgetDao.update(current.copy(year = year))
        }.map { Unit }
    }

    override suspend fun deleteBudget(userId: Long, budgetId: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                budgetDao.findById(userId, budgetId)
                    ?: throw IllegalArgumentException("Orçamento não encontrado.")
                if (budgetDao.hasEntries(userId, budgetId)) {
                    throw IllegalStateException(
                        "Não é possível excluir este orçamento, pois ele está vinculado a lançamentos."
                    )
                }
                cardDao.deleteLimitsByBudget(userId, budgetId)
                cardDao.deleteClosedInvoicesByBudget(userId, budgetId)
                budgetDao.deleteInitialBalanceByBudget(userId, budgetId)
                budgetDao.deleteMonthsByBudget(userId, budgetId)
                budgetDao.deleteById(userId, budgetId)
            }
        }.map { Unit }
    }

    override suspend fun createCategory(userId: Long, name: String, type: CategoryType): Result<Unit> {
        return runCatching {
            val normalizedName = name.trim()
            val existing = categoryDao.findByNameAndType(userId, normalizedName, type.name)
            if (existing != null) {
                throw IllegalArgumentException("Já existe categoria '${displayCategoryName(existing.name)}' para ${type.name.lowercase()}.")
            }
            categoryDao.insert(
                CategoriaEntity(
                    userId = userId,
                    name = normalizedName,
                    type = type.name
                )
            )
        }.map { Unit }
    }

    override suspend fun updateCategory(userId: Long, categoryId: Long, name: String, type: CategoryType): Result<Unit> {
        return runCatching {
            val current = categoryDao.findById(userId, categoryId)
                ?: throw IllegalArgumentException("Categoria não encontrada.")
            val normalizedName = name.trim()
            val existing = categoryDao.findByNameAndType(userId, normalizedName, type.name)
            if (existing != null && existing.id != categoryId) {
                throw IllegalArgumentException("Já existe categoria '${displayCategoryName(existing.name)}' para ${type.name.lowercase()}.")
            }
            categoryDao.update(
                current.copy(
                    name = normalizedName,
                    type = type.name
                )
            )
        }.map { Unit }
    }

    override suspend fun deleteCategory(userId: Long, categoryId: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val current = categoryDao.findById(userId, categoryId)
                    ?: throw IllegalArgumentException("Categoria não encontrada.")
                if (categoryDao.hasEntries(userId, categoryId)) {
                    throw IllegalStateException(
                        "Não é possível excluir esta categoria, pois ela está vinculada a lançamentos."
                    )
                }
                categoryDao.update(current.copy(isActive = false))
            }
        }.map { Unit }
    }

    override suspend fun updateInitialBalance(userId: Long, budgetId: Long, amountCents: Long): Result<Unit> {
        return runCatching {
            val budget = budgetDao.findById(userId, budgetId)
                ?: throw IllegalArgumentException("Orçamento não encontrado.")
            val existing = budgetDao.findInitialBalance(userId, budgetId)
            budgetDao.upsertInitialBalance(
                SaldoInicialOrcamentoEntity(
                    id = existing?.id ?: 0L,
                    userId = userId,
                    budgetId = budgetId,
                    year = budget.year,
                    initialBalanceCents = amountCents,
                    createdAt = existing?.createdAt ?: timestamp(),
                    updatedAt = timestamp()
                )
            )
        }.map { Unit }
    }

    override suspend fun createPredefinedExpense(
        userId: Long,
        categoryId: Long,
        description: String
    ): Result<Unit> {
        return runCatching {
            validateCategory(userId, categoryId, CategoryType.DESPESA)
            val normalized = description.trim()
            if (predefinedDao.findExpense(userId, categoryId, normalized) != null) {
                throw IllegalArgumentException("Gasto pré-definido já cadastrado.")
            }
            predefinedDao.insertExpense(
                GastoPredefinidoEntity(
                    categoryId = categoryId,
                    description = normalized,
                    userId = userId
                )
            )
        }.map { Unit }
    }

    override suspend fun updatePredefinedExpense(
        userId: Long,
        predefinedExpenseId: Long,
        categoryId: Long,
        description: String
    ): Result<Unit> {
        return runCatching {
            val current = predefinedDao.findExpenseById(userId, predefinedExpenseId)
                ?: throw IllegalArgumentException("Gasto pré-definido não encontrado.")
            validateCategory(userId, categoryId, CategoryType.DESPESA)
            val normalized = description.trim()
            val existing = predefinedDao.findExpense(userId, categoryId, normalized)
            if (existing != null && existing.id != predefinedExpenseId) {
                throw IllegalArgumentException("Gasto pré-definido já cadastrado.")
            }
            predefinedDao.updateExpense(
                current.copy(
                    categoryId = categoryId,
                    description = normalized
                )
            )
        }.map { Unit }
    }

    override suspend fun deletePredefinedExpense(userId: Long, predefinedExpenseId: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val current = predefinedDao.findExpenseById(userId, predefinedExpenseId)
                    ?: throw IllegalArgumentException("Gasto pré-definido não encontrado.")
                predefinedDao.updateExpense(current.copy(isActive = false))
            }
        }.map { Unit }
    }

    override suspend fun createPredefinedRevenue(
        userId: Long,
        description: String,
        isRecurring: Boolean
    ): Result<Unit> {
        return runCatching {
            val normalized = description.trim()
            if (predefinedDao.findRevenue(userId, normalized) != null) {
                throw IllegalArgumentException("Receita pré-definida já cadastrada.")
            }
            predefinedDao.insertRevenue(
                TipoReceitaEntity(
                    description = normalized,
                    isRecurring = isRecurring,
                    userId = userId
                )
            )
        }.map { Unit }
    }

    override suspend fun updatePredefinedRevenue(
        userId: Long,
        predefinedRevenueId: Long,
        description: String,
        isRecurring: Boolean
    ): Result<Unit> {
        return runCatching {
            val current = predefinedDao.findRevenueById(userId, predefinedRevenueId)
                ?: throw IllegalArgumentException("Receita pré-definida não encontrada.")
            val normalized = description.trim()
            val existing = predefinedDao.findRevenue(userId, normalized)
            if (existing != null && existing.id != predefinedRevenueId) {
                throw IllegalArgumentException("Receita pré-definida já cadastrada.")
            }
            predefinedDao.updateRevenue(
                current.copy(
                    description = normalized,
                    isRecurring = isRecurring
                )
            )
        }.map { Unit }
    }

    override suspend fun deletePredefinedRevenue(userId: Long, predefinedRevenueId: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val current = predefinedDao.findRevenueById(userId, predefinedRevenueId)
                    ?: throw IllegalArgumentException("Receita pré-definida não encontrada.")
                predefinedDao.updateRevenue(current.copy(isActive = false))
            }
        }.map { Unit }
    }

    override suspend fun createCard(userId: Long, name: String, defaultLimitCents: Long): Result<Unit> {
        return runCatching {
            val normalized = name.trim()
            if (cardDao.findCardByName(userId, normalized) != null) {
                throw IllegalArgumentException("Cartão já cadastrado.")
            }
            cardDao.insertCard(
                CartaoEntity(
                    name = normalized,
                    defaultLimitCents = defaultLimitCents.coerceAtLeast(0L),
                    userId = userId
                )
            )
        }.map { Unit }
    }

    override suspend fun updateCard(userId: Long, cardId: Long, name: String, defaultLimitCents: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val current = cardDao.findCard(userId, cardId)
                    ?: throw IllegalArgumentException("Cartão não encontrado.")
                val normalized = name.trim()
                val existing = cardDao.findCardByName(userId, normalized)
                if (existing != null && existing.id != cardId) {
                    throw IllegalArgumentException("Cartão já cadastrado.")
                }
                cardDao.updateCard(
                    current.copy(
                        name = normalized,
                        defaultLimitCents = defaultLimitCents.coerceAtLeast(0L)
                    )
                )
                cardDao.listInvoiceKeysForCard(userId, cardId).forEach {
                    syncCardInvoiceExpense(userId, cardId, it.budgetId, it.month)
                }
            }
        }.map { Unit }
    }

    override suspend fun deleteCard(userId: Long, cardId: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                cardDao.findCard(userId, cardId)
                    ?: throw IllegalArgumentException("Cartão não encontrado.")
                if (cardDao.hasEntries(userId, cardId)) {
                    throw IllegalStateException(
                        "Não é possível excluir este cartão, pois ele está vinculado a lançamentos."
                    )
                }
                cardDao.deleteLimitsByCard(userId, cardId)
                cardDao.deleteClosedInvoicesByCard(userId, cardId)
                cardDao.deleteCard(userId, cardId)
            }
        }.map { Unit }
    }

    override suspend fun setCardLimit(
        userId: Long,
        cardId: Long,
        budgetId: Long,
        month: Int,
        limitCents: Long
    ): Result<Unit> {
        return runCatching {
            database.withTransaction {
                validateCard(userId, cardId)
                validateBudgetMonth(userId, budgetId, month)
                cardDao.upsertLimit(
                    CartaoLimiteMensalEntity(
                        cardId = cardId,
                        budgetId = budgetId,
                        month = month,
                        limitCents = limitCents.coerceAtLeast(0L),
                        userId = userId
                    )
                )
                syncCardInvoiceExpense(userId, cardId, budgetId, month)
            }
        }.map { Unit }
    }

    override suspend fun createRevenue(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installments: Int,
        recurrenceMonths: List<Int>
    ): Result<Unit> {
        return runCatching {
            validateEntry(userId, budgetId, categoryId, CategoryType.RECEITA, description, amountCents, month)
            database.withTransaction {
                createEntries(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description.trim(),
                    complement = complement?.trim()?.takeIf { it.isNotEmpty() },
                    amountCents = amountCents,
                    month = month,
                    dateIso = dateIso,
                    status = status.ifBlank { "Pendente" },
                    recurrenceType = recurrenceType,
                    installments = installments,
                    recurrenceMonths = recurrenceMonths,
                    isRevenue = true
                )
            }
        }.map { Unit }
    }

    override suspend fun createExpense(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String?,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installments: Int,
        recurrenceMonths: List<Int>
    ): Result<Unit> {
        return runCatching {
            validateEntry(userId, budgetId, categoryId, CategoryType.DESPESA, description, amountCents, month)
            database.withTransaction {
                createEntries(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description.trim(),
                    complement = complement?.trim()?.takeIf { it.isNotEmpty() },
                    amountCents = amountCents,
                    month = month,
                    dateIso = dateIso,
                    status = status.ifBlank { "Pendente" },
                    recurrenceType = recurrenceType,
                    installments = installments,
                    recurrenceMonths = recurrenceMonths,
                    isRevenue = false
                )
            }
        }.map { Unit }
    }

    override suspend fun createCardCharge(
        userId: Long,
        budgetId: Long,
        cardId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        movement: CardMovement,
        complement: String?,
        month: Int,
        dateIso: String,
        recurrenceType: RecurrenceType,
        installments: Int,
        recurrenceMonths: List<Int>
    ): Result<Unit> {
        return runCatching {
            if (description.isBlank() || amountCents <= 0L) {
                throw IllegalArgumentException("Descrição e valor são obrigatórios.")
            }
            if (categoryId == null) {
                throw IllegalArgumentException("Selecione uma categoria.")
            }
            validateCard(userId, cardId)
            validateBudgetMonth(userId, budgetId, month)
            validateCategory(userId, categoryId, CategoryType.DESPESA)

            val insertedInvoices = mutableSetOf<InvoiceKey>()
            database.withTransaction {
                when (recurrenceType) {
                    RecurrenceType.EVENTUAL -> {
                        val budget = budgetDao.findById(userId, budgetId)
                            ?: throw IllegalArgumentException("Orçamento não encontrado.")
                        insertCardCharge(
                            userId = userId,
                            budget = budget,
                            cardId = cardId,
                            categoryId = categoryId,
                            description = taggedDescription(description.trim(), movement),
                            complement = complement,
                            amountCents = amountCents,
                            dateIso = dateIso.ifBlank { dateForMonth(null, budget.year, month) },
                            month = month,
                            recurrenceType = RecurrenceType.EVENTUAL,
                            installment = null,
                            totalInstallments = null
                        )
                        insertedInvoices += InvoiceKey(cardId, budgetId, month)
                    }
                    RecurrenceType.FIXO -> {
                        val budget = budgetDao.findById(userId, budgetId)
                            ?: throw IllegalArgumentException("Orçamento não encontrado.")
                        val months = recurrenceMonths.ifEmpty { listOf(month) }.distinct().sorted()
                        months.forEach { targetMonth ->
                            validateBudgetMonth(userId, budgetId, targetMonth)
                            insertCardCharge(
                                userId = userId,
                                budget = budget,
                                cardId = cardId,
                                categoryId = categoryId,
                                description = taggedDescription(description.trim(), movement),
                                complement = complement,
                                amountCents = amountCents,
                                dateIso = dateForMonth(dateIso, budget.year, targetMonth),
                                month = targetMonth,
                                recurrenceType = RecurrenceType.FIXO,
                                installment = null,
                                totalInstallments = null
                            )
                            insertedInvoices += InvoiceKey(cardId, budgetId, targetMonth)
                        }
                    }
                    RecurrenceType.PARCELADO -> {
                        val startBudget = budgetDao.findById(userId, budgetId)
                            ?: throw IllegalArgumentException("Orçamento não encontrado.")
                        val total = installments.coerceAtLeast(1)
                        splitAmount(amountCents, total).forEachIndexed { index, installmentAmount ->
                            val (targetBudget, targetMonth) = resolveBudgetMonth(userId, startBudget, month, index)
                            val label = "${description.trim()} ${index + 1}/$total"
                            insertCardCharge(
                                userId = userId,
                                budget = targetBudget,
                                cardId = cardId,
                                categoryId = categoryId,
                                description = taggedDescription(label, movement),
                                complement = complement,
                                amountCents = installmentAmount,
                                dateIso = dateIso.ifBlank { dateForMonth(null, startBudget.year, month) },
                                month = targetMonth,
                                recurrenceType = RecurrenceType.PARCELADO,
                                installment = index + 1,
                                totalInstallments = total
                            )
                            insertedInvoices += InvoiceKey(cardId, targetBudget.id, targetMonth)
                        }
                    }
                }
                insertedInvoices.forEach { syncCardInvoiceExpense(userId, it.cardId, it.budgetId, it.month) }
            }
        }.map { Unit }
    }

    override suspend fun updateRevenue(
        userId: Long,
        revenueId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String?,
        dateIso: String?,
        status: String
    ): Result<Unit> {
        return runCatching {
            val current = receitaDao.findById(userId, revenueId)
                ?: throw IllegalArgumentException("Receita não encontrada.")
            validateEntry(userId, current.budgetId, categoryId, CategoryType.RECEITA, description, amountCents, current.month)
            receitaDao.update(
                current.copy(
                    categoryId = categoryId,
                    description = description.trim(),
                    complement = complement?.trim()?.takeIf { it.isNotEmpty() },
                    amountCents = amountCents,
                    dateIso = dateIso,
                    status = if (status == "Recebido") "Recebido" else "Pendente"
                )
            )
        }.map { Unit }
    }

    override suspend fun updateExpense(
        userId: Long,
        expenseId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        complement: String?,
        dateIso: String?,
        status: String
    ): Result<Unit> {
        return runCatching {
            val current = despesaDao.findById(userId, expenseId)
                ?: throw IllegalArgumentException("Despesa não encontrada.")
            if (current.invoiceCardId != null) {
                throw IllegalStateException("Lançamento automático de fatura não pode ser editado.")
            }
            validateEntry(userId, current.budgetId, categoryId, CategoryType.DESPESA, description, amountCents, current.month)
            despesaDao.update(
                current.copy(
                    categoryId = categoryId,
                    description = description.trim(),
                    complement = complement?.trim()?.takeIf { it.isNotEmpty() },
                    amountCents = amountCents,
                    dateIso = dateIso,
                    status = if (status == "Pago") "Pago" else "Pendente"
                )
            )
        }.map { Unit }
    }

    override suspend fun updateCardCharge(
        userId: Long,
        chargeId: Long,
        cardId: Long,
        categoryId: Long?,
        description: String,
        amountCents: Long,
        movement: CardMovement,
        complement: String?,
        dateIso: String
    ): Result<Unit> {
        return runCatching {
            if (description.isBlank() || amountCents <= 0L) {
                throw IllegalArgumentException("Descrição e valor são obrigatórios.")
            }
            if (categoryId == null) {
                throw IllegalArgumentException("Selecione uma categoria.")
            }
            database.withTransaction {
                val current = cardDao.findCharge(userId, chargeId)
                    ?: throw IllegalArgumentException("Lançamento de cartão não encontrado.")
                if (cardDao.isInvoiceClosed(userId, current.cardId, current.budgetId, current.month)) {
                    throw IllegalStateException("Fatura fechada bloqueia edição.")
                }
                validateCard(userId, cardId)
                validateBudgetMonth(userId, current.budgetId, current.month)
                validateCategory(userId, categoryId, CategoryType.DESPESA)
                if (cardDao.isInvoiceClosed(userId, cardId, current.budgetId, current.month)) {
                    throw IllegalStateException("Fatura fechada bloqueia edição.")
                }

                cardDao.updateCharge(
                    current.copy(
                        cardId = cardId,
                        categoryId = categoryId,
                        description = taggedDescription(description.trim(), movement),
                        complement = complement?.trim()?.takeIf { it.isNotEmpty() },
                        amountCents = amountCents,
                        dateIso = dateIso.ifBlank { current.dateIso }
                    )
                )
                syncCardInvoiceExpense(userId, current.cardId, current.budgetId, current.month)
                if (current.cardId != cardId) {
                    syncCardInvoiceExpense(userId, cardId, current.budgetId, current.month)
                }
            }
        }.map { Unit }
    }

    override suspend fun closeCardInvoice(userId: Long, cardId: Long, budgetId: Long, month: Int): Result<Unit> {
        return runCatching {
            database.withTransaction {
                validateCard(userId, cardId)
                validateBudgetMonth(userId, budgetId, month)
                if (!cardDao.isInvoiceClosed(userId, cardId, budgetId, month)) {
                    cardDao.insertClosedInvoice(
                        CartaoFaturaFechadaEntity(
                            cardId = cardId,
                            budgetId = budgetId,
                            month = month,
                            userId = userId
                        )
                    )
                }
                syncCardInvoiceExpense(userId, cardId, budgetId, month)
            }
        }.map { Unit }
    }

    override suspend fun reopenCardInvoice(userId: Long, cardId: Long, budgetId: Long, month: Int): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val invoiceExpense = despesaDao.findCardInvoiceExpense(userId, cardId, budgetId, month)
                if (invoiceExpense?.status == "Pago") {
                    throw IllegalStateException("Fatura paga não pode ser reaberta.")
                }
                cardDao.deleteClosedInvoice(userId, cardId, budgetId, month)
                syncCardInvoiceExpense(userId, cardId, budgetId, month)
            }
        }.map { Unit }
    }

    override suspend fun deleteCardCharge(userId: Long, chargeId: Long): Result<Unit> {
        return runCatching {
            database.withTransaction {
                val charge = cardDao.findCharge(userId, chargeId)
                    ?: throw IllegalArgumentException("Lançamento de cartão não encontrado.")
                if (cardDao.isInvoiceClosed(userId, charge.cardId, charge.budgetId, charge.month)) {
                    throw IllegalStateException("Fatura fechada bloqueia exclusão.")
                }
                cardDao.deleteCharge(userId, chargeId)
                syncCardInvoiceExpense(userId, charge.cardId, charge.budgetId, charge.month)
            }
        }.map { Unit }
    }

    override suspend fun toggleRevenueStatus(userId: Long, revenueId: Long): Result<Unit> {
        return runCatching {
            val current = receitaDao.findById(userId, revenueId)
                ?: throw IllegalStateException("Receita não encontrada.")
            val nextStatus = if (current.status == "Recebido") "Pendente" else "Recebido"
            receitaDao.update(current.copy(status = nextStatus))
        }.map { Unit }
    }

    override suspend fun toggleExpenseStatus(userId: Long, expenseId: Long): Result<Unit> {
        return runCatching {
            val current = despesaDao.findById(userId, expenseId)
                ?: throw IllegalStateException("Despesa não encontrada.")
            val nextStatus = if (current.status == "Pago") "Pendente" else "Pago"
            if (nextStatus == "Pago" && current.invoiceCardId != null) {
                val closed = cardDao.isInvoiceClosed(
                    userId = userId,
                    cardId = current.invoiceCardId,
                    budgetId = current.invoiceBudgetId ?: current.budgetId,
                    month = current.invoiceMonth ?: current.month
                )
                if (!closed) {
                    throw IllegalStateException("Feche a fatura do cartão antes de marcar a despesa como paga.")
                }
            }
            despesaDao.update(current.copy(status = nextStatus))
        }.map { Unit }
    }

    override suspend fun deleteRevenue(userId: Long, revenueId: Long): Result<Unit> {
        return runCatching {
            receitaDao.deleteById(userId, revenueId)
        }.map { Unit }
    }

    override suspend fun deleteExpense(userId: Long, expenseId: Long): Result<Unit> {
        return runCatching {
            val current = despesaDao.findById(userId, expenseId)
                ?: throw IllegalStateException("Despesa não encontrada.")
            if (current.invoiceCardId != null) {
                val charges = cardDao.countChargesForInvoice(
                    userId = userId,
                    cardId = current.invoiceCardId,
                    budgetId = current.invoiceBudgetId ?: current.budgetId,
                    month = current.invoiceMonth ?: current.month
                )
                if (charges > 0) {
                    throw IllegalStateException("Despesa de fatura com lançamentos vinculados não pode ser excluída.")
                }
            }
            despesaDao.deleteById(userId, expenseId)
        }.map { Unit }
    }

    suspend fun seedInitialData(userId: Long) {
        database.withTransaction {
            val currentBudgets = budgetDao.listByUser(userId)
            if (currentBudgets.isEmpty()) {
                val year = Calendar.getInstance().get(Calendar.YEAR)
                val budgetId = budgetDao.insert(
                    OrcamentoEntity(
                        userId = userId,
                        year = year,
                        createdAt = timestamp()
                    )
                )
                (1..12).forEach { month ->
                    budgetDao.insertMonth(OrcamentoMesEntity(budgetId = budgetId, month = month, userId = userId))
                }
                budgetDao.upsertInitialBalance(
                    SaldoInicialOrcamentoEntity(
                        userId = userId,
                        budgetId = budgetId,
                        year = year,
                        initialBalanceCents = 0L,
                        createdAt = timestamp()
                    )
                )
            }

            ensureCategory(userId, "Salário", CategoryType.RECEITA)
            ensureCategory(userId, "Moradia", CategoryType.DESPESA)
            ensureCategory(userId, CARD_INVOICE_CATEGORY, CategoryType.DESPESA)
        }
    }

    private suspend fun ensureBudgetMonths(userId: Long) {
        database.withTransaction {
            budgetDao.listByUser(userId).forEach { budget ->
                val existing = budgetDao.listMonths(userId, budget.id)
                if (existing.isEmpty()) {
                    (1..12).forEach { month ->
                        budgetDao.insertMonth(OrcamentoMesEntity(budgetId = budget.id, month = month, userId = userId))
                    }
                }
                if (budgetDao.findInitialBalance(userId, budget.id) == null) {
                    budgetDao.upsertInitialBalance(
                        SaldoInicialOrcamentoEntity(
                            userId = userId,
                            budgetId = budget.id,
                            year = budget.year,
                            createdAt = timestamp()
                        )
                    )
                }
            }
        }
    }

    private suspend fun createEntries(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        complement: String?,
        amountCents: Long,
        month: Int,
        dateIso: String?,
        status: String,
        recurrenceType: RecurrenceType,
        installments: Int,
        recurrenceMonths: List<Int>,
        isRevenue: Boolean
    ) {
        val budget = budgetDao.findById(userId, budgetId)
            ?: throw IllegalArgumentException("Orçamento não encontrado.")
        when (recurrenceType) {
            RecurrenceType.EVENTUAL -> {
                insertFinanceEntry(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description,
                    complement = complement,
                    amountCents = amountCents,
                    month = month,
                    dateIso = dateIso ?: dateForMonth(null, budget.year, month),
                    status = status,
                    recurrenceType = RecurrenceType.EVENTUAL,
                    installment = null,
                    totalInstallments = null,
                    isRevenue = isRevenue
                )
            }
            RecurrenceType.FIXO -> {
                recurrenceMonths.ifEmpty { listOf(month) }.distinct().sorted().forEach { targetMonth ->
                    validateBudgetMonth(userId, budgetId, targetMonth)
                    val id = insertFinanceEntry(
                        userId = userId,
                        budgetId = budgetId,
                        categoryId = categoryId,
                        description = description,
                        complement = complement,
                        amountCents = amountCents,
                        month = targetMonth,
                        dateIso = dateForMonth(dateIso, budget.year, targetMonth),
                        status = status,
                        recurrenceType = RecurrenceType.FIXO,
                        installment = null,
                        totalInstallments = null,
                        isRevenue = isRevenue
                    )
                    if (isRevenue) {
                        receitaDao.insertMonth(ReceitaMesEntity(receitaId = id, month = targetMonth, userId = userId))
                    } else {
                        despesaDao.insertMonth(DespesaMesEntity(despesaId = id, month = targetMonth, userId = userId))
                    }
                }
            }
            RecurrenceType.PARCELADO -> {
                val total = installments.coerceAtLeast(1)
                splitAmount(amountCents, total).forEachIndexed { index, installmentAmount ->
                    val (targetBudget, targetMonth) = resolveBudgetMonth(userId, budget, month, index)
                    insertFinanceEntry(
                        userId = userId,
                        budgetId = targetBudget.id,
                        categoryId = categoryId,
                        description = "$description ${index + 1}/$total",
                        complement = complement,
                        amountCents = installmentAmount,
                        month = targetMonth,
                        dateIso = dateForMonth(dateIso, targetBudget.year, targetMonth),
                        status = status,
                        recurrenceType = RecurrenceType.PARCELADO,
                        installment = index + 1,
                        totalInstallments = total,
                        isRevenue = isRevenue
                    )
                }
            }
        }
    }

    private suspend fun insertFinanceEntry(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        description: String,
        complement: String?,
        amountCents: Long,
        month: Int,
        dateIso: String,
        status: String,
        recurrenceType: RecurrenceType,
        installment: Int?,
        totalInstallments: Int?,
        isRevenue: Boolean
    ): Long {
        return if (isRevenue) {
            receitaDao.insert(
                ReceitaEntity(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description,
                    complement = complement,
                    amountCents = amountCents,
                    month = month,
                    dateIso = dateIso,
                    status = if (status == "Recebido") "Recebido" else "Pendente",
                    recurrenceType = recurrenceType.name,
                    installment = installment,
                    totalInstallments = totalInstallments,
                    createdAt = timestamp()
                )
            )
        } else {
            despesaDao.insert(
                DespesaEntity(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description,
                    complement = complement,
                    amountCents = amountCents,
                    month = month,
                    dateIso = dateIso,
                    status = if (status == "Pago") "Pago" else "Pendente",
                    recurrenceType = recurrenceType.name,
                    installment = installment,
                    totalInstallments = totalInstallments,
                    createdAt = timestamp()
                )
            )
        }
    }

    private suspend fun insertCardCharge(
        userId: Long,
        budget: OrcamentoEntity,
        cardId: Long,
        categoryId: Long?,
        description: String,
        complement: String?,
        amountCents: Long,
        dateIso: String,
        month: Int,
        recurrenceType: RecurrenceType,
        installment: Int?,
        totalInstallments: Int?
    ) {
        validateBudgetMonth(userId, budget.id, month)
        if (cardDao.isInvoiceClosed(userId, cardId, budget.id, month)) {
            throw IllegalStateException("Fatura fechada bloqueia novo lançamento.")
        }
        val chargeId = cardDao.insertCharge(
            LancamentoCartaoEntity(
                userId = userId,
                budgetId = budget.id,
                cardId = cardId,
                categoryId = categoryId,
                description = description,
                complement = complement?.trim()?.takeIf { it.isNotEmpty() },
                amountCents = amountCents,
                dateIso = dateIso,
                month = month,
                recurrenceType = recurrenceType.name,
                installment = installment,
                totalInstallments = totalInstallments
            )
        )
        if (recurrenceType == RecurrenceType.FIXO) {
            cardDao.insertChargeMonth(LancamentoCartaoMesEntity(chargeId = chargeId, month = month, userId = userId))
        }
    }

    private suspend fun syncCardInvoiceExpense(userId: Long, cardId: Long, budgetId: Long, month: Int) {
        val card = cardDao.findCard(userId, cardId) ?: return
        val budget = budgetDao.findById(userId, budgetId) ?: return
        val total = cardDao.invoiceTotalCents(userId, cardId, budgetId, month).coerceAtLeast(0L)
        val chargeCount = cardDao.countChargesForInvoice(userId, cardId, budgetId, month)
        val existing = despesaDao.findCardInvoiceExpense(userId, cardId, budgetId, month)
        if (chargeCount <= 0) {
            despesaDao.deleteOpenCardInvoiceExpense(userId, cardId, budgetId, month)
            return
        }
        val isClosed = cardDao.isInvoiceClosed(userId, cardId, budgetId, month)
        val limit = (cardDao.findLimit(userId, cardId, budgetId, month)?.limitCents
            ?: card.defaultLimitCents).coerceAtLeast(0L)
        val invoiceExpenseAmount = if (isClosed) {
            total
        } else {
            maxOf(limit, total)
        }
        val categoryId = ensureCategory(userId, CARD_INVOICE_CATEGORY, CategoryType.DESPESA)
        val description = "Fatura do cartão ${card.name}"
        val dateIso = dateForMonth(null, budget.year, month, lastDay = true)
        if (existing == null) {
            despesaDao.insert(
                DespesaEntity(
                    userId = userId,
                    budgetId = budgetId,
                    categoryId = categoryId,
                    description = description,
                    amountCents = invoiceExpenseAmount,
                    month = month,
                    dateIso = dateIso,
                    status = "Pendente",
                    recurrenceType = RecurrenceType.EVENTUAL.name,
                    invoiceCardId = cardId,
                    invoiceBudgetId = budgetId,
                    invoiceMonth = month,
                    createdAt = timestamp()
                )
            )
        } else {
            despesaDao.update(
                existing.copy(
                    categoryId = categoryId,
                    description = description,
                    amountCents = invoiceExpenseAmount,
                    month = month,
                    dateIso = dateIso,
                    invoiceCardId = cardId,
                    invoiceBudgetId = budgetId,
                    invoiceMonth = month
                )
            )
        }
    }

    private suspend fun syncAllCardInvoiceExpenses(userId: Long) {
        database.withTransaction {
            cardDao.listCards(userId).forEach { card ->
                cardDao.listInvoiceKeysForCard(userId, card.id).forEach { invoice ->
                    syncCardInvoiceExpense(userId, card.id, invoice.budgetId, invoice.month)
                }
            }
        }
    }

    private fun buildCardSummaries(
        selectedBudgetId: Long?,
        budgets: List<BudgetItem>,
        cards: List<CardItem>,
        charges: List<CardChargeItem>,
        limits: List<CartaoLimiteMensalEntity>,
        closedInvoices: List<CartaoFaturaFechadaEntity>
    ): List<CardMonthlySummary> {
        val budget = budgets.firstOrNull { it.id == selectedBudgetId } ?: return emptyList()
        val limitsByKey = limits.associateBy { Triple(it.cardId, it.budgetId, it.month) }
        val closedKeys = closedInvoices.map { Triple(it.cardId, it.budgetId, it.month) }.toSet()
        return cards.flatMap { card ->
            budget.months.map { month ->
                val monthCharges = charges.filter {
                    it.cardId == card.id && it.budgetId == budget.id && it.month == month
                }
                CardMonthlySummary(
                    cardId = card.id,
                    cardName = card.name,
                    budgetId = budget.id,
                    month = month,
                    limitCents = limitsByKey[Triple(card.id, budget.id, month)]?.limitCents
                        ?: card.defaultLimitCents,
                    debitsCents = monthCharges
                        .filter { it.movement == CardMovement.DEBITO }
                        .sumOf { it.amountCents },
                    creditsCents = monthCharges
                        .filter { it.movement == CardMovement.CREDITO }
                        .sumOf { it.amountCents },
                    isClosed = Triple(card.id, budget.id, month) in closedKeys
                )
            }
        }
    }

    private suspend fun validateEntry(
        userId: Long,
        budgetId: Long,
        categoryId: Long?,
        expectedType: CategoryType,
        description: String,
        amountCents: Long,
        month: Int
    ) {
        if (description.isBlank() || amountCents <= 0L) {
            throw IllegalArgumentException("Descrição e valor são obrigatórios.")
        }
        validateBudgetMonth(userId, budgetId, month)
        if (categoryId == null) {
            throw IllegalArgumentException("Selecione uma categoria.")
        }
        validateCategory(userId, categoryId, expectedType)
    }

    private suspend fun validateBudgetMonth(userId: Long, budgetId: Long, month: Int) {
        if (month !in 1..12) {
            throw IllegalArgumentException("Mês inválido.")
        }
        val budget = budgetDao.findById(userId, budgetId)
            ?: throw IllegalArgumentException("Orçamento não encontrado.")
        val months = budgetDao.listMonths(userId, budget.id)
        if (months.isNotEmpty() && month !in months) {
            throw IllegalArgumentException("Mês não habilitado no orçamento.")
        }
    }

    private suspend fun validateCategory(userId: Long, categoryId: Long, expectedType: CategoryType) {
        val category = categoryDao.findById(userId, categoryId)
            ?: throw IllegalArgumentException("Categoria não encontrada.")
        if (category.type != expectedType.name) {
            throw IllegalArgumentException("Categoria incompatível com ${expectedType.name.lowercase()}.")
        }
    }

    private suspend fun validateCard(userId: Long, cardId: Long): CartaoEntity {
        return cardDao.findCard(userId, cardId)
            ?: throw IllegalArgumentException("Cartão não encontrado.")
    }

    private suspend fun ensureCategory(userId: Long, name: String, type: CategoryType): Long {
        val existing = categoryDao.findByNameAndType(userId, name, type.name)
        if (existing != null) return existing.id
        return categoryDao.insert(CategoriaEntity(userId = userId, name = name, type = type.name))
    }

    private suspend fun resolveBudgetMonth(
        userId: Long,
        startBudget: OrcamentoEntity,
        startMonth: Int,
        offset: Int
    ): Pair<OrcamentoEntity, Int> {
        var targetYear = startBudget.year
        var targetMonth = startMonth + offset
        while (targetMonth > 12) {
            targetMonth -= 12
            targetYear += 1
        }
        val budget = if (targetYear == startBudget.year) {
            startBudget
        } else {
            budgetDao.findByYear(userId, targetYear)
                ?: throw IllegalArgumentException("Crie o orçamento de $targetYear para concluir o parcelamento.")
        }
        validateBudgetMonth(userId, budget.id, targetMonth)
        return budget to targetMonth
    }

    private fun splitAmount(amountCents: Long, parts: Int): List<Long> {
        val safeParts = parts.coerceAtLeast(1)
        val base = amountCents / safeParts
        val remainder = amountCents % safeParts
        return (1..safeParts).map { index ->
            if (index == safeParts) base + remainder else base
        }
    }

    private fun recurrenceFrom(value: String?): RecurrenceType {
        return runCatching { RecurrenceType.valueOf(value ?: RecurrenceType.EVENTUAL.name) }
            .getOrDefault(RecurrenceType.EVENTUAL)
    }

    private fun movementFromDescription(description: String): CardMovement {
        return if (description.startsWith(CREDIT_TAG)) CardMovement.CREDITO else CardMovement.DEBITO
    }

    private fun taggedDescription(description: String, movement: CardMovement): String {
        return if (movement == CardMovement.CREDITO && !description.startsWith(CREDIT_TAG)) {
            "$CREDIT_TAG $description"
        } else {
            description
        }
    }

    private fun cleanCreditTag(description: String): String {
        return description.removePrefix(CREDIT_TAG).trim()
    }

    private fun displayCategoryName(name: String): String {
        return when (name) {
            "Salario" -> "Salário"
            "Bancos/Cartoes" -> CARD_INVOICE_CATEGORY
            else -> name
        }
    }

    private fun dateForMonth(baseDateIso: String?, year: Int, month: Int, lastDay: Boolean = false): String {
        val baseDay = baseDateIso
            ?.split("-")
            ?.getOrNull(2)
            ?.toIntOrNull()
            ?: 1
        val day = if (lastDay) daysInMonth(year, month) else min(baseDay, daysInMonth(year, month))
        return "%04d-%02d-%02d".format(Locale.US, year, month, day)
    }

    private fun daysInMonth(year: Int, month: Int): Int {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.YEAR, year)
            set(Calendar.MONTH, month - 1)
            set(Calendar.DAY_OF_MONTH, 1)
        }
        return calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    }

    private fun timestamp(): String = System.currentTimeMillis().toString()

    private data class InvoiceKey(
        val cardId: Long,
        val budgetId: Long,
        val month: Int
    )

    private companion object {
        const val CREDIT_TAG = "[CREDITO]"
        const val CARD_INVOICE_CATEGORY = "Bancos/Cartões"
    }
}
