package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "despesas",
    indices = [
        Index(value = ["id_usuario", "orcamento_id"])
    ]
)
data class DespesaEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long,
    @ColumnInfo(name = "orcamento_id")
    val budgetId: Long,
    @ColumnInfo(name = "categoria_id")
    val categoryId: Long?,
    @ColumnInfo(name = "descricao")
    val description: String,
    @ColumnInfo(name = "complemento")
    val complement: String? = null,
    @ColumnInfo(name = "valor_centavos")
    val amountCents: Long,
    @ColumnInfo(name = "mes_referencia", defaultValue = "1")
    val month: Int = 1,
    @ColumnInfo(name = "data")
    val dateIso: String? = null,
    @ColumnInfo(name = "status")
    val status: String,
    @ColumnInfo(name = "tipo_recorrencia", defaultValue = "'EVENTUAL'")
    val recurrenceType: String = "EVENTUAL",
    @ColumnInfo(name = "parcela_atual")
    val installment: Int? = null,
    @ColumnInfo(name = "total_parcelas")
    val totalInstallments: Int? = null,
    @ColumnInfo(name = "fatura_cartao_id")
    val invoiceCardId: Long? = null,
    @ColumnInfo(name = "fatura_orcamento_id")
    val invoiceBudgetId: Long? = null,
    @ColumnInfo(name = "fatura_mes")
    val invoiceMonth: Int? = null,
    @ColumnInfo(name = "criado_em")
    val createdAt: String
)
