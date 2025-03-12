#!/bin/bash

# Parando serviço do swarm backend-suporte
docker stack rm backend-suporte

# Removendo imagem antiga
docker image rm suporte-back:latest

# Construir a imagem nova
docker build -t suporte-back:latest .

# Deployar o stack
docker stack deploy -c docker-compose.yml backend-suporte