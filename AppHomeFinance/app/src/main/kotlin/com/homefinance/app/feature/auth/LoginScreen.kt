package com.homefinance.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.homefinance.app.core.ui.theme.HfBlue
import com.homefinance.app.core.ui.theme.HfMuted
import com.homefinance.app.core.ui.theme.HfNavy
import com.homefinance.app.core.ui.theme.HfNavyDeep
import com.homefinance.app.core.ui.theme.HfPage
import com.homefinance.app.core.ui.theme.HfSurface
import com.homefinance.app.core.ui.theme.HfText

@Composable
fun LoginScreen(
    state: AuthUiState,
    onLogin: (email: String, password: String) -> Unit,
    onNavigateToCreateAccount: () -> Unit
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    AuthBackground {
        AuthCard {
            AuthBrand()
            Text(
                text = "Entrar",
                style = MaterialTheme.typography.titleLarge,
                color = HfText
            )
            Text(
                text = "Acesse seus dados locais do HomeFinance.",
                style = MaterialTheme.typography.bodyMedium,
                color = HfMuted
            )
            Spacer(Modifier.height(2.dp))
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") },
                singleLine = true
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Senha") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true
            )
            Button(
                onClick = { onLogin(email, password) },
                enabled = !state.isSaving,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (state.isSaving) {
                    CircularProgressIndicator(strokeWidth = 2.dp)
                } else {
                    Text("Entrar")
                }
            }
            if (!state.hasLocalAccount) {
                TextButton(
                    onClick = onNavigateToCreateAccount,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Criar conta local")
                }
            }
            if (!state.message.isNullOrBlank()) {
                Text(
                    text = state.message.orEmpty(),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun AuthBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(HfNavyDeep, HfNavy, HfPage),
                    startY = 0f,
                    endY = 840f
                )
            )
            .padding(18.dp),
        contentAlignment = Alignment.Center
    ) {
        content()
    }
}

@Composable
private fun AuthCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = HfSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            content = content
        )
    }
}

@Composable
private fun AuthBrand() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = HfBlue.copy(alpha = 0.12f),
            contentColor = HfBlue
        ) {
            Icon(
                imageVector = Icons.Filled.AccountCircle,
                contentDescription = null,
                modifier = Modifier
                    .padding(10.dp)
                    .size(28.dp)
            )
        }
        Text(
            text = "HomeFinance",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = HfText
        )
    }
}
