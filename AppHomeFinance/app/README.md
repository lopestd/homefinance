# APP Android

Projeto Android iniciado com:

- Gradle Kotlin DSL (`AppHomeFinance/settings.gradle.kts` e `AppHomeFinance/build.gradle.kts`).
- Modulo `app` com Kotlin + Compose + Navigation.
- Pacote base `com.homefinance.app`.
- Estrutura por camadas: `core`, `data`, `domain`, `feature`, `navigation`.
- Fluxo funcional: `Criar conta local` -> `Login` -> `HomeFinance`.
- Persistencia local com Room para autenticacao e dados financeiros.

## Stack inicial

- Kotlin 1.9.24
- Android Gradle Plugin 8.3.2
- Jetpack Compose
- Navigation Compose
- Room
- DataStore

## Funcionalidades implementadas

1. Conta local (criacao, login, logout, sessao persistida).
2. Orcamentos locais por usuario.
3. Categorias locais de receita/despesa.
4. Receitas locais (cadastro, listagem, status, exclusao).
5. Despesas locais (cadastro, listagem, status, exclusao).
6. Dashboard local (saldo atual, saldo previsto e totais).
7. Relatorios locais por categoria.

## Como testar agora

1. Build debug:
`../scripts/build_debug.sh`

2. Testes unitarios:
`../scripts/test_unit.sh`

3. APK gerado:
`app/build/outputs/apk/debug/app-debug.apk`

4. Instalar no telefone com ADB:
`adb install -r app/build/outputs/apk/debug/app-debug.apk`
