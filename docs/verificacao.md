# Verificação e limitações reais

## Ambiente e versões instaladas

Verificação em 8 de outubro de 2026, Linux, Node **24.21.0** e npm **11.19.0**.

| Dependência                                                | Versão exata    |
| ---------------------------------------------------------- | --------------- |
| Angular core/common/forms/router/compiler/platform-browser | 21.2.25         |
| Angular CLI / build / devkit build-angular                 | 21.2.26         |
| Angular compiler-cli                                       | 21.2.25         |
| Native Federation Angular                                  | 21.2.6          |
| TypeScript                                                 | 5.9.3           |
| RxJS                                                       | 7.8.2           |
| Express / CORS                                             | 5.2.1 / 2.8.6   |
| Vitest / jsdom                                             | 4.1.11 / 28.1.0 |
| Playwright                                                 | 1.64.0          |

Os patches de CLI/build e framework diferem porque as linhas publicam patches próprios. Todos permanecem na linha 21.2. Todas as dependências diretas foram fixadas em package.json e o lockfile preserva transitivas. A compatibilidade foi confirmada com builds e execução federada no navegador, além da matriz oficial.

## Comandos executados

- Consulta oficial Angular versions/releases e guia oficial Native Federation v3 antes da seleção.
- `npm view @angular-architects/native-federation@21 version` e `npm view @angular/core@21 version` para confirmar releases estáveis disponíveis.
- `npm exec --yes --package=@angular/cli@21.2.16 -- ng new portal-pedidos --directory . --create-application=false --skip-git --package-manager=npm --defaults`.
- `npx ng generate application shell --routing --style=css --defaults` e equivalente para pedidos-remote.
- Instalação npm de Native Federation 21.2.6, Express, CORS, concurrently e Playwright; instalação adicional gerenciada pelo schematic.
- `npx ng generate @angular-architects/native-federation:init --project pedidos-remote --port 4201 --type remote` e shell com `--type dynamic-host --port 4200`.
- `npm install --package-lock-only` após fixar versões diretas.
- `npm ci`: passou, reinstalou 960 pacotes a partir do lockfile final; `npm run build` também passou após essa reinstalação.
- `npm exec -- playwright install chromium` e `npm exec -- playwright install-deps chromium`.
- `npm start`: API e dev servers shell/remote iniciaram nas três portas esperadas e foram encerrados com Ctrl+C.
- `npm run format`.
- `npm run verify`: passou nas verificações abaixo.
- `npm audit --json`: 12 avisos de ferramentas de desenvolvimento (10 high, 2 moderate).
- `npm audit --omit=dev --json`: zero vulnerabilidades conhecidas nas dependências de execução.
- `npm ls @angular/core @angular/cli @angular/build typescript rxjs @angular-architects/native-federation --depth=0`: versões acima.

## Resultado da verificação completa

`npm run verify` executou em sequência:

| Verificação                            | Resultado                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run check:architecture`           | Passou: domain/application sem imports Angular, HTTP, RxJS ou adapters                      |
| `npm run build`                        | Passou: builds production do pedidos-remote e shell, artefatos remoteEntry e Routes gerados |
| `ng test shell --watch=false`          | 15 testes passaram, 5 arquivos                                                              |
| `ng test pedidos-remote --watch=false` | 13 testes passaram, 5 arquivos                                                              |
| `npm run test:api`                     | 4 testes passaram                                                                           |
| `npm run test:e2e`                     | 8 testes Chromium passaram; 59,7 segundos incluindo inicialização dos servidores            |

Total: **40 testes passaram**, sem casos ignorados. Os E2E usam dev servers; produção foi compilada, mas não foi submetida a uma implantação pública ou auditoria operacional.

Os oito E2E comprovam:

1. Login → produto adicionado → checkout federado → UUID shell igual a UUID remote → finalização → contador zero → histórico.
2. Confirmação de saída: foco inicial, Escape preservando dados e descarte permitindo navegação.
3. Perfil cliente redirecionado na administração, sessão mantida.
4. Bloqueio somente do remoteEntry da porta 4201: shell continua, carrinho preservado e fallback exibido.
5. Admin: expiração → refresh 200 → painel, mudanças de status ordenadas e reposições independentes.
6. Busca, filtros atuais após navegar/voltar e paginação.
7. Erro 503 recuperável sem recarregar página, preservando sessão e carrinho.
8. Viewport 390 px, catálogo/checkout sem overflow horizontal e busca/navegação com teclado.

API: 401/403, rotação de refresh, preço calculado pelo servidor, duas finalizações concorrentes contra estoque 2 com respostas 201/409, ausência de desconto parcial, agregação de duplicatas e falha 503 controlada. Unitários HTTP verificam URLs/métodos, flush, verify e cenários de erro.

## Problemas encontrados e corrigidos

O primeiro scaffolding conflitou com README existente; seu conteúdo foi preservado em `README-original.md`. Testes precisaram apontar para `esbuild:development`, pois o unit-test builder Angular não aceita Native Federation como buildTarget. Um teste CVA revelou ID no host e no input; o atributo público virou fieldId, atribuído apenas ao input nativo. O Chromium exigiu bibliotecas Linux adicionais. A primeira simulação de fallback bloqueava também remoteEntry do shell; o teste foi corrigido para bloquear somente a origem remote.

As conexões locais de testes API exigiram execução fora da restrição de rede deste ambiente de trabalho. Em uma máquina local comum, os comandos do README não exigem essa configuração de sandbox.

## Limitações

- Autenticação demonstrativa e dados em memória. Reiniciar API apaga pedidos/estoque; recarregar browser apaga sessão/carrinho/filtros. Não é solução pronta para produção.
- Segurança de estoque garantida para um único processo Node local. Múltiplas instâncias exigem persistência e transações. Não há chave de idempotência para reenvio após perda de resposta.
- Os 12 avisos npm estão na cadeia de build/federação/webpack, incluindo braces e uuid transitivos. A correção automática sugerida envolve mudanças de major incompatíveis com esta linha; não foi aplicada por força. Não exponha os servidores de desenvolvimento como hospedagem de produção. Zero avisos em `--omit=dev` não é garantia de segurança completa.
- Shared mappings locais são singleton, mas não têm contrato npm versionado nem validação automática de versão do alias; o alinhamento é mantido pelo workspace e testes.
- Fallback verificado para indisponibilidade inicial/importação das rotas. Não cobre genericamente toda falha de chunk lazy depois de rotas já carregadas nem indisponibilidade com cache prévio do browser.
- CanDeactivate protege navegação Angular; não intercepta fechamento da aba ou recarga completa. Pedido em andamento bloqueia saída Angular; a Promise de escrita não é abortada automaticamente por desinscrição RxJS.
- Testes de teclado/foco/mobile não constituem auditoria completa de WCAG, leitores de tela ou todos os navegadores. Não foram executados Firefox/WebKit nem testes de carga.
- API e remote usam caminhos relativos no browser e proxy no dev server do shell. No Codespaces, apenas a porta 4200 precisa ser encaminhada. Uma hospedagem de produção precisa configurar reverse proxy equivalente para `/api` e `/remote/`: proxyConfig é exclusivo do servidor de desenvolvimento.

## Ajuste para GitHub Codespaces

Após identificar que localhost no browser não aponta para o container, API_URL passou a `/api` e o manifesto para `/remote/remoteEntry.json`. O shell aplica proxy para as portas internas, escuta em 0.0.0.0 e permite o domínio `.app.github.dev`. O remote escuta em 127.0.0.1 para coincidir com o destino do proxy.

Verificação desta alteração: `npm run build` passou; `ng test shell --watch=false` passou com 16 testes; `npm run test:e2e` passou com 9 testes. O E2E confere todas as requisições do navegador na origem do shell, finalização e identidade compartilhada, e aceita um header Host no formato do Codespaces. Os testes do remote/API anteriores não foram repetidos, pois seu código não mudou.

Foi necessário reiniciar o npm start antigo: o dev server não aplica alteração de proxy apenas por recarregamento automático. Os testes aguardam a disponibilidade de API e remote antes de começar. A integração foi verificada pelo proxy local com host simulado; o acesso externo autenticado do usuário no GitHub permanece a ser aberto no seu navegador.
