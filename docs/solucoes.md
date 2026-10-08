# Soluções e pistas — abra após tentar

## 1. Lifecycle

A primeira atribuição de product chama ngOnChanges, com firstChange=true. No clique, o output é entregue ao pai; disponibilidade não muda porque não houve novo input. Mutar stock no mesmo objeto quebra a disciplina imutável e não garante ngOnChanges. Um novo objeto com stock 0 dispara o hook. Use `fixture.componentRef.setInput('product', {...product, stock: 0})` e `fixture.detectChanges()`. ngOnInit roda uma vez depois do primeiro ngOnChanges.

## 2. View/conteúdo

O dialog do template ConfirmComponent é view; o parágrafo fornecido pelo CheckoutPage é conteúdo projetado. `viewChild.required` se torna utilizável após criar view. O ready signal é atualizado em ngAfterViewInit; effect então consulta dialog e chama showModal. O modal já possui title input: troque a atribuição no consumidor e verifique heading. O dialog nativo mantém Tab na área modal; a ação inicial é continuar editando.

## 3. Providers

Com provider no checkout, Angular encontra o injector local antes do root: é outra instância, com UUID diferente e linhas vazias. Native Federation pode ter uma única classe CartStore, mas cada provider pode criar objeto distinto. Remova a redeclaração. `sharedMappings` protege identidade da classe/token entre aplicações; root provider protege escopo de objeto.

## 4. Imports/DI

Sem BrlPipe nos imports, compilação de template falha. Sem ORDER_PROVIDERS, PlaceOrder não tem provider e inject falha na criação de checkout. Import TypeScript oferece símbolo ao arquivo; imports standalone oferece contexto ao template; token identifica dependência; provider liga token ao objeto/factory/classe.

## 5. Filtros

O BehaviorSubject root guarda último filtro. Controles devem começar com esse valor, sem transformá-los em store paralelo. Uma solução é `take(1)` no filters$ e `setValue(..., { emitEvent: false })` antes das subscriptions de valueChanges. Isso mantém UI e stream alinhados na recriação da barra. O projeto inclui esse comportamento para evitar busca aparentemente vazia com resultado filtrado.

## 6. Carrinho

setQuantity filtra as outras linhas e produz uma nova linha. `previous[0].quantity` continua 1 depois de adicionar, enquanto snapshot atual tem 2. Para limite de distintos, antes de criar uma nova linha, confira se ela ainda não existe e se lines().length já é 3; não restrinja aumentar item existente. Teste novo item rejeitado, remoção permitindo outro e total calculado.

## 7. Operadores

switchMap é apropriado a busca: resultados antigos não devem dominar a intenção mais recente. concatMap em busca mostraria buscas antigas em fila. exhaustMap ignora duplicação de submit; mergeMap no checkout deixaria pedidos concorrentes. concatMap nos status preserva ordem; switchMap poderia cancelar observação sem desfazer escrita já recebida. mergeMap limite 2 limita carga das reposições independentes; ordem de término não importa.

## 8. HTTP

Exemplo a adaptar ao fixture de pedido:

```typescript
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: API_URL, useValue: '/api' },
  ],
});
const service = TestBed.inject(OrdersQueryService);
const http = TestBed.inject(HttpTestingController);
let result;
service.detail('pedido/1').subscribe((value) => (result = value));
const request = http.expectOne('/api/orders/pedido%2F1');
expect(request.request.method).toBe('GET');
request.flush(orderFixture);
expect(result).toEqual(orderFixture);
http.verify();
```

Para erro, assine com callback error, flush com status 404 e confira status recebido. `flush` simula resposta no backend de testes; produção usa backend real.

## 9. Refresh

Dispare três GETs. Flush 401 em cada. `expectOne('/api/refresh')` falharia se mais de um refresh existir. Flush nova sessão e use match para capturar retries, verificando Authorization. Refresh 503 não encerra sessão; 401 encerra. Retry 401 termina sem nova renovação porque é feito pelo next interno e não pela entrada inicial do interceptor. Consulte `interceptors.spec.ts` para a versão com duas requisições.

## 10. Porta

```typescript
class MaintenanceAdapter implements OrderPort {
  async place(_request: OrderRequest): Promise<PlacedOrder> {
    throw new Error('manutenção');
  }
}
const useCase = new PlaceOrder(new MaintenanceAdapter());
```

Teste linhas válidas para alcançar adapter; linhas inválidas devem ser rejeitadas antes. Para provar “não chamou”, use adapter com contador. Caso de uso recebe instância concreta por parâmetro tipado como interface; TypeScript não cria interface em runtime.

## 11. Setas

Execução: checkout chama PlaceOrder.execute; ele valida e chama `this.orders.place`; o método concreto executa HTTP e Promise volta. Dependências: PlaceOrder importa OrderPort e domínio; adapter importa OrderPort e HttpClient; composição importa ambos. Nada no caso de uso importa adapter.

## 12. Estoque

O catálogo é um snapshot. O domínio só pode antecipar feedback com esse snapshot. A API agrega produtos repetidos, confere estoque e preço reais, depois desconta todos sem await no trecho crítico. 409 volta pela Promise e catchError; carrinho só é limpo no sucesso. Recarregue catálogo para estoque atualizado. Em várias instâncias seria necessária transação no banco.

## 13. Permissões

403 deixa session store intacto. CanMatch retorna UrlTree para página de permissão, evitando tentar rota alternativa como false poderia fazer. Token expirado recebe 401 e inicia refresh; refresh inválido apaga sessão. API exige role independentemente do guard.

## 14. Acessibilidade/performance

CVA usa fieldId para atribuir ID ao input nativo, evitando ID duplicado no host customizado. Label aponta para input. `showModal` + autofocus + restauração de foco cobre interação do modal. Pipe moeda aceita centavos, lista usa track ID, OnPush acompanha signals e input imutável. Teste overflow comparando `document.documentElement.scrollWidth` com largura da viewport. Auditoria automática não prova conformidade completa.

## 15. Resposta de 90 segundos

“O checkout coleta entrega em formulário reativo e envia um snapshot do carrinho root compartilhado. O exhaustMap ignora submits enquanto o primeiro está ativo. Um caso de uso puro valida linhas e usa uma porta de finalização. Angular injeta o adapter HTTP por InjectionToken; o adapter de memória permite testar sem HTTP. A API autentica e valida estoque/preços definitivamente, com atualização indivisível no processo local. Só no sucesso limpo o carrinho e navego para detalhes. Um 409 preserva os dados, um 401 tenta refresh único, e um 403 informa falta de permissão sem deslogar. Para produção eu acrescentaria persistência transacional, idempotência e autenticação robusta.”
