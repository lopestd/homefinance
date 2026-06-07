package com.homefinance.app.core.security

import java.security.MessageDigest
import java.security.SecureRandom

object PasswordHasher {
    private val random = SecureRandom()

    fun generateSaltHex(sizeBytes: Int = 16): String {
        val salt = ByteArray(sizeBytes)
        random.nextBytes(salt)
        return salt.toHex()
    }

    fun hashPassword(password: String, saltHex: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val payload = "$password:$saltHex".toByteArray(Charsets.UTF_8)
        return digest.digest(payload).toHex()
    }

    fun hashValue(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(value.toByteArray(Charsets.UTF_8)).toHex()
    }

    private fun ByteArray.toHex(): String = joinToString("") { byte ->
        "%02x".format(byte)
    }
}
