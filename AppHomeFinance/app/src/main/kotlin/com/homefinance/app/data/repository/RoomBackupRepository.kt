package com.homefinance.app.data.repository

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.net.Uri
import androidx.room.withTransaction
import com.homefinance.app.data.local.HomeFinanceDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class RoomBackupRepository(
    private val context: Context,
    private val database: HomeFinanceDatabase
) : BackupRepository {

    override suspend fun exportBackup(destination: Uri): Result<Unit> {
        return runCatching {
            val backup = JSONObject()
                .put("app", APP_NAME)
                .put("backupVersion", BACKUP_VERSION)
                .put("createdAt", currentTimestamp())
                .put("databaseVersion", DATABASE_VERSION)
                .put("userMode", "LOCAL_PROFILE")
                .put("data", exportTables())

            context.contentResolver.openOutputStream(destination)?.use { output ->
                output.write(backup.toString(2).toByteArray(Charsets.UTF_8))
            } ?: throw IllegalArgumentException("Não foi possível criar o arquivo de backup.")
        }.map { Unit }
    }

    override suspend fun restoreBackup(source: Uri): Result<Unit> {
        return runCatching {
            val payload = context.contentResolver.openInputStream(source)?.use { input ->
                input.readBytes().toString(Charsets.UTF_8)
            } ?: throw IllegalArgumentException("Não foi possível ler o arquivo de backup.")

            val backup = JSONObject(payload)
            validateBackup(backup)
            val data = backup.getJSONObject("data")

            database.withTransaction {
                val db = database.openHelper.writableDatabase
                DELETE_TABLES.forEach { table ->
                    db.delete(table, null, emptyArray())
                }
                BACKUP_TABLES.forEach { table ->
                    val rows = data.optJSONArray(table) ?: JSONArray()
                    for (index in 0 until rows.length()) {
                        val insertedId = db.insert(table, 0, rows.getJSONObject(index).toContentValues())
                        if (insertedId == -1L) {
                            throw IllegalStateException("Falha ao restaurar dados da tabela $table.")
                        }
                    }
                }
                database.sessionDao().deactivateAllSessions()
            }
        }.map { Unit }
    }

    private fun exportTables(): JSONObject {
        val db = database.openHelper.readableDatabase
        val data = JSONObject()
        BACKUP_TABLES.forEach { table ->
            db.query("SELECT * FROM `$table`").use { cursor ->
                data.put(table, cursor.toJsonArray())
            }
        }
        return data
    }

    private fun validateBackup(backup: JSONObject) {
        if (backup.optString("app") != APP_NAME) {
            throw IllegalArgumentException("Arquivo de backup inválido.")
        }
        if (backup.optInt("backupVersion") != BACKUP_VERSION) {
            throw IllegalArgumentException("Versão de backup não suportada.")
        }
        if (backup.optInt("databaseVersion") > DATABASE_VERSION) {
            throw IllegalArgumentException("Backup gerado por uma versão mais recente do APP.")
        }
        if (!backup.has("data") || backup.optJSONObject("data") == null) {
            throw IllegalArgumentException("Arquivo de backup sem dados.")
        }
    }

    private fun currentTimestamp(): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date())
    }

    private fun Cursor.toJsonArray(): JSONArray {
        val rows = JSONArray()
        while (moveToNext()) {
            val row = JSONObject()
            columnNames.forEachIndexed { index, column ->
                when (getType(index)) {
                    Cursor.FIELD_TYPE_NULL -> row.put(column, JSONObject.NULL)
                    Cursor.FIELD_TYPE_INTEGER -> row.put(column, getLong(index))
                    Cursor.FIELD_TYPE_FLOAT -> row.put(column, getDouble(index))
                    Cursor.FIELD_TYPE_STRING -> row.put(column, getString(index))
                    Cursor.FIELD_TYPE_BLOB -> row.put(column, android.util.Base64.encodeToString(getBlob(index), android.util.Base64.NO_WRAP))
                }
            }
            rows.put(row)
        }
        return rows
    }

    private fun JSONObject.toContentValues(): ContentValues {
        val values = ContentValues()
        keys().forEach { key ->
            when (val value = get(key)) {
                JSONObject.NULL -> values.putNull(key)
                is Int -> values.put(key, value)
                is Long -> values.put(key, value)
                is Double -> values.put(key, value)
                is Boolean -> values.put(key, if (value) 1 else 0)
                else -> values.put(key, value.toString())
            }
        }
        return values
    }

    private companion object {
        const val APP_NAME = "AppHomeFinance"
        const val BACKUP_VERSION = 1
        const val DATABASE_VERSION = 3

        val BACKUP_TABLES = listOf(
            "usuarios",
            "orcamentos",
            "orcamento_meses",
            "saldo_inicial_orcamento",
            "categorias",
            "gastos_predefinidos",
            "tipos_receita",
            "receitas",
            "receitas_meses",
            "despesas",
            "despesas_meses",
            "cartoes",
            "cartao_limites_mensais",
            "cartao_faturas_fechadas",
            "lancamentos_cartao",
            "lancamentos_cartao_meses",
            "audit_log",
            "cartao_meses",
            "cartao_lancamentos"
        )

        val DELETE_TABLES = listOf("sessoes") + BACKUP_TABLES.reversed()
    }
}
