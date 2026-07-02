package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "audit_log",
    indices = [
        Index(value = ["id_usuario"])
    ]
)
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id_log")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long?,
    @ColumnInfo(name = "acao")
    val action: String,
    @ColumnInfo(name = "detalhes")
    val detailsJson: String? = null,
    @ColumnInfo(name = "ip_origem")
    val sourceIp: String? = null,
    @ColumnInfo(name = "user_agent")
    val userAgent: String? = null,
    @ColumnInfo(name = "data_evento")
    val createdAt: String
)

