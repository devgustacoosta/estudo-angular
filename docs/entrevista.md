# Perguntas técnicas a partir do portal

Use cada pergunta para uma resposta de 60–90 segundos e aponte o arquivo que demonstra o conceito. Responda primeiro sem ler os critérios.

| Pergunta                                                          | Uma boa resposta inclui                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Por que importar FieldComponent não injeta CartStore?             | Contexto de template versus resolução de objetos por injector                                    |
| Quando ngOnChanges ocorre e por que added não o dispara?          | Alteração de input detectada pelo Angular; output apenas comunica evento                         |
| ngOnInit atualiza detalhe quando ID da mesma rota muda?           | Hook uma vez por instância; paramMap observado para reutilização de rota                         |
| Como cabeçalho e checkout compartilham carrinho?                  | Alias/module identity compartilhado + provider root no mesmo injector                            |
| O que singleton de Native Federation realmente garante?           | Escolha de módulo; não impede providers filhos nem valida contratos locais sem versão            |
| O que há no remoteEntry e por que main/bootstrap estão separados? | Metadados de exposes/shared; import map pronto antes de imports Angular                          |
| O que acontece se remote cair?                                    | Fallback inicial; shell independente; limite em falhas lazy posteriores                          |
| Qual a diferença entre porta e adapter?                           | Interface necessária para negócio; objeto concreto implementa; interface apagada em runtime      |
| O caso de uso deve importar InjectionToken?                       | Não; composition Angular faz ligação e núcleo usa constructor normal                             |
| Como diferenciar dependência de execução?                         | PlaceOrder importa porta; em runtime chama objeto adapter                                        |
| Por que usamos Promise no núcleo e Observable na tela?            | Núcleo neutro, um resultado assíncrono; streams para concorrência/eventos; custo do cancelamento |
| Signals ou BehaviorSubject?                                       | Estado síncrono/derivação versus sequência temporal e RxJS; sem fontes concorrentes              |
| asReadonly impede mutação profunda?                               | Não; tipos readonly e atualizações imutáveis; não é deep freeze                                  |
| Como evitar vazamento de subscriptions?                           | toSignal, takeUntilDestroyed, DestroyRef; não repetir subscribe descontroladamente               |
| Qual operador usar em pesquisa, checkout e status?                | switchMap, exhaustMap, concatMap, com consequências de alternativas                              |
| Por que mergeMap tem concorrência 2 na reposição?                 | Produtos independentes; limita carga sem preservar ordem desnecessária                           |
| catchError fora do switchMap tem qual risco?                      | Pode encerrar stream de filtros permanentemente após primeira falha                              |
| O que finalize faz em cancelamento?                               | Libera recursos/flags na desinscrição, além de sucesso/erro                                      |
| 401 e 403 são equivalentes?                                       | Auth ausente/inválida versus permissão; refresh só 401 apropriado                                |
| Como evitar refresh em paralelo e loops?                          | Observable de renovação compartilhado; excluir login/refresh; retry interno limitado             |
| Guard protege API?                                                | Não; API revalida role e proprietário                                                            |
| CanMatch false significa proibição definitiva?                    | Router pode tentar outra rota correspondente; UrlTree redireciona                                |
| Como CanDeactivate espera usuário?                                | Retorno Promise resolvido por output do modal; busy bloqueia saída                               |
| O que CVA fornece?                                                | writeValue, registerOnChange, registerOnTouched, disabled; ponte FormControl ↔ controle visual   |
| ng-content e viewChild são a mesma coisa?                         | Conteúdo criado pelo consumidor versus view interna criada pelo componente                       |
| Como testar HTTP sem servidor?                                    | Providers ordenados, subscribe, expectOne URL/método, flush, verify, cenário de erro             |
| Como provar atualização de estoque segura?                        | Validação completa, trecho sem await, teste concorrente; limite de único processo                |
| O frontend pode definir preço/estoque?                            | Só feedback antecipado; API usa preço/estoque autoritativos                                      |
| Cite DIP, SRP e ISP com arquivos.                                 | PlaceOrder → OrderPort; regra separada; porta só place                                           |
| Qual dívida técnica existe aqui?                                  | Auth demo, memória, sem idempotência/transação distribuída, contratos locais sem versão          |
| O que mudou com standalone?                                       | Composição de template sem NgModule; DI continua independente; bootstrapApplication              |
| Onde OnPush pode falhar com mutação?                              | Mesmo objeto de input/array; use novas referências e signal set/update                           |
| Como testar acessibilidade além de cores?                         | Labels, teclado, foco/restauração, dialog, status/alert; leitor de tela humano                   |

## Desafio de desenho

“Precisamos de um terceiro remote para pagamento e de persistência do carrinho.” Explique quais contratos evoluiriam, o que não deveria ser compartilhado, como versionar a biblioteca e onde aplicar segurança. Não resolva apenas duplicando providers e stores em cada aplicação.

## Autoavaliação

Dê 0 se não explica; 1 se define o termo; 2 se mostra arquivo e comportamento; 3 se explica alternativa e custo. Priorize respostas abaixo de 2 em lifecycle, providers, estado, HTTP testing e portas/adapters. Após revisão, execute os testes relacionados e responda novamente em voz alta.
