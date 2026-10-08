# Portal Lab — Angular para entrevista

Portal de pedidos em português, com shell e remote carregado por Native Federation, API local e estudo guiado. Nível: júnior avançado a pleno inicial.

## Começar

Requisitos: Node 24, npm e portas 3000, 4200 e 4201 disponíveis. O navegador acessa API e remote pela origem do shell, usando o proxy de desenvolvimento.

```bash
nvm use
npm ci
npm start
```

No computador local, abra **http://localhost:4200**. No **GitHub Codespaces**, abra a aba **Portas (Ports)** e clique em **Abrir no navegador** na porta **4200** (URL `https://...-4200.app.github.dev`). Só essa porta precisa ser encaminhada; API 3000 e remote 4201 são acessados pelo proxy dentro do container. A porta 4200 pode permanecer privada.

Se o ambiente já estiver rodando após mudar a configuração, encerre com `Ctrl+C`, execute `npm start` novamente e recarregue a página.

O shell usa `/api` → `127.0.0.1:3000` e `/remote/` → `127.0.0.1:4201`, via `projects/shell/proxy.conf.json`. O manifesto aponta para `/remote/remoteEntry.json`, sem localhost no navegador.

`npm start` inicia API, pedidos-remote e shell; espere a conclusão dos builds de ambos. `Ctrl+C` encerra os três processos. Não abra a porta 4201 para usar o produto: ela serve o remote para o shell.

| Perfil        | E-mail             | Senha   |
| ------------- | ------------------ | ------- |
| Cliente       | cliente@demo.local | demo123 |
| Administrador | admin@demo.local   | demo123 |

Não há serviço pago, banco externo ou segredo necessário. Login é uma demonstração educacional, sem garantias de segurança para produção. Sessão e carrinho estão apenas em memória no navegador. Pedidos e estoque ficam em memória no processo da API.

## Verificar

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Em Linux sem as bibliotecas do navegador, use `npx playwright install --with-deps chromium` (pode exigir permissão administrativa). Os testes E2E iniciam o ambiente automaticamente. Use `CI=1 npm run test:e2e` com portas livres para exigir um ambiente novo; reutilizar um servidor com estoque alterado pode afetar os testes.

`npm run verify` executa build, testes unitários/API e E2E. `npm run start:api`, `npm run start:remote` e `npm run start:shell` permitem iniciar processos separados para explorar falhas. `npm run format` formata código e documentação.

## Roteiro de demonstração

1. Entre como cliente, busque “teclado” e adicione um produto.
2. Observe o contador no cabeçalho; abra o checkout. Compare os identificadores em “Diagnóstico de integração” e “Diagnóstico do estado compartilhado” no rodapé. O E2E também compara os dois valores.
3. Preencha endereço, CEP sem pontuação e aceite os termos. Finalize e consulte histórico/detalhes.
4. Altere o formulário e navegue: o modal permite continuar editando ou descartar; Escape cancela a saída.
5. Entre como administrador e veja os indicadores dos pedidos de todos os usuários. Atualize status, reponha estoque e experimente o laboratório HTTP.
6. Expire o token e atualize o painel: em Network, veja 401 → um POST `/refresh` → repetição com token novo.
7. Configure uma falha 503 e navegue ao catálogo. Use “Tentar novamente”. Não há notificação global duplicada.
8. Para testar indisponibilidade inicial, encerre os servidores e inicie somente API e shell em terminais separados. Faça login e abra o carrinho: será apresentado o fallback. Depois inicie o remote e recarregue o portal. Recarregar limpa a sessão e o carrinho.

## Material de estudo

- [Guia completo: conceitos, configuração e todos os fluxos do portal](docs/guia-completo-angular.md)

- [Versões e decisões](docs/decisoes.md)
- [Arquitetura, comunicação e conceitos](docs/arquitetura.md)
- [TypeScript com exemplos do portal](docs/typescript.md)
- [Funcionalidades: fluxo e resposta de entrevista](docs/funcionalidades.md)
- [Mapa de arquivos e requisitos](docs/mapa.md)
- [Trilha de exercícios sem respostas](docs/exercicios.md)
- [Soluções para consultar depois](docs/solucoes.md)
- [Perguntas técnicas](docs/entrevista.md)
- [Resultados da verificação e limitações](docs/verificacao.md)

O código não contém comentários didáticos; as explicações estão nestes documentos. Não existe um repositório genérico para cada chamada: a arquitetura hexagonal completa foi aplicada à operação com regra de negócio, a finalização de pedido.
