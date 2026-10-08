# Funcionalidades acompanhadas pelo código

Caminhos abaixo são relativos a `projects/shell/src/app` (S), `projects/pedidos-remote/src/app` (R) e `projects/portal-contracts/src/lib` (C). Veja os links completos no mapa.

## Login e renovação

1. **Problema:** identificar usuário fictício e permitir continuar após expiração curta do token.
2. **Interação:** `/login`, formulário LoginPage ou botões para preencher perfil.
3. **Arquivos:** S `features/auth/login-page.ts`, `core/auth.service.ts`, `core/interceptors.ts`, C `session.store.ts`, API `server.mjs`.
4. **Dados:** FormGroup → Subject → exhaustMap → AuthService → POST login → SessionStore. Na API protegida, Authorization acompanha token; 401 inicia refresh compartilhado e repete a chamada. Logout limpa sessão e carrinho.
5. **Alternativa:** cookie de sessão HttpOnly e servidor com proteção CSRF; store dedicado com persistência e fluxo de retorno. Não adapte o token de demonstração diretamente para produção.
6. **Entrevista:** “A tela coleta credenciais; o serviço coordena a sessão. O interceptor só envia token à API permitida e consolida refresh concorrente. 403 mantém a sessão, porque é falta de permissão, e não expiração.”

## Catálogo: busca, filtro e paginação

1. **Problema:** encontrar produtos sem carregar toda a base nem realizar uma requisição a cada tecla.
2. **Interação:** campo de busca, select de categoria e navegação de página em `/catalogo`.
3. **Arquivos:** S `features/catalog/presentation/filter-bar.ts`, `filters.store.ts`, `catalog-page.ts`, `product-card.ts`, `infrastructure/catalog.service.ts`.
4. **Dados:** controles → debounce/distinct → BehaviorSubject privado de filtros → switchMap para GET products → modelo loading/resultado/erro → toSignal → cards. Filho recebe input e emite added; pai decide como atualizar carrinho. API pagina em grupos de seis.
5. **Alternativa:** query params como fonte dos filtros para permitir links compartilháveis; AsyncPipe para consumir o Observable diretamente.
6. **Entrevista:** “Usei BehaviorSubject porque novos assinantes recebem o filtro atual. switchMap substitui a consulta anterior. toSignal é uma ponte de apresentação, não uma segunda fonte de filtros.”

## Carrinho entre componentes distantes

1. **Problema:** catálogo, cabeçalho e checkout precisam refletir os mesmos itens.
2. **Interação:** “Adicionar produto”, alteração de quantidade ou remoção no checkout.
3. **Arquivos:** C `cart.store.ts` e `models.ts`; S `layout/layout.ts`, `catalog-page.ts`; R `features/orders/presentation/checkout-page.ts`; configs de federação.
4. **Dados:** método add/setQuantity → novo array no signal privado → computed quantidade/subtotal/total → templates OnPush. A classe vem do alias compartilhado; provider root fica no shell. IDs do serviço aparecem em ambos para verificação.
5. **Alternativa:** estado central mais elaborado quando o produto crescer; persistência versionada no browser; integração via eventos/contrato API em microfrontends completamente isolados.
6. **Entrevista:** “Singleton no federation preserva identidade do módulo. Provider root no mesmo injector preserva identidade do serviço. Provider no checkout quebraria o compartilhamento mesmo com a classe compartilhada.”

## Checkout e finalização

1. **Problema:** reunir dados de entrega, impedir envio concorrente e aplicar regras de quantidade e estoque.
2. **Interação:** `/pedidos/checkout`, formulário reativo com campo CVA e botão Finalizar.
3. **Arquivos:** R `presentation/checkout-page.ts`, `application/place-order.ts`, `application/ports/order.port.ts`, `domain/order.ts`, `domain/order-rules.ts`, `infrastructure/http-order.adapter.ts`, `order.routes.ts`; UI `public-api.ts`; API.
4. **Dados:** FormGroup → Validators → exhaustMap → snapshot de linhas → caso de uso → domínio → objeto que implementa porta → POST HTTP → servidor autoriza e valida estoque real → pedido → carrinho clear, pristine e navegação. Em falha, dados permanecem e busy é liberado por finalize.
5. **Alternativa:** facade para reduzir coordenação da tela em checkout maior; operação idempotente com chave por tentativa; transação persistente na API. Adapter de memória já demonstra troca da infraestrutura para testes.
6. **Entrevista:** “Meu caso de uso recebe uma interface pelo construtor e pode ser testado sem Angular. A interface não encaminha chamadas: o adapter recebido executa o método. A validação cliente é antecipação; a API decide definitivamente.”

## Alterações não salvas e modal

1. **Problema:** evitar perder dados de entrega ao navegar e permitir interação por teclado.
2. **Interação:** navegação após alterar o formulário; Escape ou botões no modal.
3. **Arquivos:** R `presentation/unsaved.guard.ts`, `checkout-page.ts`; `portal-ui/src/public-api.ts` ConfirmComponent.
4. **Dados:** router chama guard → canLeave verifica dirty/busy → Promise aguarda output decision → resolução permite/bloqueia navegação. viewChild acessa dialog só depois de AfterViewInit; showModal gerencia foco; retorno restaura elemento anterior.
5. **Alternativa:** serviço de confirmação com overlay acessível; draft persistido para recuperar formulário. O guard protege navegação Angular, não fechamento da aba ou recarga completa.
6. **Entrevista:** “CanDeactivate consulta um contrato da página, não acessa seu FormGroup diretamente. A view do modal é diferente do conteúdo projetado que o checkout fornece.”

## Histórico e detalhes

1. **Problema:** acompanhar pedidos próprios e saber composição, total, entrega e status.
2. **Interação:** link Meus pedidos e Ver detalhes; após sucesso do checkout.
3. **Arquivos:** R `presentation/history-page.ts`, `detail-page.ts`, `infrastructure/orders-query.service.ts`; S guards e rotas.
4. **Dados:** HistoryPage inicia consulta em ngOnInit e encerra via DestroyRef; detalhes reagem a paramMap com switchMap. API devolve pedidos do usuário e verifica dono/admin no detalhe. Rotas remote são carregadas de forma lazy pelo shell.
5. **Alternativa:** resolver de rotas; cache de queries com invalidação explícita; fachada de leitura. Para GET simples não criamos uma arquitetura de escrita completa.
6. **Entrevista:** “ngOnInit serve para primeira consulta por instância. Se apenas o parâmetro da mesma rota muda, a instância pode ser reutilizada: observo paramMap para atualizar o detalhe.”

## Administração e autorização

1. **Problema:** restringir operações de status/estoque ao perfil admin.
2. **Interação:** link Administração, botões Separar/Enviar e reposição de três produtos.
3. **Arquivos:** S `features/admin/admin-page.ts`, `core/guards.ts`, `app.routes.ts`; API `/admin`.
4. **Dados:** CanMatch escolhe/redireciona rota antes de ativar → ngOnInit GET pedidos globais → Subject de status usa concatMap → PATCH e atualização imutável. Reposição independente usa mergeMap limite 2, coleta sucesso/falha por produto. API revalida role em cada acesso.
5. **Alternativa:** separar cada pedido em fila independente com groupBy; atualizações otimistas com rollback; permissões por capacidade em vez de dois perfis.
6. **Entrevista:** “ConcatMap preserva a ordem da intenção do administrador. Reposições independentes podem correr em paralelo limitado. O guard não é uma barreira de segurança para a API.”

## Dashboard

1. **Problema:** visualizar volume de pedidos, receita e ticket médio sem contadores divergentes.
2. **Interação:** abrir administração ou clicar Atualizar painel.
3. **Arquivos:** S `features/admin/admin-page.ts`, pipe BrlPipe em `portal-ui`.
4. **Dados:** GET admin/orders → signal orders → computed revenue e average → template/pipe de centavos para moeda. Lista vazia produz receita e média zero, sem divisão por zero.
5. **Alternativa:** agregar no backend quando houver muitos pedidos e paginação; gráficos se trouxerem informação adicional.
6. **Entrevista:** “Computed deriva os indicadores de uma fonte. Eu evitaria manter pedidos e receita como estados editáveis independentes.”

## Falhas, refresh e remote indisponível

1. **Problema:** reconhecer diferentes falhas sem travar o produto inteiro.
2. **Interação:** laboratório HTTP na administração; acesso a pedidos com remote ausente.
3. **Arquivos:** S `core/interceptors.ts`, `app.routes.ts`, `shared/fallback-page.ts`; API `/demo/config`, `/demo/expire`.
4. **Dados:** falha de API vira feedback da funcionalidade e registro transversal; expiração gera refresh único; falha de importação das rotas remote é capturada e devolve rotas de fallback. O carrinho fica no shell.
5. **Alternativa:** telemetria real e circuit breaker; prefetch/health check de remote; error handler específico para falhas de chunks lazy depois do carregamento inicial.
6. **Entrevista:** “Erros de autenticação, autorização, transporte e carregamento remoto têm causas e recuperações diferentes. Capturo perto de onde consigo fornecer recuperação útil.”
