package com.homefinance.app.data.repository

import android.net.Uri

interface BackupRepository {
    suspend fun exportBackup(destination: Uri): Result<Unit>
    suspend fun restoreBackup(source: Uri): Result<Unit>
}
