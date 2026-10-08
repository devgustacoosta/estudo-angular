# TypeScript usando o portal

O projeto usa `strict` e `strictTemplates`. O compilador verifica tipos do código e ligações do template; os tipos não substituem validação de entrada da API.

## Tipos concretos para explicar

| Código                                    | Conceito                                  | Por que aparece aqui                                                      |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `interface OrderPort`                     | Tipagem estrutural                        | Um objeto com método place compatível pode ser adapter; não exige extends |
| `InjectionToken<OrderPort>`               | Generic                                   | Token é objeto runtime, generic ajuda TypeScript a conferir implementação |
| `role: 'customer' \| 'admin'`             | União literal                             | Impede atribuição acidental de outro perfil no código tipado              |
| `Session \| null`                         | Nullability explícita                     | Antes do login ou após logout não há sessão                               |
| `session()?.user`                         | Optional chaining                         | Leitura segura quando a sessão não existe                                 |
| `Partial<CatalogFilters>`                 | Tipo utilitário                           | Atualiza parte dos filtros sem exigir repetir todos os campos             |
| `readonly CartLine[]` e membros readonly  | Restrição de escrita por tipo             | Consumidores leem; métodos do store criam snapshots novos                 |
| `Parameters<CartStore['setQuantity']>[0]` | Inferência de tipo a partir de método     | Mantém assinatura do evento ligada ao tipo aceito pelo método             |
| `Promise<PlacedOrder>`                    | Resultado assíncrono tipado               | Porta entrega um resultado ou rejeição; núcleo não depende de Observable  |
| `Record`/`Map` conceitualmente            | Chaves dinâmicas versus coleção           | API agrega quantidades por productId em Map                               |
| `unknown` no corpo da ação admin          | Tipo desconhecido sem operações inseguras | Corpo apenas repassado, sem presumir formato em helpers genéricos         |

## Interface não existe em runtime

`OrderPort` desaparece ao compilar TypeScript. `new InjectionToken('ORDER_PORT')` permanece como JavaScript. O constructor de PlaceOrder recebe um objeto que já existe; a interface descreve esse objeto. A factory Angular busca pelo token e fornece o adapter. Não se pode usar `inject(OrderPort)` quando OrderPort é só interface.

## readonly não é validação nem freeze

Uma declaração readonly previne atribuições indevidas no código tipado. Ela não impede consumidor JavaScript ou cast de mutar um objeto profundo em runtime. O portal segue cópias imutáveis e mantém signal/subject privados. Em sistemas maiores, considere snapshots profundamente readonly ou freeze para desenvolvimento, conhecendo custo e limitações.

## Narrowing e erros

O interceptor verifica `error instanceof HttpErrorResponse` antes de ler status. Isso é narrowing runtime. Cast `(event.target as HTMLInputElement)` é uma afirmação para o compilador, não uma checagem real. Aqui eventos são ligados diretamente ao input nativo, o que sustenta essa afirmação. Dados recebidos como JSON precisam de validação no servidor; `http.get<Order>()` não valida que a resposta realmente tem essa forma.

## Exercícios complementares

1. Torne status dos pedidos uma união de três literais; identifique onde será preciso mapear os valores vindos da API.
2. Crie type guard para o contrato remoto antes de usar ORDER_ROUTES; descreva o que verificar em runtime e o que continua sendo responsabilidade do Router.
3. Troque um cast por verificação `instanceof HTMLInputElement` e explique o benefício/custo.
4. Prove em teste que readonly sozinho não congela o snapshot, então proponha uma política de imutabilidade sem duplicar store.

Use tipos para comunicar intenção, não para esconder entrada não validada com `as` ou `any`.
