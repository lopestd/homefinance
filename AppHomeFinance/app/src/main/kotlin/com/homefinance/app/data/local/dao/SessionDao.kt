package com.homefinance.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.homefinance.app.data.local.entity.SessionEntity

@Dao
interface SessionDao {
    @Query("SELECT * FROM sessoes WHERE ativa = 1 ORDER BY id_sessao DESC LIMIT 1")
    suspend fun getActiveSession(): SessionEntity?

    @Query("UPDATE sessoes SET ativa = 0 WHERE ativa = 1")
    suspend fun deactivateAllSessions()

    @Insert
    suspend fun insert(session: SessionEntity): Long
}

