# Build_Docker_Local

Configuração Docker local do HomeFinance sem usar `build_docker`.

## Escopo

- Somente aplicação: backend + frontend na mesma imagem.
- Banco de dados **não** é criado aqui.
- O backend conecta em um banco externo já existente via variáveis de ambiente.

## Arquivos

- `Dockerfile`: build do frontend e runtime do backend na mesma imagem.
- `docker-compose.local.yml`: sobe apenas o serviço `homefinance-local`.
- `.env.docker.local.example`: template de variáveis obrigatórias.
- `homefinance_local.sh`: script facilitado para subir/parar/ver logs/status.

## Como executar (script facilitado)

1. Executar (na raiz do projeto):

```bash
./Build_Docker_Local/homefinance_local.sh up
```

2. Na primeira execução, o script cria `Build_Docker_Local/.env.docker.local` automaticamente e encerra.

3. Ajustar os valores de banco e JWT nesse arquivo e executar novamente:

```bash
./Build_Docker_Local/homefinance_local.sh up
```

4. Acessar:

`http://localhost:<HOST_PORT>` (ex.: `http://localhost:3001`)

## Comandos do script

```bash
./Build_Docker_Local/homefinance_local.sh up
./Build_Docker_Local/homefinance_local.sh down
./Build_Docker_Local/homefinance_local.sh restart
./Build_Docker_Local/homefinance_local.sh logs
./Build_Docker_Local/homefinance_local.sh status
```

## Observações

- O frontend é servido pelo backend em produção.
- As chamadas da UI usam `/api`, então frontend e backend funcionam no mesmo host/porta.
- A porta externa é controlada por `HOST_PORT` no `.env.docker.local`.
