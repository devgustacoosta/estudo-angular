# Mapa de arquivos e requisitos

## Estrutura

```text
api/                                   API separada, dados e autorização
projects/
  shell/src/app/
    core/                              AuthService, interceptors, guards
    layout/                            Cabeçalho, navegação, outlet, diagnóstico
    shared/                            Páginas de fallback
    features/
      auth/                            Login
      catalog/
        presentation/                  Filtros, listagem, card, store de filtros
        infrastructure/                GET produtos
      admin/                           Dashboard e operações simples
  pedidos-remote/src/app/
    order.routes.ts                    Contrato de rotas exposto
    features/orders/
      presentation/                    Checkout, histórico, detalhe, guard de saída
      application/
        place-order.ts                 Caso de uso sem Angular
        ports/order.port.ts            Contrato necessário para finalizar
      domain/                          DTOs puros e regra de estoque
      infrastructure/                  Adapters HTTP/memória e query HTTP
  portal-contracts/src/                API pública, DTOs, stores e token API
  portal-ui/src/                       Botão, CVA, modal, estado, pipe, diretiva, CSS
  */federation.config.js               Sharing/exposes Native Federation
scripts/                               Verificação de limites arquiteturais
e2e/                                   Integração real no navegador
docs/                                  Explicações, trilha e soluções
```

Caminhos relevantes: [core](../projects/shell/src/app/core), [catálogo](../projects/shell/src/app/features/catalog), [pedidos](../projects/pedidos-remote/src/app/features/orders), [biblioteca de contratos](../projects/portal-contracts/src/public-api.ts), [biblioteca visual](../projects/portal-ui/src/public-api.ts), [API](../api/server.mjs).

## Temas e evidências

| Tema                                 | Arquivos                                                                             | Evidência de comportamento                           |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Native Federation e lazy loading     | `*/federation.config.js`, shell `main.ts`, `app.routes.ts`, remote `order.routes.ts` | E2E checkout carregado e fallback                    |
| Identidade do carrinho               | `portal-contracts/cart.store.ts`, layout, checkout                                   | E2E compara instanceId e contador zerado             |
| Imports versus DI                    | checkout imports, `http-order.adapter.ts`, `app.config.ts`                           | CVA renderizado e caso de uso composto               |
| Hexagonal, porta e adapters          | orders application/domain/infrastructure                                             | `place-order.spec.ts`, adapter memória               |
| TypeScript strict                    | `tsconfig.json`, domain types, InjectionToken genérico                               | Build e testes compilados com strictTemplates        |
| ngOnInit                             | HistoryPage, AdminPage                                                               | Consultas iniciais                                   |
| ngOnChanges e input/output           | ProductCard                                                                          | `product-card.spec.ts`                               |
| ngAfterViewInit e projeção           | ConfirmComponent                                                                     | E2E foco/Escape                                      |
| DestroyRef e cleanup                 | checkout, filter-bar, history                                                        | takeUntilDestroyed e resolução de Promise pendente   |
| Signals e imutabilidade              | CartStore, AdminPage computed                                                        | `core/state.spec.ts`                                 |
| BehaviorSubject privado/asObservable | FiltersStore                                                                         | `core/state.spec.ts`                                 |
| Observable → signal                  | CatalogPage, DetailPage                                                              | View-model de busca, subscription automática         |
| debounce/distinct/switchMap          | FilterBar, CatalogPage                                                               | Cenário de busca e teste E2E de catálogo             |
| exhaustMap                           | CheckoutPage, LoginPage                                                              | Teste envio concorrente checkout                     |
| concatMap                            | AdminPage updates                                                                    | E2E separar/enviar                                   |
| mergeMap limitado                    | AdminPage restock                                                                    | E2E três reposições                                  |
| catchError/finalize                  | login, catálogo, checkout, admin                                                     | Erros unitários/API e cenários de recuperação        |
| Interceptors funcionais              | core/interceptors                                                                    | `interceptors.spec.ts`                               |
| Refresh único, sem loop              | AuthService, refreshInterceptor                                                      | Dois 401, um refresh; retry 401 não renova novamente |
| 401 e 403                            | API, guards, interceptors                                                            | Unitários + API + E2E sessão preservada              |
| CanActivate/Child/Match              | core/guards, shell routes                                                            | `guards.spec.ts`                                     |
| CanDeactivate                        | unsaved.guard, checkout                                                              | `unsaved.guard.spec.ts`, E2E modal                   |
| Componentes reutilizáveis            | portal-ui/public-api.ts                                                              | Uso no login, cards, checkout, histórico/admin       |
| CVA/formulário reativo               | FieldComponent, CheckoutPage                                                         | formulário válido/inválido, input/touched            |
| Pipe e diretiva                      | BrlPipe, SelectOnFocusDirective                                                      | moeda em todo portal, seleção no input de reposição  |
| HttpTestingController                | catalog.service.spec, http-order.adapter.spec                                        | URL, método, corpo, flush, verify, erros             |
| Estoque e quantidade                 | domain/order-rules, API                                                              | Regra pura e concorrência API                        |
| Clean Code e SOLID                   | PlaceOrder, OrderPort, adapters                                                      | Troca de adapter sem Angular/HTTP                    |
| Dashboard derivado                   | AdminPage                                                                            | pedidos/receita/média via computed                   |
| Acessibilidade/responsividade        | portal-ui/styles.css, labels, dialog                                                 | E2E teclado/foco e viewport pequeno                  |
| Segurança                            | API e authorizationInterceptor                                                       | preço servidor, role/dono, origem autorizada         |
| Versões Angular/NgModules            | docs/decisoes                                                                        | Matriz oficial e migração conceitual                 |
| Exercícios e entrevista              | docs/exercicios, solucoes, entrevista                                                | Trilha progressiva com critérios de aceitação        |

Os testes e2e adicionais de catálogo/viewport constam em `e2e/portal.spec.ts`; consulte `verificacao.md` para distinguir implementação de evidência efetivamente executada.
