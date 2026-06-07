package com.homefinance.app.core.validation

private val emailRegex = Regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

fun validateDisplayName(value: String): String? {
    val normalized = value.trim()
    return when {
        normalized.isEmpty() -> "Informe seu nome."
        normalized.length < 2 -> "Nome muito curto."
        else -> null
    }
}

fun validateEmail(value: String): String? {
    val normalized = value.trim()
    return when {
        normalized.isEmpty() -> "Informe seu email."
        !emailRegex.matches(normalized) -> "Email invalido."
        else -> null
    }
}

fun validatePassword(value: String): String? {
    return when {
        value.isBlank() -> "Informe sua senha."
        value.length < 8 -> "Senha deve ter ao menos 8 caracteres."
        else -> null
    }
}

