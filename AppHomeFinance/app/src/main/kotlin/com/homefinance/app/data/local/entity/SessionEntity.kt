package com.homefinance.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sessoes",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id_usuario"],
            childColumns = ["id_usuario"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["id_usuario"]),
        Index(value = ["ativa"])
    ]
)
data class SessionEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id_sessao")
    val id: Long = 0L,
    @ColumnInfo(name = "id_usuario")
    val userId: Long,
    @ColumnInfo(name = "token_hash")
    val tokenHash: String,
    @ColumnInfo(name = "data_criacao")
    val createdAt: String,
    @ColumnInfo(name = "ativa")
    val isActive: Boolean
)

