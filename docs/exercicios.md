# Trilha progressiva — tente antes de consultar soluções

Reserve 6 sessões de 45–75 minutos. Comece rodando o produto e os testes. Registre previsões antes de editar; use uma branch para cada exercício. As soluções estão em outro arquivo: não o abra antes de terminar a tentativa.

## Sessão 1 — lifecycle e comunicação

### 1. Quando cada hook executa?

Abra ProductCard e seus testes. Preveja a disponibilidade em quatro passos: input stock 2 → clique adicionar → mesmo objeto de input → novo objeto stock 0. Explique onde ngOnChanges ocorre e por que o output não o executa. Acrescente um teste que troca o produto por outro ID sem destruir o card.

Aceitação: teste confere texto e payload emitido; explique a ordem de ngOnChanges/ngOnInit sem atribuir o hook a clique do usuário.

### 2. View versus conteúdo

No modal, identifique o nó pertencente à view e o conteúdo projetado. Desenhe a árvore de criação. Explique por que viewChild não deve consultar antes de AfterViewInit. Acrescente uma opção de título de confirmação e teste no browser com teclado.

Aceitação: título via input, foco inicial seguro, Escape preserva dados, fechamento restaura foco. Não use setTimeout arbitrário para esperar DOM.

## Sessão 2 — providers e identidade

### 3. Quebre e restaure o compartilhamento

Adicione temporariamente `providers: [CartStore]` em CheckoutPage. Adicione produto no catálogo e compare UUIDs. Anote o resultado previsto e observado. Remova esse provider.

Aceitação: explique por que singleton de federation não resolve provider no injector filho. Com o código restaurado, o E2E de identidade passa.

### 4. Imports versus providers

Remova temporariamente BrlPipe dos imports de uma tela; compare o erro com remover ORDER_PROVIDERS das rotas. Classifique erro de compilação do template e erro de resolução de objeto em runtime.

Aceitação: explique import TypeScript, imports standalone, token e provider com quatro frases e exemplos reais.

## Sessão 3 — BehaviorSubject, Signals e RxJS

### 5. Filtro atual após navegação

Busque “mouse”, navegue ao histórico e volte. Antes de rodar, preveja filtros/listagem/controles. Garanta que os controles mostrem o valor atual do store. Não exponha subject nem replique a fonte de verdade em outro store.

Aceitação: novo assinante recebe valor atual; atualizar UI inicial não dispara nova busca redundante; teste navegação e retorno.

### 6. Mutação e computed

Capture `previous = cart.lines()`; adicione outra unidade; verifique o valor antigo, total novo e quantidade nova. Acrescente uma regra de limite de itens distintos (3), se houver espaço, sem mutar arrays.

Aceitação: snapshots anteriores preservados, estoque respeitado, computed deriva total. Não crie BehaviorSubject do carrinho.

### 7. Cancelamento e ordem

Use latência de 1000 ms no laboratório. Digite buscas e observe Network. Clique Separar e Enviar rapidamente. Compare switchMap, concatMap, exhaustMap e mergeMap nos cenários reais.

Aceitação: justifique uma escolha inadequada para cada cenário e descreva a consequência. Não substitua concatMap por switchMap em uma escrita só para “otimizar”.

## Sessão 4 — HTTP e sessão

### 8. Seu primeiro HttpTestingController

Crie teste de OrdersQueryService.detail. Confira URL com ID escapado, método GET, faça flush de um pedido e confira resultado. Adicione 404, depois verify no afterEach.

Aceitação: teste não faz rede, começa observação antes de expectOne, captura erro e confere status. Explique por que flush não é uma chamada do código de produção.

### 9. Refresh concorrente

Leia apenas os contratos de AuthService e interceptors. Escreva teste com três 401 simultâneos: um refresh, três retries com token novo. Adicione refresh 503 e prove que sessão não foi apagada. Depois adicione refresh 401 e prove que ela foi apagada.

Aceitação: nenhuma renovação em 403 nem login/refresh; URL externa nunca recebe token; não há loop se retry der 401.

## Sessão 5 — portas, adapters e núcleo

### 10. Adapter de rejeição

Implemente um adapter OrderPort que sempre rejeita com “manutenção”. Instancie PlaceOrder diretamente no teste. Não importe TestBed/Angular nesse teste de regra.

Aceitação: validação do domínio acontece antes de chamar adapter, rejeição válida propaga, payload não contém estoque/preço informado pelo browser. `npm run check:architecture` passa.

### 11. Diagramas sem confundir setas

Desenhe dois diagramas: execução componente → caso de uso → objeto adapter → API; dependências caso de uso → porta ← adapter. Explique a diferença e o desaparecimento da interface em JavaScript.

Aceitação: porta não executa chamadas; InjectionToken existe em runtime; núcleo não conhece infraestrutura.

### 12. Estoque alterado

Carregue catálogo como cliente em uma aba. Em outra aba admin, reponha estoque menor que a quantidade escolhida. Tente finalizar na primeira aba.

Aceitação: 409 é exibido, nenhuma atualização parcial ocorre, dados do formulário e carrinho permanecem. Explique por que validação frontend não é definitiva.

## Sessão 6 — segurança, performance e entrevista

### 13. 401 não é 403

Acesse `/admin` como cliente pela navegação sem recarregar a aplicação. Depois chame o endpoint admin diretamente com token do cliente em um teste API. Expire token admin e repita consulta protegida.

Aceitação: cliente continua autenticado no 403; API bloqueia; token expirado gera renovação; guards usam UrlTree, não sequência navigate + false.

### 14. Performance e acessibilidade

Na largura 390 px, percorra catálogo/login/checkout só com Tab e Enter. Inspecione lista por IDs, foco do modal, labels CVA e states. Escreva um teste de ausência de overflow horizontal e um teste de teclado da busca.

Aceitação: nenhum input sem nome acessível; conteúdo legível; card identifica produto no botão; explique que tamanho inicial do CLI não inclui todos os bundles externos compartilhados.

### 15. Simulação de entrevista

Sem abrir código, explique o checkout em 90 segundos e responda às perguntas de `entrevista.md`. Depois aponte cada arquivo e rode um teste que sustenta sua explicação.

Aceitação: descreva problema, fluxo, dependências, regra servidor, alternativa e custo. Não use “SOLID” como rótulo sem exemplo concreto.
